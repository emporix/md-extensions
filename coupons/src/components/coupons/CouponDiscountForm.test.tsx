/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import CouponDiscountForm from './CouponDiscountForm'
import {
  createCouponForm,
  type CouponFormFields,
} from '../../helpers/couponForm.helpers'
import '../../translations/i18n'

vi.mock('../../hooks/useCouponPermissions', () => ({
  default: () => ({ canManage: true }),
}))

vi.mock('../../context/Currency.provider', () => ({
  useCurrencyContext: () => ({
    selectedCurrency: { code: 'EUR' },
    currenciesDropdownOptions: [{ value: 'EUR', label: 'EUR' }],
  }),
}))

const PercentageValue = () => {
  const value = useWatch<CouponFormFields>({ name: 'discountPercentage' })
  return <output data-testid="stored-percentage">{String(value)}</output>
}

let triggerValidation: () => Promise<boolean> = async () => true

const Harness = () => {
  const methods = useForm<CouponFormFields>({
    defaultValues: { ...createCouponForm(), discountType: 'PERCENT' },
  })
  triggerValidation = () => methods.trigger('discountPercentage')
  return (
    <FormProvider {...methods}>
      <CouponDiscountForm />
      <PercentageValue />
    </FormProvider>
  )
}

const percentageInput = () =>
  screen
    .getByTestId('percentage-discount-input')
    .querySelector('input') as HTMLInputElement

const typeDigits = (input: HTMLInputElement, digits: string) => {
  input.focus()
  for (const digit of digits) {
    fireEvent.keyPress(input, {
      key: digit,
      code: `Digit${digit}`,
      charCode: digit.charCodeAt(0),
      which: digit.charCodeAt(0),
    })
  }
  fireEvent.blur(input)
}

describe('CouponDiscountForm — percentage discount', () => {
  afterEach(() => cleanup())

  it('stores the typed percentage in the form', async () => {
    render(<Harness />)

    typeDigits(percentageInput(), '25')

    expect(screen.getByTestId('stored-percentage').textContent).toBe('25')
    await act(async () => {
      expect(await triggerValidation()).toBe(true)
    })
    expect(
      screen.queryByText('Enter a percentage between 0 and 100')
    ).toBeNull()
  })

  it('keeps a percentage above 100 and shows the range error', async () => {
    render(<Harness />)

    typeDigits(percentageInput(), '150')

    expect(screen.getByTestId('stored-percentage').textContent).toBe('150')
    await act(async () => {
      expect(await triggerValidation()).toBe(false)
    })
    expect(
      screen.getByText('Enter a percentage between 0 and 100')
    ).toBeTruthy()
  })

  it('does not accept a minus sign, so the percentage cannot go below 0', () => {
    render(<Harness />)

    const input = percentageInput()
    input.focus()
    fireEvent.keyPress(input, {
      key: '-',
      code: 'Minus',
      charCode: 45,
      which: 45,
    })
    fireEvent.blur(input)

    expect(input.value).toBe('')
    expect(screen.getByTestId('stored-percentage').textContent).not.toMatch(
      /^-/
    )
  })
})
