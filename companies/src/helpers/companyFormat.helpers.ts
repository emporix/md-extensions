import type { Customer } from '../models/LegalEntity.model'

/** MD `helpers/utils` `formatCustomerName`. */
export const formatCustomerName = (customer: Customer | undefined) =>
  `${(customer && customer.name) || ''} ${(customer && customer.surname) || ''}`

/** MD `helpers/utils` `formatAddress`. */
export const formatAddress = (contactDetails: {
  addressLine1?: string
  addressLine2?: string
  city?: string
  postcode?: string | number
  countryCode?: string
}) => {
  const getStringValue = (val?: string | number) => (val ? `${val},` : '')

  return `${getStringValue(contactDetails.addressLine1)} ${getStringValue(
    contactDetails.addressLine2
  )} ${getStringValue(contactDetails.city)} ${getStringValue(
    contactDetails.postcode
  )} ${getStringValue(contactDetails.countryCode)}`.replace(/,*$/, '')
}
