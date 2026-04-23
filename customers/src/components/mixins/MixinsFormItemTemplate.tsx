import React, { useCallback } from 'react'
import MixinsFormItemChangeIndicator, {
  getIndicatorColor,
} from './MixinsFormItemChangeIndicator'
import MixinsFormArray from './MixinsFormArray'
import { Controller } from 'react-hook-form'
import { MixinsFormItem, MixinsFormItemType } from './helpers'
import InputField from '../InputField'
import MixinsFormInput from './MixinsFormInput'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import MixinsSectionBox from './MixinsSectionBox'
import { useTranslation } from 'react-i18next'
import { getReferenceTranslationKey } from './useReferenceSelectorConfig'

interface Props {
  item: MixinsFormItem
  control: any
  managerPermissions: boolean
  index?: any
  arrayKey?: string
  isSingleReferenceArray: boolean
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
  } = props
  const { getUiLangValue } = useLocalizedValue()

  const renderFormInput = useCallback(() => {
    const uniqueKey =
      index !== undefined ? `${arrayKey}.${index}.value.${item.key}` : item.key

    // Build validation rules. For reference fields, validate that id is non-empty when required.
    const rules =
      item.type === MixinsFormItemType.reference
        ? {
            validate: (v: any) => {
              if (!item.isRequired) return true
              const id = v?.id
              return (
                (typeof id === 'string' && id.trim() !== '') ||
                t('global.validation.required')
              )
            },
          }
        : {
            required:
              item.type !== MixinsFormItemType.unknown && item.isRequired
                ? (t('global.validation.required') as unknown as string)
                : false,
          }

    return (
      <Controller
        key={uniqueKey}
        name={uniqueKey}
        control={control}
        rules={rules}
        render={({ field, fieldState }) => (
          <div className="mt-auto">
            <MixinsFormItemChangeIndicator item={item} />
            <InputField
              required={
                item.type !== MixinsFormItemType.unknown && item.isRequired
              }
              label={getUiLangValue(item.name)}
              color={getIndicatorColor(item)}
              error={fieldState.error?.message as unknown as string}
            >
              <MixinsFormInput
                disabled={!managerPermissions || item.toDelete}
                item={item}
                value={field.value}
                onInputChange={(_, value) => field.onChange(value)}
                hideFieldName={isSingleReferenceArray}
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
  ])

  const renderItems = useCallback(() => {
    return (
      <MixinsSectionBox className="w-full" name={getUiLangValue(item.name)}>
        <div className="flex flex-wrap gap-3">
          {item.items?.map((i) => (
            <MixinsFormItemTemplate
              key={i.key}
              item={i}
              control={control}
              managerPermissions={managerPermissions}
              arrayKey={arrayKey}
              index={index}
              isSingleReferenceArray={isSingleReferenceArray}
            />
          ))}
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
      />
    )
  }, [item, control, managerPermissions, arrayKey, index])

  const renderReference = useCallback(() => {
    return (
      <MixinsSectionBox
        className="w-full"
        name={t(getReferenceTranslationKey(item.referenceType), {
          type: item.referenceType,
        })}
      >
        {renderFormInput()}
      </MixinsSectionBox>
    )
  }, [item, renderFormInput])

  if (item.type === MixinsFormItemType.reference) {
    // Single reference
    return renderReference()
  } else if (item.type === 'array') {
    // Arrays
    return renderArray()
  } else if (Array.isArray(item?.items)) {
    // Objects
    return renderItems()
  } else {
    // Basic types
    return renderFormInput()
  }
}

export default MixinsFormItemTemplate
