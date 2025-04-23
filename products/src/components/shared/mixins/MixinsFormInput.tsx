import { useCallback } from 'react'
import { InputNumber } from 'primereact/inputnumber'
import { InputText } from 'primereact/inputtext'
import { InputSwitch } from 'primereact/inputswitch'
import { Dropdown } from 'primereact/dropdown'
import { Calendar } from 'primereact/calendar'
import { LocalizedInput } from '../LocalizedInput'
import {
  LocalizedMixin,
  mapLocalizedMixinToLocalized,
  mapLocalizedToLocalizedMixins,
  MixinsFormItem,
  MixinsFormItemType,
} from './helpers'
import { InputMask } from 'primereact/inputmask'
import Localized from '../../../models/Localized'
import { useTranslation } from 'react-i18next'

interface SchemaFormInputProps {
  item: MixinsFormItem
  value: string | number | boolean | string[] | LocalizedMixin[]
  onInputChange: (
    key: string,
    value: string | number | boolean | LocalizedMixin[]
  ) => void
  disabled?: boolean
  className?: string
}

const MixinsFormInput = (props: SchemaFormInputProps) => {
  const { item, value, onInputChange, disabled, className } = props
  const { i18n } = useTranslation()

  const isReadonly: boolean = item.isReadonly ?? false
  const type =
    item.arrayType !== undefined &&
    item.arrayType !== MixinsFormItemType.unknown
      ? item.arrayType
      : item.type

  const isHourValid = (time: string) => {
    const cleanedTime = time.replace(/_/g, '0')
    const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/
    return timeRegex.test(cleanedTime)
  }

  const getField = useCallback(() => {
    switch (type) {
      case MixinsFormItemType.text: {
        return (
          <InputText
            className={className}
            value={(value as string) || ''}
            disabled={disabled || isReadonly}
            onChange={(e) => {
              onInputChange(item.key as string, e.target.value)
            }}
          />
        )
      }
      case MixinsFormItemType.integer: {
        return (
          <InputNumber
            className={className}
            value={value as number}
            disabled={disabled || isReadonly}
            onChange={({ value }) => {
              onInputChange(item.key as string, value as number)
            }}
          />
        )
      }
      case MixinsFormItemType.decimal: {
        return (
          <InputNumber
            className={className}
            value={value as number}
            disabled={disabled || isReadonly}
            onChange={({ value }) => {
              onInputChange(item.key as string, value as number)
            }}
            mode="decimal"
            locale={i18n.language}
            maxFractionDigits={2}
          />
        )
      }
      case MixinsFormItemType.boolean: {
        return (
          <InputSwitch
            style={{ minWidth: '3rem' }}
            className={className}
            checked={value as boolean}
            disabled={disabled || isReadonly}
            onChange={({ value }) => {
              onInputChange(item.key as string, value || false)
            }}
          />
        )
      }
      case MixinsFormItemType.enum: {
        return (
          <Dropdown
            className={className}
            options={item.enum}
            value={value}
            disabled={disabled || isReadonly}
            onChange={(e) => {
              onInputChange(item.key as string, e.target.value)
            }}
          />
        )
      }
      case MixinsFormItemType.date: {
        return (
          <Calendar
            className={className}
            key={`${item.key}-${JSON.stringify(value)}`}
            value={
              value && !Array.isArray(value)
                ? new Date(value as string)
                : undefined
            }
            disabled={disabled || isReadonly}
            onChange={(event) => {
              if (event.target.value) {
                onInputChange(
                  item.key as string,
                  (event.target.value as Date).toISOString()
                )
              }
            }}
          />
        )
      }
      case MixinsFormItemType.dateTime: {
        return (
          <Calendar
            className={className}
            key={`${item.key}-${JSON.stringify(value)}`}
            showTime
            hourFormat="24"
            value={
              value && !Array.isArray(value)
                ? new Date(value as string)
                : undefined
            }
            disabled={disabled || isReadonly}
            onChange={(event) => {
              if (event.target.value) {
                onInputChange(
                  item.key as string,
                  (event.target.value as Date).toISOString()
                )
              }
            }}
          />
        )
      }
      case MixinsFormItemType.time: {
        const getValue = (val: string): string => {
          if (val === '') {
            return ' '
          }
          return ''
        }

        return (
          <InputMask
            className={className}
            mask="99:99"
            value={value as string}
            disabled={disabled || isReadonly}
            onComplete={(e) => {
              const time = e.value as string
              onInputChange(
                item.key as string,
                isHourValid(time) ? time : getValue(value as string)
              )
            }}
            onBlur={(e) => {
              !isHourValid(e.target.value) &&
                onInputChange(item.key as string, getValue(value as string))
            }}
          />
        )
      }
      case MixinsFormItemType.localized: {
        return (
          <LocalizedInput
            className={`${className} array-localized-field`}
            displayOnly={disabled || isReadonly}
            onChange={(val) =>
              onInputChange(
                item.key as string,
                mapLocalizedToLocalizedMixins(
                  val as Localized
                ) as LocalizedMixin[]
              )
            }
            value={mapLocalizedMixinToLocalized(value as LocalizedMixin[])}
          />
        )
      }
      default: {
        return (
          <div>
            <i>Field not available</i>
          </div>
        )
      }
    }
  }, [value, item, i18n.language])

  return <>{getField()}</>
}

MixinsFormInput.defaultProps = {
  disabled: false,
  className: '',
}

export default MixinsFormInput
