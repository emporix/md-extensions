import { useCallback } from 'react'
import {
  Calendar,
  Dropdown,
  DropdownOption,
  InputNumber,
  InputSwitch,
  InputText,
} from '@emporix/component-library'
import LocalizedInput from '../shared/LocalizedInput'
import {
  getDecimalMaxFractionDigits,
  MixinsFormItem,
  MixinsFormItemType,
} from './helpers'
import { fromLocalizedMap, toLocalizedMap } from './localizedMixin.helpers'
import { isHourValid } from '../../helpers/time'
import Localized from '../../models/Localized.model'
import { useTranslation } from 'react-i18next'
import { ReferenceItem, ReferenceSelector } from './ReferenceSelector'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import { useReferenceOptions } from '../../context/ReferenceOptionsProvider'
import styles from './Mixins.module.scss'

/** Sentinel for the explicit "clear" option standing in for Prime `showClear`. */
const CLEAR_OPTION_VALUE = '__mixins_clear__'

type InputValueType =
  | string
  | number
  | boolean
  | string[]
  | Record<string, string>
  | { language: string; value: string | number | boolean }[]
  | { emporixReferenceType: string; id: string }
  | null

interface SchemaFormInputProps {
  readonly item: MixinsFormItem
  readonly value: InputValueType
  readonly onInputChange: (key: string, value: InputValueType) => void
  readonly disabled?: boolean
  readonly className?: string
  /** Kept from MD's API; the field label is rendered by the caller. */
  readonly hideFieldName?: boolean
  readonly disableReferenceSelector?: boolean
  readonly externalItems?: ReferenceItem[]
  readonly inheritedValue?: unknown
  /** Site overlay: allow clearing a scalar override to resume inheritance. */
  readonly clearableOverride?: boolean
}

const hasLocalizedValue = (value: unknown): boolean =>
  Object.values(toLocalizedMap(value) ?? {}).some(
    (v) => v !== undefined && v !== null && v !== ''
  )

const MixinsFormInput = (props: SchemaFormInputProps) => {
  const {
    item,
    value,
    onInputChange,
    disabled = false,
    className = '',
    disableReferenceSelector = false,
    externalItems,
    inheritedValue,
    clearableOverride = false,
  } = props
  const { i18n, t } = useTranslation()
  const { getContentLangValue } = useLocalizedValue()
  const { referenceOptions } = useReferenceOptions()

  const isReadonly: boolean = item.isReadonly ?? false
  const type =
    item.arrayType !== undefined &&
    item.arrayType !== MixinsFormItemType.unknown
      ? item.arrayType
      : item.type

  const inheritedPlaceholder = (() => {
    if (
      inheritedValue === undefined ||
      inheritedValue === null ||
      inheritedValue === ''
    ) {
      return undefined
    }
    if (
      typeof inheritedValue === 'string' ||
      typeof inheritedValue === 'number'
    ) {
      return String(inheritedValue)
    }
    if (typeof inheritedValue === 'boolean') {
      return inheritedValue ? 'true' : 'false'
    }
    return undefined
  })()

  const inheritedHint =
    inheritedValue !== undefined &&
    inheritedValue !== null &&
    inheritedValue !== '' &&
    inheritedPlaceholder === undefined
      ? t('mixins.labels.defaultValueHint', {
          value:
            typeof inheritedValue === 'object'
              ? JSON.stringify(inheritedValue)
              : String(inheritedValue),
        })
      : inheritedPlaceholder
        ? t('mixins.labels.defaultValueHint', { value: inheritedPlaceholder })
        : undefined

  const getField = useCallback(() => {
    switch (type) {
      case MixinsFormItemType.text: {
        return (
          <InputText
            className={className}
            value={(value as string) || ''}
            placeholder={inheritedPlaceholder}
            readOnly={disabled || isReadonly}
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
            placeholder={inheritedPlaceholder}
            readOnly={disabled || isReadonly}
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
            placeholder={inheritedPlaceholder}
            readOnly={disabled || isReadonly}
            onChange={({ value }) => {
              onInputChange(item.key as string, value as number)
            }}
            mode="decimal"
            locale={i18n.language}
            maxFractionDigits={getDecimalMaxFractionDigits(item.multipleOf)}
          />
        )
      }
      case MixinsFormItemType.boolean: {
        const hasOverride = value === true || value === false
        return (
          <div className={styles.column}>
            <div className={styles.row}>
              <InputSwitch
                className={className}
                checked={
                  hasOverride ? (value as boolean) : Boolean(inheritedValue)
                }
                disabled={disabled || isReadonly}
                onChange={({ value: next }) => {
                  onInputChange(item.key as string, next || false)
                }}
              />
              {clearableOverride && hasOverride && !disabled && !isReadonly ? (
                <button
                  type="button"
                  className={styles.clearOverride}
                  onClick={() => onInputChange(item.key as string, null)}
                >
                  {t('mixins.labels.useDefaultValue')}
                </button>
              ) : null}
            </div>
            {!hasOverride && inheritedHint ? (
              <span className={styles.inheritedHint}>{inheritedHint}</span>
            ) : null}
          </div>
        )
      }
      case MixinsFormItemType.enum: {
        // CL Dropdown has no `showClear`: an explicit empty option clears it.
        const canClear =
          item.isNullable ||
          clearableOverride ||
          inheritedPlaceholder !== undefined
        const enumOptions: DropdownOption[] = (
          item.enum?.filter((i) => i !== null) || []
        ).map((option) => ({
          label: String(option),
          value: option as string,
        }))
        const options: DropdownOption[] =
          canClear && value !== null && value !== undefined && value !== ''
            ? [{ label: '\u00a0', value: CLEAR_OPTION_VALUE }, ...enumOptions]
            : enumOptions
        return (
          <div className={styles.column}>
            <Dropdown
              className={className}
              options={options}
              value={value ?? null}
              placeholder={inheritedPlaceholder}
              disabled={disabled || isReadonly}
              onChange={(e) => {
                onInputChange(
                  item.key as string,
                  e.value === CLEAR_OPTION_VALUE
                    ? null
                    : (e.value as InputValueType)
                )
              }}
            />
            {!value && inheritedHint ? (
              <span className={styles.inheritedHint}>{inheritedHint}</span>
            ) : null}
          </div>
        )
      }
      case MixinsFormItemType.date: {
        const canClearDate = item.isNullable || clearableOverride
        return (
          <div className={styles.column}>
            <Calendar
              className={className}
              key={`${item.key}-${JSON.stringify(value)}`}
              showButtonBar={canClearDate}
              panelClassName={styles.calendarHideToday}
              value={
                value && !Array.isArray(value)
                  ? new Date(value as string)
                  : undefined
              }
              disabled={disabled || isReadonly}
              onChange={(event) => {
                if (event.value instanceof Date) {
                  onInputChange(item.key as string, event.value.toISOString())
                } else if (canClearDate) {
                  onInputChange(item.key as string, null)
                }
              }}
            />
            {clearableOverride &&
            value &&
            !disabled &&
            !isReadonly &&
            !item.isNullable ? (
              <button
                type="button"
                className={styles.clearOverride}
                onClick={() => onInputChange(item.key as string, null)}
              >
                {t('mixins.labels.useDefaultValue')}
              </button>
            ) : null}
          </div>
        )
      }
      case MixinsFormItemType.dateTime: {
        const canClearDateTime = item.isNullable || clearableOverride
        return (
          <div className={styles.column}>
            <Calendar
              className={className}
              key={`${item.key}-${value !== undefined}`}
              showTime
              hourFormat="24"
              showButtonBar={canClearDateTime}
              panelClassName={styles.calendarHideToday}
              value={
                value && !Array.isArray(value)
                  ? new Date(value as string)
                  : undefined
              }
              disabled={disabled || isReadonly}
              onChange={(event) => {
                if (event.value instanceof Date) {
                  onInputChange(item.key as string, event.value.toISOString())
                } else if (canClearDateTime) {
                  onInputChange(item.key as string, null)
                }
              }}
            />
            {clearableOverride &&
            value &&
            !disabled &&
            !isReadonly &&
            !item.isNullable ? (
              <button
                type="button"
                className={styles.clearOverride}
                onClick={() => onInputChange(item.key as string, null)}
              >
                {t('mixins.labels.useDefaultValue')}
              </button>
            ) : null}
          </div>
        )
      }
      case MixinsFormItemType.time: {
        // CL has no InputMask: native time input replaces MD's "99:99" mask;
        // incomplete/invalid times clear the value like MD's onBlur check.
        return (
          <InputText
            className={className}
            type="time"
            value={(value as string) || ''}
            disabled={disabled || isReadonly}
            onChange={(e) => {
              const time = e.target.value
              onInputChange(item.key as string, isHourValid(time) ? time : '')
            }}
          />
        )
      }
      case MixinsFormItemType.localized: {
        const inheritedLocalized =
          inheritedValue !== undefined &&
          inheritedValue !== null &&
          inheritedValue !== ''
            ? toLocalizedMap(inheritedValue)
            : undefined
        return (
          <div className={styles.column}>
            <LocalizedInput
              className={className}
              displayOnly={disabled || isReadonly}
              onChange={(val) =>
                onInputChange(
                  item.key as string,
                  fromLocalizedMap(
                    val as Localized,
                    item.localizedVersion ?? 'v1'
                  ) as InputValueType
                )
              }
              value={toLocalizedMap(value)}
            />
            {/* MD showed per-language placeholders; the remote LocalizedInput
                has no placeholder passthrough, so show the default as a hint. */}
            {inheritedLocalized && !hasLocalizedValue(value) ? (
              <span className={styles.inheritedHint}>
                {t('mixins.labels.defaultValueHint', {
                  value: getContentLangValue(inheritedLocalized),
                })}
              </span>
            ) : null}
          </div>
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
        const hasReferenceOverride = !!referenceValue.id

        return (
          <div className={styles.column}>
            {isReferenceTypeSupported ? (
              <ReferenceSelector
                value={referenceValue.id ? [referenceValue.id] : []}
                onChange={(selectedIds) => {
                  const nextId = selectedIds[selectedIds.length - 1] || ''
                  if (!nextId && clearableOverride) {
                    onInputChange(item.key as string, null)
                    return
                  }
                  onInputChange(item.key as string, {
                    emporixReferenceType: referenceType,
                    id: nextId,
                  })
                }}
                referenceType={referenceType}
                disabled={disabled || isReadonly}
                disableDropdown={disableReferenceSelector}
                externalItems={externalItems}
                className={`${className} ${styles.referenceInput}`}
              />
            ) : (
              // For unsupported reference types, show a disabled text input with the ID
              <InputText
                className={className}
                value={referenceValue.id || ''}
                readOnly={true}
                placeholder={t('mixins.labels.unsupportedType')}
              />
            )}
            {clearableOverride &&
            hasReferenceOverride &&
            !disabled &&
            !isReadonly ? (
              <button
                type="button"
                className={styles.clearOverride}
                onClick={() => onInputChange(item.key as string, null)}
              >
                {t('mixins.labels.useDefaultValue')}
              </button>
            ) : null}
          </div>
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
    type,
    isReadonly,
    value,
    item,
    i18n.language,
    disabled,
    className,
    disableReferenceSelector,
    externalItems,
    referenceOptions,
    getContentLangValue,
    onInputChange,
    inheritedValue,
    inheritedPlaceholder,
    inheritedHint,
    clearableOverride,
    t,
  ])

  const field = getField()
  const showGenericHint =
    inheritedHint &&
    type !== MixinsFormItemType.text &&
    type !== MixinsFormItemType.integer &&
    type !== MixinsFormItemType.decimal &&
    type !== MixinsFormItemType.boolean &&
    type !== MixinsFormItemType.enum &&
    type !== MixinsFormItemType.localized &&
    (value === undefined || value === null || value === '')

  return (
    <div className={styles.column}>
      {field}
      {showGenericHint ? (
        <span className={styles.inheritedHint}>{inheritedHint}</span>
      ) : null}
    </div>
  )
}

export default MixinsFormInput
