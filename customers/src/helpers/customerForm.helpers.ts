import { Customer, CustomerBusinessModel } from '../models/Customer.model'
import type { Site } from '../models/Site.model'

/** MD `RestrictionsProvider.parseCustomerRestrictions` scopes. */
export const CUSTOMER_RESTRICTION_SCOPES = [
  'customer.customer_manage',
  'customer.customer_read',
]

/** MD `CustomersAddEdit` `DEFAULT_CUSTOMER`. */
export const DEFAULT_CUSTOMER: Customer = {
  customerNumber: '',
  firstName: '',
  lastName: '',
  businessModel: CustomerBusinessModel.B2B,
  b2b: {
    legalEntities: [],
    companyRegistrationId: null,
  },
  active: false,
  contactEmail: '',
  contactPhone: '',
  onHold: false,
  preferredCurrency: '',
  preferredLanguage: '',
  preferredSite: '',
  title: 'MR',
  metadata: {
    mixins: {},
    version: 1,
  },
  addresses: [],
}

/** MD `TOGGLE_TITLE`. */
export const TITLE_OPTIONS = ['MRS', 'MS', 'MR'].map((title) => ({
  label: title,
  value: title,
}))

export const PASSWORD_MIN_LENGTH = 6
const GENERATED_PASSWORD_LENGTH = 12
const PASSWORD_CHARSET =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'

/** MD `generateRandomPassword`: 12 characters from a mixed charset. */
export const generateRandomPassword = (random: () => number = Math.random) => {
  let password = ''
  for (let i = 0; i < GENERATED_PASSWORD_LENGTH; i++) {
    password += PASSWORD_CHARSET.charAt(
      Math.floor(random() * PASSWORD_CHARSET.length)
    )
  }
  return password
}

/** MD `reloadData`: mixin containers always exist on a loaded customer. */
export const withMixinContainers = (customer: Customer): Customer => ({
  ...customer,
  mixins: customer.mixins ?? {},
  metadata: {
    ...(customer.metadata ?? {}),
    mixins: (customer.metadata?.mixins as Record<string, string>) ?? {},
  },
})

/**
 * MD `onSubmit`: an empty restriction is sent as `null` (clears it) and an
 * empty password is left out.
 */
export const toCustomerPayload = (customer: Customer): Customer => {
  const payload = { ...customer }
  payload.restriction = payload.restriction || null
  if (payload.password === '') {
    payload.password = undefined
  }
  return payload
}

/**
 * MD `sitesDropdownOptions`: with restrictions synced to site codes, a
 * restricted user only gets the sites they may use.
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

/** MD `fetchRestrictions`: configured restrictions the user may assign. */
export const getRestrictionOptions = (
  configured: unknown,
  customerRestrictions: string[] | null
) => {
  if (!Array.isArray(configured)) return []
  return (configured as string[])
    .filter(
      (restriction) =>
        customerRestrictions === null ||
        customerRestrictions.includes(restriction)
    )
    .map((restriction) => ({ label: restriction, value: restriction }))
}

/** MD `AssistedBuying`: sites with an assisted-buying storefront URL. */
export const getAssistedBuyingSites = (sites: Site[]) =>
  sites.filter((site) => Boolean(site?.assistedBuying?.storefrontUrl))

export type AssistedBuyingLogin = {
  accessToken: string
  expiresIn: string | number
  refreshToken: string
  refreshTokenExpiresIn: string | number
  saasToken: string
}

/** MD `AssistedBuying` storefront URL: the login tokens as query params. */
export const buildAssistedBuyingUrl = (
  storefrontUrl: string,
  login: AssistedBuyingLogin
) => {
  const url = new URL(storefrontUrl)
  url.searchParams.append('customerToken', login.accessToken)
  url.searchParams.append('customerTokenExpiresIn', String(login.expiresIn))
  url.searchParams.append('refreshToken', login.refreshToken)
  url.searchParams.append(
    'refreshTokenExpiresIn',
    String(login.refreshTokenExpiresIn)
  )
  url.searchParams.append('saasToken', login.saasToken)
  return url.toString()
}
