import { useCallback } from 'react'
import MixinsFormItemChangeIndicator from './MixinsFormItemChangeIndicator'
import { getIndicatorClassName } from './mixinsIndicator'
import MixinsFormArray from './MixinsFormArray'
import { Control, Controller, FieldValues } from 'react-hook-form'
import {
  buildMixinFieldRules,
  isNestedObjectMixinItem,
  MixinsFormItem,
  MixinsFormItemType,
} from './helpers'
import InputField from '../shared/InputField'
import MixinsFormInput from './MixinsFormInput'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import MixinsSectionBox from './MixinsSectionBox'
import { useTranslation } from 'react-i18next'
import { getReferenceTranslationKey } from './useReferenceSelectorConfig'
import { textToTitleCase } from '../../helpers/utils'
import styles from './Mixins.module.scss'

interface Props {
  readonly item: MixinsFormItem
  readonly control: Control<FieldValues>
  readonly managerPermissions: boolean
  readonly index?: number
  readonly arrayKey?: string
  readonly isSingleReferenceArray: boolean
  readonly inheritedValue?: unknown
  readonly clearableOverride?: boolean
}

const MixinsFormItemTemplate = (props: Props) => {
  const { t } = useTranslation()
  const {
    item,
    control,
    managerPermissions,
    index,
    arrayKey,
    isSingleReferenceArray,
    inheritedValue,
    clearableOverride = false,
  } = props
  const { getUiLangValue } = useLocalizedValue()

  const renderFormInput = useCallback(() => {
    const uniqueKey =
      index !== undefined ? `${arrayKey}.${index}.value.${item.key}` : item.key

    const rules = buildMixinFieldRules(
      item,
      t('global.fieldRequired') as string
    )

    return (
      <Controller
        key={uniqueKey}
        name={uniqueKey}
        control={control}
        rules={rules}
        render={({ field, fieldState }) => (
          <div className={styles.pushDown}>
            <MixinsFormItemChangeIndicator item={item} />
            <InputField
              className={styles.field}
              required={
                item.type !== MixinsFormItemType.unknown && item.isRequired
              }
              label={
                <span
                  className={getIndicatorClassName(item) || styles.fieldLabel}
                >
                  {textToTitleCase(getUiLangValue(item.name))}
                </span>
              }
              error={fieldState.error?.message}
            >
              <MixinsFormInput
                disabled={!managerPermissions || item.toDelete}
                item={item}
                value={field.value}
                onInputChange={(_, value) => field.onChange(value)}
                hideFieldName={isSingleReferenceArray}
                inheritedValue={inheritedValue}
                clearableOverride={clearableOverride}
              ></MixinsFormInput>
            </InputField>
          </div>
        )}
      />
    )
  }, [
    item,
    control,
    managerPermissions,
    arrayKey,
    index,
    t,
    getUiLangValue,
    isSingleReferenceArray,
    inheritedValue,
    clearableOverride,
  ])

  const renderItems = useCallback(() => {
    const nestedInherited =
      inheritedValue &&
      typeof inheritedValue === 'object' &&
      !Array.isArray(inheritedValue)
        ? (inheritedValue as Record<string, unknown>)
        : undefined
    return (
      <MixinsSectionBox
        className={styles.fullWidth}
        name={getUiLangValue(item.name)}
      >
        <div className={styles.fieldsWrap}>
          {item.items?.map((i) => {
            const childKey = i.key.split('.').pop() ?? i.key
            return (
              <MixinsFormItemTemplate
                key={i.key}
                item={i}
                control={control}
                managerPermissions={managerPermissions}
                arrayKey={arrayKey}
                index={index}
                isSingleReferenceArray={isSingleReferenceArray}
                inheritedValue={nestedInherited?.[childKey]}
                clearableOverride={clearableOverride}
              />
            )
          })}
        </div>
      </MixinsSectionBox>
    )
  }, [
    item,
    control,
    managerPermissions,
    arrayKey,
    index,
    getUiLangValue,
    isSingleReferenceArray,
    inheritedValue,
    clearableOverride,
  ])

  const renderArray = useCallback(() => {
    const arrayParentKey =
      index !== undefined && arrayKey !== undefined
        ? `${arrayKey}[${index}].value`
        : undefined
    return (
      <MixinsFormArray
        key={item.key}
        item={item}
        control={control}
        managerPermissions={managerPermissions}
        parentKey={arrayParentKey}
        inheritedValue={inheritedValue}
        clearableOverride={clearableOverride}
      />
    )
  }, [
    item,
    control,
    managerPermissions,
    arrayKey,
    index,
    inheritedValue,
    clearableOverride,
  ])

  const renderReference = useCallback(() => {
    return (
      <MixinsSectionBox
        className={styles.fullWidth}
        name={t(getReferenceTranslationKey(item.referenceType), {
          type: item.referenceType,
        })}
      >
        {renderFormInput()}
      </MixinsSectionBox>
    )
  }, [item, renderFormInput, t])

  if (item.type === MixinsFormItemType.localized) {
    return renderFormInput()
  } else if (item.type === MixinsFormItemType.reference) {
    return renderReference()
  } else if (item.type === MixinsFormItemType.array) {
    return renderArray()
  } else if (isNestedObjectMixinItem(item)) {
    return renderItems()
  } else {
    return renderFormInput()
  }
}

export default MixinsFormItemTemplate
