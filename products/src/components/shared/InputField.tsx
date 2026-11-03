import type { CSSProperties, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { FieldLabel } from '@emporix/component-library'
import { useProductData } from '../../context/ProductDataProvider'
import { ProductType } from '../../models/Category.model'
import { textToTitleCase } from '../../helpers/utils'
import styles from './InputField.module.scss'

type InputFieldProps = {
  readonly label: string | ReactNode
  readonly name?: string
  readonly children?: ReactNode
  readonly required?: boolean
  readonly error?: string
  /** Hide the "Inherited from parent" hint for variant products. */
  readonly noInheritance?: boolean
  readonly tooltip?: string
  readonly checkbox?: boolean
  readonly addon?: ReactNode
  readonly className?: string
  readonly style?: CSSProperties
}

/**
 * Products-aware form field wrapper (MD `components/InputField`): CL
 * `FieldLabel` + the variant "Inherited from parent" hint driven by
 * `ProductDataProvider`. Use CL built-in `label` props instead when the
 * control has one and no inheritance hint is needed.
 */
const InputField = ({
  label,
  name,
  children,
  required = false,
  error,
  noInheritance = false,
  tooltip,
  checkbox = false,
  addon,
  className = '',
  style,
}: InputFieldProps) => {
  const { t } = useTranslation()
  const { product } = useProductData()
  const showInherited =
    !noInheritance &&
    name !== undefined &&
    product?.productType === ProductType.variant &&
    !product.metadata?.overridden?.includes(name)

  return (
    <div
      style={style}
      className={[styles.field, checkbox ? styles.checkbox : '', className]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles.labelRow}>
        <FieldLabel htmlFor={name} required={required} tooltip={tooltip}>
          {typeof label === 'string' ? textToTitleCase(label) : label}
        </FieldLabel>
        {showInherited && (
          <span className={styles.inherited}>
            {t('products.edit.inheritedFromParent')}
          </span>
        )}
        {addon && <div className={styles.addon}>{addon}</div>}
      </div>
      <div className={error ? styles.invalid : undefined}>{children}</div>
      {error && <small className={styles.error}>{error}</small>}
    </div>
  )
}

export default InputField
