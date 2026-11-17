import { useTranslation } from 'react-i18next'
import { ProductRow } from '@emporix/api-calls'
import { IconButton } from '@emporix/component-library'
import { BsXCircleFill } from 'react-icons/bs'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import { usePermissions } from '../../context/PermissionsProvider'
import { StylableProps } from '../../helpers/props'
import { EmployeeDomains } from '../../configs/accessControls'
import styles from './QuotesTabProductsSelected.module.scss'

interface QuotesTabProductsSelectedProps extends StylableProps {
  products: ProductRow[]
  removeProduct: (idToRemove: string) => void
}

/** The picked products: name, id and a remove button. */
const QuotesTabProductsSelected = (props: QuotesTabProductsSelectedProps) => {
  const { products, removeProduct } = props
  const { t } = useTranslation()
  const { getContentLangValue } = useLocalizedValue()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.QUOTES_MANAGER)

  return (
    <div className={styles.selectedItems} data-testid="quote-selected-items">
      {products.map((product) => (
        <div key={product.id} className={styles.selectedItem}>
          <div className={`${styles.col5} ${styles.itemCol}`}>
            {getContentLangValue(product.ref.localizedName)}
          </div>
          <div className={`${styles.col6} ${styles.itemCol}`}>{product.id}</div>
          <div className={styles.col1}>
            <IconButton
              disabled={!canManage}
              icon={<BsXCircleFill size={18} />}
              ariaLabel={t('global.remove')}
              // MD's button had no tooltip.
              tooltip=""
              onClick={(e) => {
                e.preventDefault()
                removeProduct(product.id)
              }}
              data-testid={`quote-remove-product-${product.id}`}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export default QuotesTabProductsSelected
