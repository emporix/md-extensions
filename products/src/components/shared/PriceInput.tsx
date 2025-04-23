import React from 'react'
import {
  InputNumber,
  InputNumberChangeParams,
  InputNumberValueChangeParams,
} from 'primereact/inputnumber'
import { MAX_FRACTION_DIGIT } from '../../helpers/utils'
import { useCurrencies } from '../../hooks/useCurrencies'
import { useDashboardContext } from '../../context/Dashboard.context.tsx'

interface PriceInputProps {
  value?: number
  locale?: string
  currency?: string | undefined
  onChange?(e: InputNumberChangeParams): void
  onKeyDown?(event: React.KeyboardEvent<HTMLInputElement>): void
  onValueChange?(e: InputNumberValueChangeParams): void
  min?: number
  max?: number
  minFractionDigits?: number
  maxFractionDigits?: number
  autoFocus?: boolean
  mode?: string
  disabled?: boolean
  dataTestId?: string
}

export const PriceInput = (props: PriceInputProps) => {
  const { selectedCurrency } = useCurrencies()
  const { currency: currentCurrency } = useDashboardContext()
  const {
    value,
    locale,
    currency,
    onChange,
    onKeyDown,
    onValueChange,
    min,
    max,
    minFractionDigits,
    autoFocus,
    mode,
    disabled,
    dataTestId,
  } = props
  return (
    <InputNumber
      disabled={disabled}
      value={value}
      min={min}
      max={max}
      minFractionDigits={minFractionDigits}
      maxFractionDigits={MAX_FRACTION_DIGIT}
      locale={locale}
      currency={currency ?? selectedCurrency?.code ?? currentCurrency?.id}
      onChange={onChange}
      onKeyDown={onKeyDown}
      onValueChange={onValueChange}
      autoFocus={autoFocus}
      mode={mode}
      data-test-id={dataTestId}
    />
  )
}

export default PriceInput
