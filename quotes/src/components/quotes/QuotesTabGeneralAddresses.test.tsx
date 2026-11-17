/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import QuotesTabGeneralAddresses from './QuotesTabGeneralAddresses'
import type { QuoteGeneralForm } from '../../helpers/quoteGeneralForm.helpers'
import type { Location } from '../../models/LegalEntity.model'

const addresses = [
  {
    id: 'hq',
    name: 'HQ',
    contactDetails: { addressLine1: 'Main 1', city: 'Berlin' },
  },
  {
    id: 'wh',
    name: 'Warehouse',
    contactDetails: { addressLine1: 'Side 2', city: 'Berlin' },
  },
] as unknown as Location[]

/** Shipping and billing lists of one quote whose two addresses differ. */
const ShippingAndBilling = () => {
  const { control } = useForm<QuoteGeneralForm>({
    defaultValues: { shippingAddressId: 'wh', billingAddressId: 'hq' },
  })
  return (
    <>
      <QuotesTabGeneralAddresses
        addresses={addresses}
        control={control}
        name="shippingAddressId"
      />
      <QuotesTabGeneralAddresses
        addresses={addresses}
        control={control}
        name="billingAddressId"
      />
    </>
  )
}

const radio = (id: string) => document.getElementById(id) as HTMLInputElement

describe('QuotesTabGeneralAddresses', () => {
  afterEach(cleanup)

  it('shows the shipping and the billing pick at the same time', () => {
    render(<ShippingAndBilling />)

    // CL RadioButton draws its state from the native input, so the two lists
    // must not share one radio group.
    expect(radio('shippingAddressIdwh').checked).toBe(true)
    expect(radio('shippingAddressIdhq').checked).toBe(false)
    expect(radio('billingAddressIdhq').checked).toBe(true)
    expect(radio('billingAddressIdwh').checked).toBe(false)
  })
})
