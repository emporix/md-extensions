import { useTranslation } from 'react-i18next'
import { ProductRow } from '@emporix/api-calls'
import { IconButton } from '@emporix/component-library'
import { BsXCircleFill } from 'react-icons/bs'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import { usePermissions } from '../../context/PermissionsProvider'
import { StylableProps } from '../../helpers/props'
import { EmployeeDomains } from '../../configs/accessControls'
import PriceOnRequestBadge from './PriceOnRequestBadge'
import styles from './QuotesTabProductsSelected.module.scss'

interface QuotesTabProductsSelectedProps extends StylableProps {
  products: ProductRow[]
  removeProduct: (idToRemove: string) => void
  /** Saved items without a price (COP-7125). */
  unpricedProductIds?: string[]
}

/**
 * The picked products: name, id, a "No price" badge for saved items
 * without a price (COP-7125) and a remove button.
 */
const QuotesTabProductsSelected = (props: QuotesTabProductsSelectedProps) => {
  const { products, removeProduct, unpricedProductIds = [] } = props
  const showBadgeColumn = unpricedProductIds.length > 0
  const { t } = useTranslation()
  const { getContentLangValue } = useLocalizedValue()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.QUOTES_MANAGER)

  return (
    <div className={styles.selectedItems} data-testid="quote-selected-items">
      {products.map((product) => (
        <div
          key={product.id}
          className={`${styles.selectedItem} ${
            showBadgeColumn ? styles.selectedItemWithBadge : ''
          }`}
        >
          <div className={styles.itemCol}>
            {getContentLangValue(product.ref.localizedName)}
          </div>
          <div className={styles.itemCol}>{product.id}</div>
          {showBadgeColumn && (
            <div className={styles.badgeCol}>
              {unpricedProductIds.includes(product.id) && (
                <PriceOnRequestBadge />
              )}
            </div>
          )}
          <div className={styles.removeCol}>
            <IconButton
              disabled={!canManage}
              icon={<BsXCircleFill size={16} />}
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
