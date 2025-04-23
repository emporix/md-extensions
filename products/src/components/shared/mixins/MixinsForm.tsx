import { ReactNode, useCallback, useEffect } from 'react'
import { Button } from 'primereact/button'
import SectionBox from '../SectionBox'
import MixinsSectionBox from './MixinsSectionBox'

import { useTranslation } from 'react-i18next'
import {
  Controller,
  FormProvider,
  useFieldArray,
  useForm,
} from 'react-hook-form'
import {
  convertFromIdValuePair,
  convertToIdValuePair,
  createForm,
  defaultValueFromType,
  MixinsFormItem,
  MixinsFormItemType,
  MixinsFormMetadata,
  sortTree,
} from './helpers'
import InputField from '../InputField'
import MixinsFormInput from './MixinsFormInput'
import { useLocalizedValue } from '../../../hooks/useLocalizedValue'
import { Mixins } from '../../../models/Mixins'
import { HiMinus } from 'react-icons/hi'
import { v4 as uuidv4 } from 'uuid'

interface MixinFormProps {
  name: string
  mixins: Mixins
  metadata: MixinsFormMetadata
  onSave: (data: Mixins, metadata: MixinsFormMetadata) => Promise<void> | void
  items: MixinsFormItem[] | undefined
  managerPermissions?: boolean
}

const ArrayComponent = ({
  item,
  control,
  managerPermissions,
  parentKey,
}: {
  item: MixinsFormItem
  control: any
  managerPermissions: boolean
  parentKey?: string
}) => {
  const { getUiLangValue } = useLocalizedValue()
  const { t } = useTranslation()

  let prefix = ''
  if (parentKey !== undefined) {
    prefix = parentKey + '.'
  }
  const newParentKey = prefix + item.key

  const { fields, append, remove } = useFieldArray({
    name: newParentKey,
    control,
  })

  const renderColumns = () => {
    const columns = []
    let column: any[] = []

    const renderItemArray = (items: MixinsFormItem[], index: number) => {
      const parentName = getUiLangValue(item.name)
      const elements: ReactNode[] = []
      for (const item of items) {
        elements.push(
          renderItem(
            item,
            control,
            managerPermissions,
            getUiLangValue,
            index,
            newParentKey
          )
        )
      }

      const flexElements = (
        <div className="flex flex-wrap gap-4">{elements}</div>
      )
      if (parentName !== undefined) {
        return (
          <MixinsSectionBox
            key={index}
            className="w-full"
            name={index + 1 + ' '}
            remove={() => remove(index)}
          >
            {flexElements}
          </MixinsSectionBox>
        )
      }

      return flexElements
    }

    if (fields.length === 0) {
      columns.push(
        <span key={item.key} className="schema-empty-array">
          {t('schema.mixins.emptyArray', { type: item.arrayType })}
        </span>
      )
    }

    fields.forEach((field, index) => {
      column.push(
        item.arrayType === 'object' ? (
          renderItemArray(item.items !== undefined ? item.items : [], index)
        ) : (
          <div key={index} style={{ margin: '0.5em 0' }}>
            <Controller
              key={field.id}
              name={`${prefix}${item.key}.${index}.value`}
              control={control}
              rules={{
                required:
                  item.type !== MixinsFormItemType.unknown && item.isRequired,
              }}
              render={({ field: controllerField }) => (
                <InputField
                  required={
                    item.type !== MixinsFormItemType.unknown && item.isRequired
                  }
                  label={index + 1 + ' '}
                >
                  <div>
                    <MixinsFormInput
                      className="array-field"
                      disabled={!managerPermissions}
                      item={item}
                      value={controllerField.value}
                      onInputChange={(_key, value) =>
                        controllerField.onChange(value)
                      }
                    />
                    <Button
                      className="btn icon p-button-icon-only p-button-secondary ml-2"
                      onClick={() => remove(index)}
                    >
                      <HiMinus size={20} />
                    </Button>
                  </div>
                </InputField>
              )}
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

  return (
    <MixinsSectionBox
      key={item.key}
      append={() =>
        append({ id: uuidv4(), value: defaultValueFromType(item.type) })
      }
      className="w-full"
      name={getUiLangValue(item.name)}
    >
      <div className="flex flex-wrap gap-4">{renderColumns()}</div>
    </MixinsSectionBox>
  )
}

const renderItems = (
  formItems: MixinsFormItem[],
  parentName: string | undefined = undefined,
  control: any,
  managerPermissions: boolean,
  getUiLangValue: any,
  index?: any,
  arrayKey?: string
) => {
  const elements: ReactNode[] = []

  for (const item of formItems) {
    elements.push(
      renderItem(
        item,
        control,
        managerPermissions,
        getUiLangValue,
        index,
        arrayKey
      )
    )
  }

  const flexElements = <div className="flex flex-wrap gap-4">{elements}</div>
  if (parentName !== undefined) {
    return (
      <MixinsSectionBox key={uuidv4()} className="w-full" name={parentName}>
        {flexElements}
      </MixinsSectionBox>
    )
  }

  return flexElements
}

const renderItem = (
  item: MixinsFormItem,
  control: any,
  managerPermissions: boolean,
  getUiLangValue: any,
  index?: any,
  arrayKey?: string
) => {
  if (
    item.type === 'object' &&
    item.items !== undefined &&
    item.items.length > 0
  ) {
    const parentName = getUiLangValue(item.name)
    const sectionElements = renderItems(
      item.items,
      parentName,
      control,
      managerPermissions,
      getUiLangValue,
      index,
      arrayKey
    )
    return sectionElements
  } else if (item.type === 'array') {
    const arrayParentKey =
      index !== undefined && arrayKey !== undefined
        ? `${arrayKey}[${index}].value`
        : undefined

    const el = (
      <ArrayComponent
        key={item.key}
        item={item}
        control={control}
        managerPermissions={managerPermissions}
        parentKey={arrayParentKey}
      />
    )

    return el
  } else {
    const uniqueKey =
      index !== undefined ? `${arrayKey}.${index}.value.${item.key}` : item.key

    const element = (
      <Controller
        key={uniqueKey}
        name={uniqueKey}
        control={control}
        rules={{
          required: item.type !== MixinsFormItemType.unknown && item.isRequired,
        }}
        render={({ field: controllerField }) => (
          <InputField
            required={
              item.type !== MixinsFormItemType.unknown && item.isRequired
            }
            label={getUiLangValue(item.name)}
          >
            <MixinsFormInput
              disabled={!managerPermissions}
              item={item}
              value={controllerField.value}
              onInputChange={(_key, value) => controllerField.onChange(value)}
            ></MixinsFormInput>
          </InputField>
        )}
      />
    )
    return element
  }
}

const MixinsForm = (props: MixinFormProps) => {
  const { name, mixins, metadata, onSave, items, managerPermissions } = props
  const { t } = useTranslation()
  const methods = useForm()
  const { control, reset, handleSubmit, formState } = methods
  const { getUiLangValue } = useLocalizedValue()

  const prepareData = () => {
    const form = convertToIdValuePair(createForm(sortTree(items) ?? []))
    const mixinsKey = convertToIdValuePair(mixins[metadata.key])

    return {
      ...form,
      ...mixinsKey,
    }
  }

  const resetForm = () => {
    const defaultFormValues = prepareData()
    reset(defaultFormValues)
  }

  useEffect(() => {
    ;(async () => {
      resetForm()
    })()
  }, [mixins, items])

  const onSubmit = useCallback(
    async (data: Mixins) => {
      await onSave(convertFromIdValuePair(data), metadata)
    },
    [mixins, onSave]
  )

  return (
    <>
      <div className="flex justify-content-end">
        <Button
          className="p-button-secondary"
          label={t('global.discard')}
          onClick={() => resetForm()}
          disabled={!formState.isDirty || !managerPermissions}
        />
        <Button
          className="ml-3"
          disabled={
            !formState.isValid || !formState.isDirty || !managerPermissions
          }
          label={t('global.save')}
          onClick={handleSubmit(onSubmit)}
        />
      </div>

      <SectionBox name={name}>
        <FormProvider {...methods}>
          {items !== undefined &&
            items.length > 0 &&
            renderItems(
              items,
              undefined,
              control,
              managerPermissions ?? false,
              getUiLangValue
            )}
        </FormProvider>
      </SectionBox>
    </>
  )
}

MixinsForm.defaultProps = {
  disabled: false,
  readonly: false,
  managerPermissions: true,
}

export default MixinsForm
