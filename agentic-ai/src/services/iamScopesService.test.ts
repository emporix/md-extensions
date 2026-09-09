import { describe, expect, it } from 'vitest'
import { parseMyIamScopes } from './iamScopesService'

describe('parseMyIamScopes', () => {
  it('returns empty for missing or blank scopes', () => {
    expect(parseMyIamScopes(undefined)).toEqual([])
    expect(parseMyIamScopes(null)).toEqual([])
    expect(parseMyIamScopes('')).toEqual([])
    expect(parseMyIamScopes('   ')).toEqual([])
  })

  it('splits space-separated scopes and drops tenant claims', () => {
    expect(
      parseMyIamScopes(
        'order.order_read tenant=mstobdev product.product_read tenant=other'
      )
    ).toEqual([{ id: 'order.order_read' }, { id: 'product.product_read' }])
  })

  it('parses users/me/scopes response body', () => {
    const body = {
      userId: '2105e288-143f-4b9b-9b9f-30b0c261146b',
      scopes:
        'language.language_read configuration.configuration_view product.product_template_read sepaexport.job_view ai.agent_read unithandling.unit_read shipping.shipping_read order.order_read iam.template_read extension.extension_read category.category_read_unpublished vendor.vendor_read site.site_read iam.scope_read systempref.systempref_read media.asset_read payment-gateway.paymentmodes_read price.price_read webhook.subscription_read customer.customer_read customermanagement.location_read price.pricemodel_read cart.cart_manage_closed delivery.time_read payment-gateway.paymenttransactions_read iam.group_read label.label_read html2pdf.html2pdf_read sepaexport.media_view customermanagement.contactassignment_read cart.cart_manage delivery.area_read currency.currency_read tax.tax_read html2pdf.html2pdf_search product.product_read_unpublished order.history_view brand.brand_read customersegment.segment_read returns.returns_read catalog.catalog_view iam.user_read supplier.supplier_read price.pricelist_read coupon.coupon_read schema.schema_read order.order_readascustomer quote.quote_read availability.availability_view customermanagement.legalentity_read schema.custominstance_read tenant=mstobdev',
    }

    const parsed = parseMyIamScopes(body.scopes)

    expect(parsed).toHaveLength(51)
    expect(parsed[0]).toEqual({ id: 'ai.agent_read' })
    expect(parsed).toContainEqual({ id: 'order.order_read' })
    expect(parsed.some((scope) => scope.id.startsWith('tenant='))).toBe(false)
  })

  it('deduplicates and sorts scope ids', () => {
    expect(
      parseMyIamScopes(
        'product.product_read order.order_read product.product_read'
      )
    ).toEqual([{ id: 'order.order_read' }, { id: 'product.product_read' }])
  })
})
