import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Calendar,
  Dropdown,
  InputSwitch,
  InputText,
} from '@emporix/component-library'
import LocalizedInput from '../shared/LocalizedInput'
import {
  LocalizedMixin,
  mapLocalizedMixinToLocalized,
  mapLocalizedToLocalizedMixins,
  MixinsFormItem,
  MixinsFormItemType,
} from './helpers'
import { toCalendarDate } from '../../helpers/date'
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
 * Date and date-time use CL `Calendar` (PrimeReact overlay, styles in the
 * library). Numeric and time fields still use native input types through CL
 * `InputText` until InputNumber / InputMask are promoted.
 */

const MixinsFormInput = ({
  item,
  value,
  onInputChange,
  disabled = false,
  className = '',
}: MixinsFormInputProps) => {
  const { t } = useTranslation()
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
          <Calendar
            className={className}
            value={toCalendarDate(value)}
            dateFormat={t('global.dateFormat')}
            disabled={isDisabled}
            showButtonBar
            onChange={(event) => {
              const next = event.value
              onInputChange(
                item.key,
                next instanceof Date ? next.toISOString() : ''
              )
            }}
          />
        )
      case MixinsFormItemType.dateTime:
        return (
          <Calendar
            className={className}
            value={toCalendarDate(value)}
            dateFormat={t('global.dateFormat')}
            disabled={isDisabled}
            showTime
            hourFormat="24"
            showButtonBar
            onChange={(event) => {
              const next = event.value
              onInputChange(
                item.key,
                next instanceof Date ? next.toISOString() : ''
              )
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
  }, [type, value, item, className, isDisabled, onInputChange, t])

  return <>{getField()}</>
}

export default MixinsFormInput
