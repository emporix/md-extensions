import type { KeyboardEvent } from 'react'
import {
  InputNumber,
  type InputNumberChangeEvent,
  type InputNumberMode,
} from '@emporix/component-library'
import { useConfiguration } from '../../context/ConfigurationProvider'
import { useCurrencies } from '../../hooks/useCurrencies'
import { StylableProps } from '../../helpers/props'

/** MD `helpers/utils` MAX_FRACTION_DIGIT (not exported by the remote utils). */
const MAX_FRACTION_DIGIT = 20

type PriceInputProps = StylableProps & {
  readonly value?: number
  readonly locale?: string
  readonly currency?: string | undefined
  readonly onChange?: (e: InputNumberChangeEvent) => void
  readonly onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void
  readonly min?: number
  readonly max?: number
  readonly minFractionDigits?: number
  readonly maxFractionDigits?: number
  readonly mode?: InputNumberMode
  readonly disabled?: boolean
  readonly dataTestId?: string
}

export const PriceInput = ({
  className = '',
  value,
  locale,
  currency,
  onChange,
  onKeyDown,
  min,
  max,
  minFractionDigits,
  mode,
  disabled,
  dataTestId,
}: PriceInputProps) => {
  const { selectedCurrency } = useCurrencies()
  const { currentCurrency } = useConfiguration()
  return (
    <InputNumber
      className={className}
      readOnly={disabled}
      value={value}
      min={min}
      max={max}
      minFractionDigits={minFractionDigits}
      maxFractionDigits={MAX_FRACTION_DIGIT}
      locale={locale}
      currency={currency ?? selectedCurrency?.code ?? currentCurrency?.id}
      onChange={onChange}
      onKeyDown={onKeyDown}
      mode={mode}
      data-testid={dataTestId}
    />
  )
}

export default PriceInput
