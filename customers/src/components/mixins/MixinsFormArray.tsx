import React from 'react'
import { Button } from 'primereact/button'
import MixinsSectionBox from './MixinsSectionBox'

import { useTranslation } from 'react-i18next'
import { Controller, useFieldArray } from 'react-hook-form'
import {
  defaultValueForMixinItem,
  isAttributeOfArraySingleReference,
  MixinsFormItem,
  MixinsFormItemType,
} from './helpers'
import InputField from '../InputField'
import MixinsFormInput from './MixinsFormInput'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import { v4 as uuidv4 } from 'uuid'
import { HiMinus } from 'react-icons/hi'
import MixinsFormItemTemplate from './MixinsFormItemTemplate'
import { ReferenceSelector } from './ReferenceSelector'
import { textToTitleCase } from '../../helpers/utils'
import { getReferenceTranslationKey } from './useReferenceSelectorConfig'

interface Props {
  item: MixinsFormItem
  control: any
  managerPermissions: boolean
  parentKey?: string
}

const MixinsFormArray = (props: Props) => {
  const { item, control, managerPermissions, parentKey } = props
  const { getUiLangValue } = useLocalizedValue()
  const { t } = useTranslation()

  let prefix = ''
  if (parentKey !== undefined) {
    prefix = parentKey + '.'
  }
  const newParentKey = prefix + item.key

  const { fields, append, remove, replace } = useFieldArray({
    name: newParentKey,
    control,
  })

  const isReferenceArray = isAttributeOfArraySingleReference(item)
  let referenceType = ''
  let referenceTypeEnum: (string | null)[] | undefined

  if (isReferenceArray) {
    referenceTypeEnum = item.referenceTypeEnum
    referenceType =
      referenceTypeEnum && referenceTypeEnum.length === 1
        ? (referenceTypeEnum[0] as string)
        : ''
  }

  const handleMultiSelectorChange = (selectedIds: string[]) => {
    const newEntries = selectedIds.map((id) => ({
      id: uuidv4(),
      value: {
        emporixReferenceType: referenceType,
        id: id,
      },
    }))
    replace(newEntries)
  }

  const getCurrentSelectedIds = (): string[] => {
    return fields
      .map((field: any) => {
        const fieldValue = field.value
        if (fieldValue && typeof fieldValue === 'object' && fieldValue.id) {
          return fieldValue.id
        }
        return ''
      })
      .filter((id) => id !== '')
  }

  const renderItemArray = (items: MixinsFormItem[], index: number) => {
    const list = (
      <div className="flex flex-wrap gap-3">
        {items.map((i) => (
          <MixinsFormItemTemplate
            key={i.key}
            item={i}
            control={control}
            managerPermissions={managerPermissions}
            arrayKey={newParentKey}
            index={index}
            isSingleReferenceArray={isReferenceArray}
          />
        ))}
      </div>
    )
    return (
      <>
        {item.name ? (
          <MixinsSectionBox
            key={index}
            className="w-full"
            name={index + 1 + ' '}
            remove={isReferenceArray ? undefined : () => remove(index)}
          >
            {list}
          </MixinsSectionBox>
        ) : (
          list
        )}
      </>
    )
  }

  const renderColumns = () => {
    const columns = []
    let column: any[] = []

    if (fields.length === 0) {
      columns.push(
        <span key={item.key} className="schema-empty-array">
          {t('mixins.labels.emptyArray', { type: item.arrayType })}
        </span>
      )
    }

    fields.forEach((field, index) => {
      column.push(
        item.arrayType === 'object' ? (
          renderItemArray(item.items !== undefined ? item.items : [], index)
        ) : (
          <div key={index} className="mb-2">
            <Controller
              key={field.id}
              name={`${prefix}${item.key}.${index}.value`}
              control={control}
              rules={
                item.arrayType === MixinsFormItemType.reference
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
                        item.type !== MixinsFormItemType.unknown &&
                        item.isRequired,
                    }
              }
              render={({ field: controllerField }) =>
                item.arrayType === MixinsFormItemType.reference ? (
                  <>
                    <label
                      className="flex align-items-center gap-2 font-bold mb-2"
                      style={{ color: 'var(--grey-4)', fontSize: '0.875rem' }}
                    >
                      <div>{index + 1}</div>
                      {textToTitleCase(
                        t(getReferenceTranslationKey(item.referenceType), {
                          type: item.referenceType,
                        })
                      )}
                    </label>
                    <div className="flex align-items-center">
                      <MixinsFormInput
                        disabled={!managerPermissions}
                        hideFieldName={true}
                        disableReferenceSelector={isReferenceArray}
                        item={item}
                        value={controllerField.value}
                        onInputChange={(_, value) =>
                          controllerField.onChange(value)
                        }
                      />
                      <Button
                        className="p-button-secondary-small ml-4"
                        onClick={() => remove(index)}
                        disabled={!managerPermissions}
                        icon={<HiMinus size={16} />}
                      />
                    </div>
                  </>
                ) : (
                  <InputField
                    required={
                      item.type !== MixinsFormItemType.unknown &&
                      item.isRequired
                    }
                    label={index + 1 + ' '}
                  >
                    <div className="flex align-items-center">
                      <MixinsFormInput
                        className="array-field"
                        disabled={!managerPermissions}
                        hideFieldName={true}
                        item={item}
                        value={controllerField.value}
                        onInputChange={(_, value) =>
                          controllerField.onChange(value)
                        }
                      />
                      <Button
                        className="p-button-secondary-small ml-2"
                        onClick={() => remove(index)}
                        disabled={!managerPermissions}
                        icon={<HiMinus size={20} />}
                      />
                    </div>
                  </InputField>
                )
              }
            />
          </div>
        )
      )

      if ((index + 1) % 5 === 0 || index === fields.length - 1) {
        columns.push(
          <div key={index} className="flex flex-column">
            {column}
          </div>
        )
        column = []
      }
    })

    return columns
  }

  if (isReferenceArray) {
    return (
      <MixinsSectionBox className="w-full" name={getUiLangValue(item.name)}>
        <div className="flex flex-column gap-4">
          {referenceType ? (
            <ReferenceSelector
              value={getCurrentSelectedIds()}
              onChange={handleMultiSelectorChange}
              referenceType={referenceType}
              disabled={!managerPermissions}
              className="w-full"
            />
          ) : (
            <div className="flex align-items-center gap-2">
              <span className="text-sm text-gray-600">
                {t('mixins.labels.multiReferenceNotSupported')}
              </span>
              <Button
                className="p-button-secondary p-button-sm"
                label={t('mixins.buttons.addNew')}
                onClick={() => {
                  append({
                    id: uuidv4(),
                    value: defaultValueForMixinItem(item, true, referenceType),
                  })
                }}
                disabled={!managerPermissions}
              />
            </div>
          )}
          <div className="flex flex-wrap gap-4">{renderColumns()}</div>
        </div>
      </MixinsSectionBox>
    )
  }

  return (
    <MixinsSectionBox
      key={item.key}
      item={item}
      append={() =>
        append({
          id: uuidv4(),
          value: defaultValueForMixinItem(
            item,
            true,
            isReferenceArray ? referenceType : undefined
          ),
        })
      }
      className="w-full"
      name={getUiLangValue(item.name)}
    >
      <div className="flex flex-wrap gap-3">{renderColumns()}</div>
    </MixinsSectionBox>
  )
}

export default MixinsFormArray
