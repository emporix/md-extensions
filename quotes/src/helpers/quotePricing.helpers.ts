import {
  Item,
  Price,
  Quote,
  QuoteEditOp,
  QuoteStatus,
  QuoteUpdateRequest,
  QuoteUpdateStatusValue,
  Shipping,
} from '../models/Quotes.model'

/*
 * Pricing of quotes that may hold items without a price or have no address
 * yet (COP-7125, ported from MD `src/components/quotes/quotePricing.helpers.ts`
 * of emporix/management-dashboard#1707).
 */

const isUnpriced = (item: Item) => !item.price

export const countUnpricedItems = (items: readonly Item[]): number =>
  items.filter(isUnpriced).length

export interface QuoteOpenBlockers {
  readonly unpricedItems: number
  readonly addressMissing: boolean
}

/**
 * What keeps a quote from being OPEN: the quote service rejects it while an
 * item has no price or the billing or the shipping address is missing.
 */
export const getQuoteOpenBlockers = (
  quote: Pick<Quote, 'items' | 'billingAddress' | 'shippingAddress'>
): QuoteOpenBlockers => ({
  unpricedItems: countUnpricedItems(quote.items ?? []),
  addressMissing: !quote.billingAddress || !quote.shippingAddress,
})

/** True while the quote service would reject it as OPEN. */
export const isQuoteIncomplete = (
  quote: Pick<Quote, 'items' | 'billingAddress' | 'shippingAddress'>
): boolean => {
  const { unpricedItems, addressMissing } = getQuoteOpenBlockers(quote)
  return unpricedItems > 0 || addressMissing
}

/** The row's tax rate as `19%`, blank while the backend has not set one. */
export const formatTaxRate = (item: Item): string => {
  const rate = item.price?.tax?.taxRate
  return typeof rate === 'number' ? `${rate}%` : ''
}

/** Discount in % of the list price; 0 without a usable unit price. */
export const calculateDiscount = (
  unitPrice: number | undefined,
  newUnitPrice: number
): number => {
  if (!unitPrice || !Number.isFinite(unitPrice)) return 0
  return ((unitPrice - newUnitPrice) / unitPrice) * 100
}

export const grossFromNet = (net: number, taxRate = 0): number =>
  net * (1 + taxRate / 100)

/** Gross sum of the priced rows; unpriced rows are not part of it. */
export const sumGrossValues = (items: readonly Item[]): number =>
  items.reduce(
    (acc, item) =>
      item.price
        ? acc +
          grossFromNet(item.price.totalNetValue || 0, item.price.tax?.taxRate)
        : acc,
    0
  )

export const sumNetValues = (items: readonly Item[]): number =>
  items.reduce((acc, item) => acc + (item.price?.totalNetValue || 0), 0)

const toCents = (amount?: number) =>
  typeof amount === 'number' ? Math.round(amount * 100) : amount

/**
 * Whether two shipping selections are the same method with the same fee.
 * Amounts are compared in cents: the quote service stores them rounded to 2
 * decimals while the tax service returns the raw gross.
 */
export const isSameShipping = (a?: Shipping, b?: Shipping): boolean => {
  if (!a || !b) return !a && !b
  return (
    a.methodId === b.methodId &&
    toCents(a.value) === toCents(b.value) &&
    toCents(a.grossValue) === toCents(b.grossValue)
  )
}

/** "Same as shipping" only when both addresses exist and are the same. */
export const hasSameAddresses = (
  shipping?: { id: string } | null,
  billing?: { id: string } | null
): boolean => !!shipping && !!billing && shipping.id === billing.id

export const isExternalPrice = (price?: Price | null): boolean =>
  price?.type === 'EXTERNAL'

/**
 * Whether the backend returned a tax rate for every priced row. A missing
 * rate is not a missing address: an EXTERNAL price without a tax class stays
 * net only even when the quote has a shipping address, and then the gross
 * must not be shown (a default rate of 0 would show gross equal to net).
 */
export const hasTaxCalculated = (items: readonly Item[]): boolean =>
  items.every(
    (item) => !item.price || typeof item.price.tax?.taxRate === 'number'
  )

/**
 * Form values of the loaded items: a priced row without `tax` gets
 * `tax: { taxClass: null }`. The form compares its values with the defaults
 * key by key, so a class chosen for a price that had none is only noticed when
 * the slot exists. The empty slot never reaches the service
 * (see `buildItemsUpdateOperations`, which omits a blank `tax`).
 */
export const withEditableTax = (items: readonly Item[]): Item[] =>
  items.map((item) =>
    item.price && !item.price.tax
      ? { ...item, price: { ...item.price, tax: { taxClass: null } } }
      : item
  )

const hasClass = (taxClass?: string | null): taxClass is string =>
  typeof taxClass === 'string' && taxClass.trim() !== ''

/**
 * The quote service answers 400 for `tax: { taxClass: null }`: with no class
 * the whole `tax` object is omitted. A class that differs from the loaded one
 * is sent as the class only (rate and prices are calculated by the service).
 */
const sanitizePrice = (
  price: Price | null | undefined,
  loadedClass?: string | null
) => {
  if (!price) return price ?? null
  const { tax, ...rest } = price
  const taxClass = tax?.taxClass
  if (!hasClass(taxClass)) return rest
  if (taxClass === loadedClass) return price
  return { ...rest, tax: { taxClass } }
}

const sanitizeItem = (item: Item, loaded?: Item): Item => ({
  ...item,
  price: sanitizePrice(
    item.price,
    loaded?.price?.tax?.taxClass
  ) as Price | null,
})

const enteredNetValue = (loaded: Item, entered?: number | null) =>
  !loaded.price && typeof entered === 'number' ? entered : undefined

const externalItem = (
  item: Item,
  totalNetValue: number,
  taxClass?: string | null
): Item => ({
  ...item,
  price: {
    type: 'EXTERNAL',
    totalNetValue,
    ...(hasClass(taxClass) ? { tax: { taxClass } } : {}),
  } as Price,
})

/**
 * Operations for the items of the Preview tab.
 *
 * - The whole-list REPLACE /items echo is sent first, and only when item data
 *   changed (quantity, amount or discount of a priced row, tax class of an
 *   existing price). A blank tax class never reaches it.
 * - A net price entered by hand for an item WITHOUT a price is sent as
 *   REPLACE /items/{itemId} with the whole item and an EXTERNAL price (`type`,
 *   `totalNetValue`, no `priceId`; `tax` only when a class is chosen). It is
 *   not sent to /items/{itemId}/price, which only changes the amount of an
 *   existing price.
 */
export const buildItemsUpdateOperations = (
  loaded: readonly Item[],
  current: readonly Item[],
  enteredNetValues: readonly (number | null | undefined)[],
  enteredTaxClasses: readonly (string | null | undefined)[] = []
): QuoteUpdateRequest[] => {
  const itemOps: QuoteUpdateRequest[] = []
  let echoNeeded = false
  const echo = current.map((item, i) => {
    const loadedItem = loaded[i]
    const net = enteredNetValue(loadedItem, enteredNetValues[i])
    const echoed = sanitizeItem(
      { ...item, price: item.price ?? null },
      loadedItem
    )
    if (net !== undefined) {
      itemOps.push({
        op: QuoteEditOp.replace,
        path: `/items/${item.itemId}`,
        value: externalItem(item, net, enteredTaxClasses[i]),
      })
      echoed.price = loadedItem.price ?? null
    }
    if (
      JSON.stringify(echoed) !==
      JSON.stringify(
        sanitizeItem(
          { ...loadedItem, price: loadedItem.price ?? null },
          loadedItem
        )
      )
    ) {
      echoNeeded = true
    }
    return echoed
  })
  const ops: QuoteUpdateRequest[] = []
  if (echoNeeded) {
    ops.push({ op: QuoteEditOp.replace, path: '/items', value: echo })
  }
  return [...ops, ...itemOps]
}

/** OPEN → IN_PROGRESS; reason and comment only when given. */
export const buildStartNegotiationPayload = (
  quoteReasonId: string | undefined,
  comment: string
): QuoteUpdateStatusValue => ({
  value: QuoteStatus.IN_PROGRESS,
  ...(quoteReasonId ? { quoteReasonId } : {}),
  ...(comment.trim() ? { comment } : {}),
})
