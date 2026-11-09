import {
  Dropdown,
  type DataTableColumnFilterElementOptions,
} from '@emporix/component-library'
import { useTranslation } from 'react-i18next'
import { CompanyType } from '../../models/LegalEntity.model'
import styles from './CompanyTypeFilter.module.scss'

/** MD `useCompaniesColumns` `companyTypeFilter`: type dropdown + clear icon. */
const CompanyTypeFilter = ({
  options,
}: {
  readonly options: DataTableColumnFilterElementOptions
}) => {
  const { t } = useTranslation()
  const handleChange = (value: CompanyType | '') => {
    options.filterApplyCallback(value, options.index)
  }

  return (
    <div className={styles.typeFilter}>
      <Dropdown
        className={styles.typeFilterDropdown}
        data-testid="company-type-filter"
        options={[
          { label: t('companies.subsidiary'), value: CompanyType.SUBSIDIARY },
          { label: t('companies.singular'), value: CompanyType.COMPANY },
        ]}
        value={options.value}
        onChange={(e) => handleChange(e.value as CompanyType)}
      />
      {Boolean(options.value) && (
        <button
          onClick={() => handleChange('')}
          className={`${styles.clearButton} p-column-filter-clear-button p-link`}
          type="button"
          aria-label={t('global.clear')}
        >
          <span className="pi pi-filter-slash" aria-hidden="true"></span>
        </button>
      )}
    </div>
  )
}

export default CompanyTypeFilter
