import { usePricesApi } from './api/prices'
import { Item, Quote } from '../models/Quotes.model'
import { PriceMatchRequest } from '../models/Price.model'
import { Site } from '../models/Site.model'
import { useSites } from '../context/SitesProvider'

/*
 * MD `useQuotesMatchPrices`: prices quote lines through match-prices. Quotes
 * without a shipping address and products without a price follow COP-7125
 * (emporix/management-dashboard#1707).
 */

const NO_SHIP_TO_COUNTRY = 'NoShipToCountryError'

/**
 * Thrown when no country can be determined for the price match: the quote has
 * no shipping address and the quote's site has no ship-to countries.
 */
export const createNoShipToCountryError = (): Error => {
  const error = new Error('No ship-to country for the quote')
  error.name = NO_SHIP_TO_COUNTRY
  return error
}

export const isNoShipToCountryError = (e: unknown): boolean =>
  e instanceof Error && e.name === NO_SHIP_TO_COUNTRY

/** The parts of a price-v2 match that a quote item uses. */
interface MatchedPrice {
  readonly priceId: string
  readonly originalValue: number
  readonly tax?: { readonly taxClass?: string; readonly taxRate?: number }
}

const buildQuantity = (item: Partial<Item>, matchedUnitCode?: string) => ({
  quantity: item.quantity?.quantity || 1,
  // The quote service requires `unitCode` (not null), so send '' when unknown.
  unitCode: item.quantity?.unitCode || matchedUnitCode || '',
})

const buildTax = (price: MatchedPrice, includeTaxRate: boolean) => {
  if (!price.tax?.taxClass) return {}
  return includeTaxRate
    ? { tax: { taxClass: price.tax.taxClass, taxRate: price.tax.taxRate } }
    : { tax: { taxClass: price.tax.taxClass } }
}

/**
 * Price of a new quote item built from a price-v2 match.
 *
 * The quote service requires `tax.taxClass` for a catalog price (one with a
 * `priceId`), so the tax class is always sent when the match has one.
 *
 * @param includeTaxRate false when the quote has no shipping address. price-v2
 * needs a country to match a catalog price, so such a quote is matched with a
 * fallback country (see `resolveMatchCountry`) and the rate returned belongs
 * to that country, not to the customer. It must not enter the quote, so only
 * the class is sent; it is just a label. The quote service calculates rate
 * and gross itself once a shipping address is set, so until then the quote
 * holds net values only. A match without tax (or with a blank class) sends no
 * `tax`; the service then answers 400 and the employee sees its message.
 */
const buildPrice = (
  item: Partial<Item>,
  price: MatchedPrice,
  includeTaxRate: boolean
) => ({
  priceId: price.priceId,
  unitPrice: price.originalValue,
  newUnitPrice: price.originalValue,
  totalNetValue: item.price?.totalNetValue || price.originalValue,
  ...buildTax(price, includeTaxRate),
  discount: item.price?.discount || 0,
})

/**
 * Country used for the price match, in this order: the country of the
 * quote's shipping address; then the country of the home base of the quote's
 * own site (found by `quote.siteCode`, not the currently selected site, which
 * may differ), when the site ships to it; then the first ship-to country of
 * that site. price-v2 rejects an empty or blank country with HTTP 400, so a
 * blank candidate is skipped.
 *
 * @returns the country code, or undefined when none exists; the caller must
 * then not call price-v2 and tell the employee to set ship-to countries.
 */
export const resolveMatchCountry = (
  quote: Quote,
  sites: readonly Site[] | null | undefined
): string | undefined => {
  const site = sites?.find((candidate) => candidate.code === quote.siteCode)
  const shipTo = (site?.shipToCountries ?? []).map((code) => code?.trim())
  const homeBase = site?.homeBase?.address?.country?.trim()
  // The ship-to entry is returned, so price-v2 gets the code as the site spells it.
  const homeBaseShipped = homeBase
    ? shipTo.find((code) => code?.toUpperCase() === homeBase.toUpperCase())
    : undefined
  return [
    quote.shippingAddress?.countryCode?.trim(),
    homeBaseShipped,
    shipTo[0],
  ].find(Boolean)
}

/** Whether the match falls back to a country of the site (no shipping country). */
export const usesFallbackMatchCountry = (quote: Quote): boolean =>
  !quote.shippingAddress?.countryCode?.trim()

export const useQuotesMatchPrices = () => {
  const { matchPrices } = usePricesApi()
  const { sites } = useSites()

  const getPriceForQuoteItems = async (
    quote: Quote,
    itemList: Partial<Item>[]
  ) => {
    const countryCode = resolveMatchCountry(quote, sites)
    if (!countryCode) throw createNoShipToCountryError()

    const matchPricesRequestBody: PriceMatchRequest = {
      targetCurrency: quote.currency,
      siteCode: quote.siteCode,
      targetLocation: {
        countryCode,
      },
      items: itemList.map((item) => {
        return {
          itemId: {
            itemType: 'PRODUCT',
            id: item.product?.productId || '',
          },
          quantity: {
            quantity: item.quantity?.quantity || 1,
          },
        }
      }),
    }

    const matchPricesData = await matchPrices(matchPricesRequestBody)
    const itemsWithPrices = itemList.map((item) => {
      let price = matchPricesData.find(
        (priceData) => priceData.itemId.id === item?.product?.productId
      )

      if (!price) {
        price = matchPricesData.find((priceData) =>
          item.product?.productId.startsWith(priceData.itemId.id + '--')
        )
      }

      // A product without a price list entry stays unpriced ("Price on
      // request"): no placeholder price is built.
      return {
        ...item,
        quantity: buildQuantity(item, price?.quantity?.unitCode),
        ...(price
          ? {
              price: buildPrice(
                item,
                price,
                !!quote.shippingAddress?.countryCode?.trim()
              ),
            }
          : {}),
      }
    })

    return itemsWithPrices
  }

  return { getPriceForQuoteItems }
}
