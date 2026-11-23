import type {
  Site as ApiSite,
  SiteCreate,
  SitePatch,
  SiteServiceConfiguration,
  SiteUpdate,
} from '@emporix/api-calls/next'

/** A site as the Site Service returns it (`@emporix/api-calls/next`). */
export type Site = ApiSite
export type { SiteCreate, SitePatch, SiteUpdate }

/** A payment service configured for a site (MD `PaymentMethod`). */
export type PaymentMethod = SiteServiceConfiguration

export enum TaxDeterminationBasedOn {
  BILLING = 'BILLING_ADDRESS',
  SHIPPING = 'SHIPPING_ADDRESS',
}
