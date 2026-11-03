import { useEffect, useMemo, useState } from 'react'
import {
  Dialog,
  Dropdown,
  InputNumber,
  InputSwitch,
  InputText,
  PrimaryButton,
  SecondaryButton,
} from '@emporix/component-library'
import { useTranslation } from 'react-i18next'
import { Controller, useForm } from 'react-hook-form'
import FormGrid from '../../shared/FormGrid'
import FormGridRow from '../../shared/FormGridRow'
import InputField from '../../shared/InputField'
import Localized from '../../../models/Localized.model'
import { DynamicVariantValueType } from '../../../models/Category.model'
import LocalizedInput from '../../shared/LocalizedInput'
import {
  AttributeFormValues,
  defaultFormValues,
  defaultQualifierForType,
  VALUE_TYPES,
} from '../../../helpers/dynamicVariants/attribute.helpers'
import { Unit } from '../../../models/Unit.model'
import { useUnitsApi } from '../../../hooks/api/units'
import { useLocalizedValue } from '../../../hooks/useLocalizedValue'
import styles from './DynamicVariant.module.scss'

interface Props {
  readonly visible: boolean
  readonly mode?: 'add' | 'edit'
  readonly initial?: AttributeFormValues
  readonly onHide: () => void
  readonly onSave: (values: AttributeFormValues) => void
  readonly canSave: boolean
}

export const DynamicVariantAttributeDialog = (props: Props) => {
  const { visible, mode, initial, onHide, onSave, canSave } = props
  const { t } = useTranslation()
  const { getAllUnits } = useUnitsApi()
  const { getContentLangValue } = useLocalizedValue()
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isValid },
  } = useForm<AttributeFormValues>({
    defaultValues: defaultFormValues(),
    mode: 'onChange',
  })

  const [units, setUnits] = useState<Unit[]>()
  const valueType = watch('valueType')

  useEffect(() => {
    void (async () => {
      const { values } = await getAllUnits()
      setUnits(values)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (visible) {
      reset(initial ?? defaultFormValues())
    }
  }, [visible, initial, reset])

  const typeOptions = useMemo(
    () => VALUE_TYPES.map((v) => ({ label: v, value: v })),
    []
  )

  const onSubmit = handleSubmit((values) => {
    onSave({ ...values, attributeKey: values.attributeKey.trim() })
    onHide()
  })

  const footer = (
    <div className={styles.dialogFooter}>
      <SecondaryButton onClick={onHide}>{t('global.cancel')}</SecondaryButton>
      <PrimaryButton disabled={!canSave || !isValid} onClick={onSubmit}>
        {t('global.save')}
      </PrimaryButton>
    </div>
  )

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={
        mode === 'add'
          ? t('products.dynamicVariant.titles.addAttribute')
          : t('products.dynamicVariant.titles.editAttribute')
      }
      footer={footer}
      style={{ width: '800px' }}
    >
      <FormGrid>
        <FormGridRow>
          <InputField
            label={t('products.dynamicVariant.forms.attribute.key')}
            className={styles.halfField}
            required
          >
            <Controller
              name="attributeKey"
              control={control}
              rules={{ required: true, validate: (v) => !!v.trim() }}
              render={({ field }) => (
                <InputText
                  readOnly={mode === 'edit'}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              )}
            />
          </InputField>
          <InputField
            label={t('products.dynamicVariant.forms.attribute.name')}
            className={styles.halfField}
          >
            <Controller
              name="attributeName"
              control={control}
              render={({ field }) => (
                <LocalizedInput
                  value={field.value}
                  onChange={(v: Localized | undefined) => field.onChange(v)}
                />
              )}
            />
          </InputField>
        </FormGridRow>
        <FormGridRow>
          <InputField
            label={t('products.dynamicVariant.forms.attribute.type')}
            className={styles.halfField}
          >
            <Controller
              name="valueType"
              control={control}
              render={({ field }) => (
                <Dropdown
                  value={field.value}
                  options={typeOptions}
                  onChange={(e) => {
                    const nextType = e.value as DynamicVariantValueType
                    field.onChange(nextType)
                    setValue('qualifier', defaultQualifierForType(nextType), {
                      shouldValidate: true,
                    })
                  }}
                />
              )}
            />
          </InputField>
          <InputField
            label={t('products.dynamicVariant.forms.attribute.unit')}
            className={styles.halfField}
          >
            <Controller
              name="unit"
              control={control}
              render={({ field }) => (
                <Dropdown
                  options={(units ?? []).map((unit: Unit) => ({
                    label: getContentLangValue(unit.name),
                    value: unit.code,
                  }))}
                  value={field.value}
                  onChange={(ev) => field.onChange(ev.value)}
                />
              )}
            />
          </InputField>
        </FormGridRow>
        <FormGridRow>
          <InputField
            label={t('products.dynamicVariant.forms.attribute.value')}
            className={styles.halfField}
            required
          >
            <Controller
              name="qualifier"
              control={control}
              rules={{
                validate: (v) =>
                  valueType === 'BOOLEAN' ||
                  (v !== undefined && v !== null && String(v).trim() !== ''),
              }}
              render={({ field }) =>
                valueType === 'BOOLEAN' ? (
                  <InputSwitch
                    checked={!!field.value}
                    onChange={(e) => field.onChange(e.value)}
                  />
                ) : valueType === 'NUMBER' || valueType === 'DECIMAL' ? (
                  <InputNumber
                    value={
                      field.value !== undefined && field.value !== null
                        ? Number(field.value)
                        : null
                    }
                    onChange={(e) => field.onChange(e.value ?? 0)}
                    mode="decimal"
                    minFractionDigits={0}
                    maxFractionDigits={valueType === 'DECIMAL' ? 10 : 0}
                    useGrouping={false}
                  />
                ) : (
                  <InputText
                    value={
                      field.value !== undefined && field.value !== null
                        ? String(field.value)
                        : ''
                    }
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                )
              }
            />
          </InputField>
          <InputField
            label={t('products.dynamicVariant.forms.attribute.valueLabel')}
            className={styles.halfField}
          >
            <Controller
              name="valueLabel"
              control={control}
              render={({ field }) => (
                <LocalizedInput
                  value={field.value}
                  onChange={(v: Localized | undefined) => field.onChange(v)}
                />
              )}
            />
          </InputField>
        </FormGridRow>
      </FormGrid>
    </Dialog>
  )
}
