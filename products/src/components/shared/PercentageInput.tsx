import React from 'react'
import {
  InputNumber,
  InputNumberChangeParams,
  InputNumberValueChangeParams,
} from 'primereact/inputnumber'

interface PercentageInputProps {
  value?: number
  onChange?(e: InputNumberChangeParams): void
  onKeyDown?(event: React.KeyboardEvent<HTMLInputElement>): void
  onValueChange?(e: InputNumberValueChangeParams): void
  autoFocus?: boolean
  disabled?: boolean
}

export const PercentageInput = (props: PercentageInputProps) => {
  const { value, onChange, onKeyDown, onValueChange, autoFocus, disabled } =
    props
  return (
    <InputNumber
      disabled={disabled}
      value={value}
      min={0}
      max={100}
      minFractionDigits={0}
      onChange={onChange}
      onKeyDown={onKeyDown}
      onValueChange={onValueChange}
      autoFocus={autoFocus}
      prefix={'%'}
    />
  )
}

export default PercentageInput
