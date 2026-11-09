import useCustomNavigate from '../../hooks/useCustomNavigate'
import { companyDetailPath } from '../../constants/paths'
import styles from './CompanyBreadcrumb.module.scss'

export interface CompanyBreadcrumbItem {
  id: string
  name: string
}

const CompanyBreadcrumb = ({
  items,
}: {
  readonly items: CompanyBreadcrumbItem[]
}) => {
  const { navigate } = useCustomNavigate()

  return (
    <nav className={styles.breadcrumb} data-testid="company-breadcrumb">
      {items.map((item, index) => (
        <div key={item.id}>
          {index > 0 && <span className={styles.separator}>/</span>}
          <button
            type="button"
            className={[
              styles.item,
              index === items.length - 1 ? styles.highlight : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => navigate(companyDetailPath(item.id))}
          >
            {item.name}
          </button>
        </div>
      ))}
    </nav>
  )
}

export default CompanyBreadcrumb
