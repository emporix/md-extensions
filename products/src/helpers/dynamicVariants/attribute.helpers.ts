import {
  DynamicVariantAttribute,
  DynamicVariantValueType,
} from '../../models/Category.model'
import Localized from '../../models/Localized.model'

export interface AttributeFormValues {
  attributeKey: string
  attributeName: Localized | undefined
  valueType: DynamicVariantValueType
  qualifier: string | number | boolean
  valueLabel: Localized | undefined
  unit: string
}

export const VALUE_TYPES: DynamicVariantValueType[] = [
  'STRING',
  'NUMBER',
  'DECIMAL',
  'BOOLEAN',
]

export const defaultFormValues = (): AttributeFormValues => ({
  attributeKey: '',
  attributeName: undefined,
  valueType: 'STRING',
  qualifier: '',
  valueLabel: undefined,
  unit: '',
})

export const formValuesToAttribute = (
  v: AttributeFormValues
): { key: string; attr: DynamicVariantAttribute } => {
  const attr: DynamicVariantAttribute = {
    name: v.attributeName as Localized,
    value: {
      type: v.valueType,
      qualifier: v.valueType === 'BOOLEAN' ? !!v.qualifier : v.qualifier,
      name: v.valueLabel as Localized,
      ...(v.unit ? { unit: v.unit } : {}),
    },
  }
  return { key: v.attributeKey.trim(), attr }
}

export const attributeToFormValues = (
  key: string,
  attr: DynamicVariantAttribute
): AttributeFormValues => ({
  attributeKey: key,
  attributeName: attr.name as Localized | undefined,
  valueType: attr.value?.type || 'STRING',
  qualifier: attr.value?.qualifier ?? '',
  valueLabel: (attr.value?.name as Localized | undefined) || undefined,
  unit: attr.value?.unit || '',
})

export const defaultQualifierForType = (
  type: DynamicVariantValueType
): string | number | boolean => {
  if (type === 'BOOLEAN') return false
  if (type === 'NUMBER' || type === 'DECIMAL') return 0
  return ''
}
