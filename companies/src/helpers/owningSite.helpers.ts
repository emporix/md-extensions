import type { Customer } from '../models/Customer.model'
import type { Site } from '../models/Site.model'

/** Tenant configuration key: whether a customer account is unique per tenant or per site. */
export const CUSTOMER_ACCOUNT_SCOPE_KEY = 'customerAccountScope'

/** MD `RestrictionsProvider.parseCustomerRestrictions` scopes. */
export const CUSTOMER_RESTRICTION_SCOPES = [
  'customer.customer_manage',
  'customer.customer_read',
]

/** How the owning-site (`siteCode`) field behaves on the contact form. */
export type OwningSiteMode = 'hidden' | 'required' | 'readOnly'

/**
 * Same rule as the customers remote: only a tenant whose
 * `customerAccountScope` is exactly `SITE` has an owning site, chosen on
 * create and fixed afterwards. `TENANT`, a missing or unreadable key, or any
 * other value hides the field.
 */
export const getOwningSiteMode = (
  accountScope: unknown,
  isCreate: boolean
): OwningSiteMode => {
  if (accountScope !== 'SITE') return 'hidden'
  return isCreate ? 'required' : 'readOnly'
}

/**
 * Copy of the customers remote `getSiteOptions`: with restrictions synced to
 * site codes, a restricted user only gets the sites they may use.
 */
export const getSiteOptions = (
  sites: Site[],
  enableSync: boolean,
  customerRestrictions: string[] | null
) =>
  sites
    .filter(
      (site) =>
        !(enableSync && customerRestrictions !== null) ||
        customerRestrictions.includes(site.code)
    )
    .map((site) => ({ label: `${site.name} - ${site.code}`, value: site.code }))

/**
 * The customer created for a contact carries the owning site only when the
 * form asks for it: the customer service rejects it in `TENANT` scope.
 */
export const toContactCustomerPayload = (
  customer: Customer,
  owningSiteMode: OwningSiteMode
): Customer => {
  const { siteCode, ...payload } = customer
  return owningSiteMode === 'required' && siteCode
    ? { ...payload, siteCode }
    : payload
}
