import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Product } from '../../models/Category.model'
import { productDetailPath } from '../../constants/paths'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import styles from './VariantInformation.module.scss'

type VariantInformationProps = {
  readonly parent: Partial<Product>
}

export const VariantInformation = ({ parent }: VariantInformationProps) => {
  const { t } = useTranslation()
  const { getContentLangValue } = useLocalizedValue()
  const parentLabel =
    getContentLangValue(parent.name) || parent.id || ''

  return (
    <div className={styles.variantInformation}>
      <div>{t('products.variant.variantOf')}</div>
      <Link className={styles.link} to={productDetailPath(parent.id ?? '')}>
        <span className={styles.parentId}>{parentLabel}</span>
      </Link>
    </div>
  )
}
