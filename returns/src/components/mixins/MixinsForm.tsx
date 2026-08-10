import { ReactNode, useCallback, useEffect } from 'react'
import {
  PrimaryButton,
  SecondaryButton,
  SectionBox,
} from '@emporix/component-library'
import { useTranslation } from 'react-i18next'
import {
  Control,
  Controller,
  FieldValues,
  FormProvider,
  useFieldArray,
  useForm,
} from 'react-hook-form'
import { HiMinus } from 'react-icons/hi'
import { v4 as uuidv4 } from 'uuid'
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
import MixinsSectionBox from './MixinsSectionBox'
import MixinsFormInput from './MixinsFormInput'
import InputField from '../shared/InputField'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import { Mixins } from '../../models/Mixins.model'
import Localized from '../../models/Localized.model'
import styles from './MixinsForm.module.scss'

type MixinsControl = Control<FieldValues>
type GetUiLangValue = (value: Localized | string | undefined) => string

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
  control: MixinsControl
  managerPermissions: boolean
  parentKey?: string
}) => {
  const { getUiLangValue } = useLocalizedValue()
  const { t } = useTranslation()

  const prefix = parentKey !== undefined ? `${parentKey}.` : ''
  const newParentKey = prefix + item.key

  const { fields, append, remove } = useFieldArray({
    name: newParentKey,
    control,
  })

  const renderColumns = () => {
    const columns: ReactNode[] = []
    let column: ReactNode[] = []

    const renderItemArray = (items: MixinsFormItem[], index: number) => {
      const parentName = getUiLangValue(item.name)
      const elements: ReactNode[] = items.map((child) =>
        renderItem(
          child,
          control,
          managerPermissions,
          getUiLangValue,
          index,
          newParentKey
        )
      )

      const flexElements = <div className={styles.fieldRow}>{elements}</div>
      if (parentName !== undefined) {
        return (
          <MixinsSectionBox
            key={index}
            name={`${index + 1} `}
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
        <span key={item.key} className={styles.emptyArray}>
          {t('global.mixins.emptyArray', { type: item.arrayType })}
        </span>
      )
    }

    fields.forEach((field, index) => {
      column.push(
        item.arrayType === MixinsFormItemType.object ? (
          renderItemArray(item.items ?? [], index)
        ) : (
          <div key={field.id} className={styles.arrayItem}>
            <Controller
              name={`${prefix}${item.key}.${index}.value`}
              control={control}
              rules={{
                required:
                  item.type !== MixinsFormItemType.unknown && item.isRequired,
              }}
              render={({ field: controllerField }) => (
                <InputField
                  className=""
                  required={
                    item.type !== MixinsFormItemType.unknown && item.isRequired
                  }
                  label={`${index + 1} `}
                >
                  <div className={styles.arrayItemControl}>
                    <MixinsFormInput
                      disabled={!managerPermissions}
                      item={item}
                      value={controllerField.value}
                      onInputChange={(_key, value) =>
                        controllerField.onChange(value)
                      }
                    />
                    <SecondaryButton
                      className={styles.removeButton}
                      onClick={() => remove(index)}
                    >
                      <HiMinus size={20} />
                    </SecondaryButton>
                  </div>
                </InputField>
              )}
            />
          </div>
        )
      )

      if ((index + 1) % 5 === 0 || index === fields.length - 1) {
        columns.push(
          <div key={`column-${index}`} className={styles.column}>
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
      name={getUiLangValue(item.name)}
    >
      <div className={styles.fieldRow}>{renderColumns()}</div>
    </MixinsSectionBox>
  )
}

const renderItems = (
  formItems: MixinsFormItem[],
  parentName: string | undefined,
  control: MixinsControl,
  managerPermissions: boolean,
  getUiLangValue: GetUiLangValue,
  index?: number,
  arrayKey?: string
) => {
  const elements: ReactNode[] = formItems.map((item) =>
    renderItem(
      item,
      control,
      managerPermissions,
      getUiLangValue,
      index,
      arrayKey
    )
  )

  const flexElements = <div className={styles.fieldRow}>{elements}</div>
  if (parentName !== undefined) {
    return (
      <MixinsSectionBox key={parentName} name={parentName}>
        {flexElements}
      </MixinsSectionBox>
    )
  }

  return flexElements
}

const renderItem = (
  item: MixinsFormItem,
  control: MixinsControl,
  managerPermissions: boolean,
  getUiLangValue: GetUiLangValue,
  index?: number,
  arrayKey?: string
): ReactNode => {
  if (
    item.type === MixinsFormItemType.object &&
    item.items !== undefined &&
    item.items.length > 0
  ) {
    return renderItems(
      item.items,
      getUiLangValue(item.name),
      control,
      managerPermissions,
      getUiLangValue,
      index,
      arrayKey
    )
  }

  if (item.type === MixinsFormItemType.array) {
    const arrayParentKey =
      index !== undefined && arrayKey !== undefined
        ? `${arrayKey}[${index}].value`
        : undefined

    return (
      <ArrayComponent
        key={item.key}
        item={item}
        control={control}
        managerPermissions={managerPermissions}
        parentKey={arrayParentKey}
      />
    )
  }

  const uniqueKey =
    index !== undefined ? `${arrayKey}.${index}.value.${item.key}` : item.key

  return (
    <Controller
      key={uniqueKey}
      name={uniqueKey}
      control={control}
      rules={{
        required: item.type !== MixinsFormItemType.unknown && item.isRequired,
      }}
      render={({ field: controllerField }) => (
        <InputField
          className=""
          required={item.type !== MixinsFormItemType.unknown && item.isRequired}
          label={getUiLangValue(item.name)}
        >
          <MixinsFormInput
            disabled={!managerPermissions}
            item={item}
            value={controllerField.value}
            onInputChange={(_key, value) => controllerField.onChange(value)}
          />
        </InputField>
      )}
    />
  )
}

const MixinsForm = ({
  name,
  mixins,
  metadata,
  onSave,
  items,
  managerPermissions = true,
}: MixinFormProps) => {
  const { t } = useTranslation()
  const methods = useForm()
  const { control, reset, handleSubmit, formState } = methods
  const { getUiLangValue } = useLocalizedValue()

  const resetForm = useCallback(() => {
    const form = convertToIdValuePair(createForm(sortTree(items) ?? []))
    const mixinsKey = convertToIdValuePair(mixins[metadata.key])
    reset({ ...form, ...mixinsKey })
  }, [items, mixins, metadata.key, reset])

  useEffect(() => {
    resetForm()
  }, [resetForm])

  const onSubmit = useCallback(
    async (data: Mixins) => {
      await onSave(convertFromIdValuePair(data), metadata)
    },
    [metadata, onSave]
  )

  return (
    <>
      <div className={styles.actions}>
        <SecondaryButton
          onClick={resetForm}
          disabled={!formState.isDirty || !managerPermissions}
        >
          {t('global.discard')}
        </SecondaryButton>
        <PrimaryButton
          disabled={
            !formState.isValid || !formState.isDirty || !managerPermissions
          }
          onClick={handleSubmit(onSubmit)}
        >
          {t('global.save')}
        </PrimaryButton>
      </div>

      <SectionBox name={name}>
        <FormProvider {...methods}>
          {items !== undefined &&
            items.length > 0 &&
            renderItems(
              items,
              undefined,
              control,
              managerPermissions,
              getUiLangValue
            )}
        </FormProvider>
      </SectionBox>
    </>
  )
}

export default MixinsForm
