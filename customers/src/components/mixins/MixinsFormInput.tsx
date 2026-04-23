import React, { useCallback } from 'react'
import { InputNumber } from 'primereact/inputnumber'
import { InputText } from 'primereact/inputtext'
import { InputSwitch } from 'primereact/inputswitch'
import { Dropdown } from 'primereact/dropdown'
import { Calendar } from 'primereact/calendar'
import { LocalizedInput } from '../framework/LocalizedInput'
import {
  LocalizedMixin,
  mapLocalizedMixinToLocalized,
  mapLocalizedToLocalizedMixins,
  MixinsFormItem,
  MixinsFormItemType,
} from './helpers'
import { InputMask } from 'primereact/inputmask'
import { isHourValid } from '../deliveryTimes/helpers'
import Localized from '../../models/Localized'
import { useTranslation } from 'react-i18next'
import { ReferenceSelector } from './ReferenceSelector'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import { useReferenceOptions } from '../../hooks/useReferenceOptions'
import { StylableProps } from '../../helpers/props'

type InputValueType =
  | string
  | number
  | boolean
  | string[]
  | LocalizedMixin[]
  | { emporixReferenceType: string; id: string }

interface SchemaFormInputProps extends StylableProps {
  item: MixinsFormItem
  value: InputValueType
  onInputChange: (key: string, value: InputValueType) => void
  disabled?: boolean
  hideFieldName?: boolean
  disableReferenceSelector?: boolean
}

const MixinsFormInput = (props: SchemaFormInputProps) => {
  const {
    item,
    value,
    onInputChange,
    disabled = false,
    className = '',
    hideFieldName = false,
    disableReferenceSelector = false,
  } = props
  const { i18n, t } = useTranslation()
  const { getUiLangValue } = useLocalizedValue()
  const { referenceOptions } = useReferenceOptions()

  const isReadonly: boolean = item.isReadonly ?? false
  const type =
    item.arrayType !== undefined &&
    item.arrayType !== MixinsFormItemType.unknown
      ? item.arrayType
      : item.type

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
            appendTo="self"
            className={className}
            options={item.enum?.filter((i) => i !== null) || []}
            value={value}
            disabled={disabled || isReadonly}
            showClear={item.isNullable}
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
            key={`${item.key}-${value !== undefined}`}
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
      case MixinsFormItemType.reference: {
        const referenceValue = (value as {
          emporixReferenceType: string
          id: string
        }) || { emporixReferenceType: '', id: '' }

        const referenceType =
          referenceValue.emporixReferenceType ||
          (item.referenceTypeEnum && item.referenceTypeEnum.length === 1
            ? item.referenceTypeEnum[0]
            : '')

        const isReferenceTypeSupported =
          referenceType && referenceOptions.includes(referenceType)

        return (
          <>
            {isReferenceTypeSupported ? (
              <ReferenceSelector
                value={referenceValue.id ? [referenceValue.id] : []}
                onChange={(selectedIds) => {
                  onInputChange(item.key as string, {
                    emporixReferenceType: referenceType,
                    id: selectedIds.at(-1) || '',
                  })
                }}
                referenceType={referenceType}
                disabled={disabled || isReadonly}
                disableDropdown={disableReferenceSelector}
                className={className}
                style={{ width: '300px' }}
              />
            ) : (
              // For unsupported reference types, show a disabled text input with the ID
              <InputText
                className={className}
                value={referenceValue.id || ''}
                disabled={true}
                placeholder={t('mixins.labels.unsupportedType')}
                readOnly
              />
            )}
          </>
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
  }, [
    value,
    item,
    i18n.language,
    disabled,
    className,
    hideFieldName,
    disableReferenceSelector,
    referenceOptions,
    getUiLangValue,
    onInputChange,
  ])

  return <>{getField()}</>
}

export default MixinsFormInput
