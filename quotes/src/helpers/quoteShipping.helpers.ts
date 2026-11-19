import { Fee, ShippingMethod, Zone } from '../models/Shipping.model'

/** Methods of the zones that ship to the country, each tagged with its zone. */
export const getZoneShippingMethods = (
  zones: readonly Zone[],
  countryCode: string | undefined
): ShippingMethod[] =>
  zones
    .filter((zone) =>
      zone.shipTo.find((shipTo) => shipTo.country === countryCode)
    )
    .map(
      (zone) =>
        zone.methods?.map((method) => ({ ...method, zoneId: zone.id })) || []
    )
    .reduce<ShippingMethod[]>((acc, methods) => [...acc, ...methods], [])

/**
 * Methods that can be offered on a quote: they need a shipping tax code, and a
 * non-zero maximum order value in the quote currency caps the subtotal.
 */
export const filterQuoteShippingMethods = (
  methods: readonly ShippingMethod[],
  subtotal: number,
  currency: string | undefined
): ShippingMethod[] =>
  methods
    .filter((method) => method.shippingTaxCode)
    .filter((method) => {
      if (
        method.maxOrderValue?.amount &&
        method.maxOrderValue?.amount !== 0 &&
        method.maxOrderValue?.currency === currency
      ) {
        return subtotal <= method.maxOrderValue.amount
      }
      return true
    })

/** The cheapest fee whose minimum order value is reached, else the first fee. */
export const selectShippingFee = (
  method: ShippingMethod,
  subtotal: number
): Fee =>
  method.fees
    .filter((fee) => subtotal >= fee.minOrderValue.amount)
    .sort((a, b) => a.cost.amount - b.cost.amount)[0] || method.fees[0]
