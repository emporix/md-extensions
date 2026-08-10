import { useCallback } from 'react'
import { Dropdown, InputSwitch, InputText } from '@emporix/component-library'
import LocalizedInput from '../shared/LocalizedInput'
import {
  LocalizedMixin,
  mapLocalizedMixinToLocalized,
  mapLocalizedToLocalizedMixins,
  MixinsFormItem,
  MixinsFormItemType,
} from './helpers'
import Localized from '../../models/Localized.model'

interface MixinsFormInputProps {
  item: MixinsFormItem
  value: string | number | boolean | string[] | LocalizedMixin[]
  onInputChange: (
    key: string,
    value: string | number | boolean | LocalizedMixin[]
  ) => void
  disabled?: boolean
  className?: string
}

/**
 * Renders one mixin field.
 *
 * MD/`products` used PrimeReact `InputNumber` / `Calendar` / `InputMask` here.
 * The component library exposes no equivalents, so numeric, date and time
 * fields use native input types through CL `InputText` (which forwards `type`).
 * Same stored value shape, native picker instead of a PrimeReact overlay.
 */

/** `datetime-local` needs `YYYY-MM-DDTHH:mm`; the API stores ISO-8601. */
const toDateTimeLocalValue = (value: unknown): string => {
  if (typeof value !== 'string' || !value) {
    return ''
  }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return ''
  }
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(
    parsed.getDate()
  )}T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`
}

/** `date` needs `YYYY-MM-DD`. */
const toDateValue = (value: unknown): string => {
  if (typeof value !== 'string' || !value) {
    return ''
  }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return ''
  }
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(
    parsed.getDate()
  )}`
}

const MixinsFormInput = ({
  item,
  value,
  onInputChange,
  disabled = false,
  className = '',
}: MixinsFormInputProps) => {
  const isReadonly: boolean = item.isReadonly ?? false
  const isDisabled = disabled || isReadonly
  const type =
    item.arrayType !== undefined &&
    item.arrayType !== MixinsFormItemType.unknown
      ? item.arrayType
      : item.type

  const getField = useCallback(() => {
    switch (type) {
      case MixinsFormItemType.text:
        return (
          <InputText
            className={className}
            value={(value as string) || ''}
            disabled={isDisabled}
            onChange={(e) => onInputChange(item.key, e.target.value)}
          />
        )
      case MixinsFormItemType.integer:
        return (
          <InputText
            className={className}
            type="number"
            step={1}
            value={value === undefined || value === null ? '' : String(value)}
            disabled={isDisabled}
            onChange={(e) => {
              const raw = e.target.value
              onInputChange(item.key, raw === '' ? '' : Number(raw))
            }}
          />
        )
      case MixinsFormItemType.decimal:
        return (
          <InputText
            className={className}
            type="number"
            step="0.01"
            value={value === undefined || value === null ? '' : String(value)}
            disabled={isDisabled}
            onChange={(e) => {
              const raw = e.target.value
              onInputChange(item.key, raw === '' ? '' : Number(raw))
            }}
          />
        )
      case MixinsFormItemType.boolean:
        return (
          <InputSwitch
            className={className}
            checked={Boolean(value)}
            disabled={isDisabled}
            onChange={(e) => onInputChange(item.key, e.value)}
          />
        )
      case MixinsFormItemType.enum:
        return (
          <Dropdown
            className={className}
            options={(item.enum ?? []).map((option) => ({
              label: option,
              value: option,
            }))}
            value={value as string}
            disabled={isDisabled}
            onChange={(e) => onInputChange(item.key, e.value as string)}
          />
        )
      case MixinsFormItemType.date:
        return (
          <InputText
            className={className}
            type="date"
            value={toDateValue(value)}
            disabled={isDisabled}
            onChange={(e) => {
              const raw = e.target.value
              onInputChange(item.key, raw ? new Date(raw).toISOString() : '')
            }}
          />
        )
      case MixinsFormItemType.dateTime:
        return (
          <InputText
            className={className}
            type="datetime-local"
            value={toDateTimeLocalValue(value)}
            disabled={isDisabled}
            onChange={(e) => {
              const raw = e.target.value
              onInputChange(item.key, raw ? new Date(raw).toISOString() : '')
            }}
          />
        )
      case MixinsFormItemType.time:
        // Native time input enforces HH:mm, replacing the PrimeReact
        // InputMask "99:99" + manual range validation MD used.
        return (
          <InputText
            className={className}
            type="time"
            value={(value as string) || ''}
            disabled={isDisabled}
            onChange={(e) => onInputChange(item.key, e.target.value)}
          />
        )
      case MixinsFormItemType.localized:
        return (
          <LocalizedInput
            className={className}
            displayOnly={isDisabled}
            value={mapLocalizedMixinToLocalized(value as LocalizedMixin[])}
            onChange={(val) =>
              onInputChange(
                item.key,
                mapLocalizedToLocalizedMixins(
                  val as Localized
                ) as LocalizedMixin[]
              )
            }
          />
        )
      default:
        return (
          <div>
            <i>Field not available</i>
          </div>
        )
    }
  }, [type, value, item, className, isDisabled, onInputChange])

  return <>{getField()}</>
}

export default MixinsFormInput
