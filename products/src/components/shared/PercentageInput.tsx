import type { KeyboardEvent } from 'react'
import {
  InputNumber,
  type InputNumberChangeEvent,
} from '@emporix/component-library'

type PercentageInputProps = {
  readonly value?: number
  readonly onChange?: (e: InputNumberChangeEvent) => void
  readonly onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void
  readonly disabled?: boolean
}

export const PercentageInput = ({
  value,
  onChange,
  onKeyDown,
  disabled,
}: PercentageInputProps) => {
  return (
    <InputNumber
      readOnly={disabled}
      value={value}
      min={0}
      max={100}
      minFractionDigits={0}
      onChange={onChange}
      onKeyDown={onKeyDown}
      prefix={'%'}
    />
  )
}

export default PercentageInput
