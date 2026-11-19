import { usePricesApi } from './api/prices'
import { Item, Quote } from '../models/Quotes.model'
import { PriceMatchRequest } from '../models/Price.model'

/** MD `useQuotesMatchPrices`: prices quote lines through match-prices. */
export const useQuotesMatchPrices = () => {
  const { matchPrices } = usePricesApi()

  const getPriceForQuoteItems = async (
    quote: Quote,
    itemList: Partial<Item>[]
  ) => {
    const matchPricesRequestBody: PriceMatchRequest = {
      targetCurrency: quote.currency,
      siteCode: quote.siteCode,
      targetLocation: {
        countryCode: quote.shippingAddress?.countryCode || '',
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

      return {
        ...item,
        quantity: {
          quantity: item.quantity?.quantity || 1,
          unitCode: item.quantity?.unitCode || price?.quantity?.unitCode || '',
        },
        price: {
          priceId: price?.priceId || '',
          unitPrice: price?.originalValue || 0,
          newUnitPrice: price?.originalValue || 0,
          totalNetValue: item.price?.totalNetValue || price?.originalValue || 0,
          tax: {
            taxClass: price?.tax?.taxClass || '',
            taxRate: price?.tax?.taxRate || 0,
          },
          discount: item.price?.discount || 0,
        },
      }
    })

    return itemsWithPrices
  }

  return { getPriceForQuoteItems }
}
