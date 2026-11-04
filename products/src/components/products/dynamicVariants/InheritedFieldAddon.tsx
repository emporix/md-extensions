import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { UseFormResetField } from 'react-hook-form'
import { Tooltip } from '@emporix/component-library'
import { Product, ProductType } from '../../../models/Category.model'
import { useActiveNode } from '../../../context/ActiveNodeProvider'
import { useProductData } from '../../../context/ProductDataProvider'
import { INHERITABLE_FIELDS } from '../../../helpers/dynamicVariants/inheritableFields.helpers'
import { BsArrowCounterclockwise, BsDiagram2 } from 'react-icons/bs'
import styles from './DynamicVariant.module.scss'

interface Props {
  readonly fieldName: keyof Product
  readonly resetField: UseFormResetField<Product>
}

export const InheritedFieldAddon = ({ fieldName, resetField }: Props) => {
  const { t } = useTranslation()
  const { product } = useProductData()
  const { overriddenFields, inheritedValues, removeOverridden } =
    useActiveNode()

  const isInheritable =
    product?.productType === ProductType.dynamicVariant &&
    !!product?.parentVariantId &&
    INHERITABLE_FIELDS.includes(fieldName)

  const isOverridden = overriddenFields.has(fieldName)

  const handleReset = useCallback(() => {
    if (!(fieldName in inheritedValues)) return
    const original = inheritedValues[fieldName]
    resetField(fieldName, {
      defaultValue: original as Product[typeof fieldName],
    })
    removeOverridden(fieldName)
  }, [fieldName, inheritedValues, resetField, removeOverridden])

  if (!isInheritable) return null
  if (!isOverridden) {
    return (
      <div className={styles.addon}>
        <Tooltip
          content={t('products.dynamicVariant.tooltips.inherited')}
          position="top"
          showDelay={400}
        >
          <BsDiagram2 className={styles.addonIcon} size={16} />
        </Tooltip>
      </div>
    )
  }

  return (
    <div className={styles.addon} onClick={handleReset}>
      <Tooltip
        content={t('products.dynamicVariant.tooltips.resetToInherited')}
        position="top"
        showDelay={400}
      >
        <BsArrowCounterclockwise className={styles.addonIcon} size={16} />
      </Tooltip>
    </div>
  )
}
