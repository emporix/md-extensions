import { ContactAssignment, LegalEntity } from '../models/LegalEntity.model'
import {
  CustomerBusinessModel,
  QuoteCreateRequest,
  QuoteCustomer,
  QuoteEditOp,
  QuoteUpdateRequest,
} from '../models/Quotes.model'

export interface QuoteGeneralForm {
  businessModel: CustomerBusinessModel
  company: LegalEntity | undefined
  contactPerson: ContactAssignment | undefined
  shippingAddressId: string
  billingAddressId: string
  sameAddresses: boolean
  customer: QuoteCustomer | undefined
  restriction?: string | null
}

export interface QuoteDraftContext {
  readonly isB2B: boolean
  readonly siteCode: string | undefined
  readonly currency: string | undefined
}

/**
 * Create request of the General tab. Site and currency come from the selected
 * site; the customer is the B2B contact's customer or the chosen B2C customer.
 * Address ids are omitted, never sent as "", when none is chosen: a quote can
 * be created for a party without addresses (COP-7125).
 */
export const buildQuoteCreateRequest = (
  data: QuoteGeneralForm,
  { isB2B, siteCode, currency }: QuoteDraftContext
): Partial<QuoteCreateRequest> => ({
  siteCode: siteCode as string,
  currency: currency as string,
  customerId: isB2B
    ? data.contactPerson?.customer.id
    : data?.customer?.customerId,
  legalEntityId: isB2B ? data.company?.id : undefined,
  ...(data.shippingAddressId
    ? { shippingAddressId: data.shippingAddressId }
    : {}),
  ...(data.billingAddressId ? { billingAddressId: data.billingAddressId } : {}),
  restriction: data.restriction ? data.restriction : null,
})

export interface QuoteGeneralEditContext {
  readonly isB2B: boolean
  /** The saved quote references its company by `legalEntityId`. */
  readonly hasLegalEntityId: boolean
}

/**
 * Edit operations of the General tab for the changed fields. A B2C quote
 * always drops its company link (`/legalEntityId`, or `/companyName` on quotes
 * that only carry a company name).
 */
export const buildQuoteGeneralEditOperations = (
  data: QuoteGeneralForm,
  dirtyFields: Partial<Record<keyof QuoteGeneralForm, unknown>>,
  { isB2B, hasLegalEntityId }: QuoteGeneralEditContext
): QuoteUpdateRequest[] => {
  const operations: QuoteUpdateRequest[] = []

  if ('company' in dirtyFields && isB2B && data.company?.id) {
    operations.push({
      op: QuoteEditOp.replace,
      path: '/legalEntityId',
      value: data.company.id,
    })
  }
  if (!isB2B) {
    operations.push(
      hasLegalEntityId
        ? { op: QuoteEditOp.remove, path: '/legalEntityId', value: null }
        : { op: QuoteEditOp.remove, path: '/companyName', value: null }
    )
  }
  if ('contactPerson' in dirtyFields && isB2B) {
    operations.push({
      op: QuoteEditOp.replace,
      path: '/customerId',
      value: data.contactPerson?.customer?.id,
    })
  }
  if ('customer' in dirtyFields && !isB2B) {
    operations.push({
      op: QuoteEditOp.replace,
      path: '/customerId',
      value: data?.customer?.customerId,
    })
  }
  // Only a chosen id is sent (COP-7125: a party may have no addresses). No
  // clear operation is needed: the quote service drops both addresses itself
  // when `REPLACE /legalEntityId` targets a company without locations.
  if ('billingAddressId' in dirtyFields && data.billingAddressId) {
    operations.push({
      op: QuoteEditOp.replace,
      path: '/billingAddressId',
      value: data.billingAddressId,
    })
  }
  if ('shippingAddressId' in dirtyFields && data.shippingAddressId) {
    operations.push({
      op: QuoteEditOp.replace,
      path: '/shippingAddressId',
      value: data.shippingAddressId,
    })
  }
  if ('restriction' in dirtyFields) {
    operations.push(
      data.restriction
        ? {
            op: QuoteEditOp.replace,
            path: '/restriction',
            value: data.restriction,
          }
        : { op: QuoteEditOp.remove, path: '/restriction', value: null }
    )
  }

  return operations
}
