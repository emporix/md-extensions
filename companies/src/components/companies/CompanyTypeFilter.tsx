import {
  Dropdown,
  type DataTableColumnFilterElementOptions,
} from '@emporix/component-library'
import { CompanyType } from '../../models/LegalEntity.model'
import styles from './CompanyTypeFilter.module.scss'

/** MD `useCompaniesColumns` `companyTypeFilter`: type dropdown + clear icon. */
const CompanyTypeFilter = ({
  options,
}: {
  readonly options: DataTableColumnFilterElementOptions
}) => {
  const handleChange = (value: CompanyType | '') => {
    options.filterApplyCallback(value, options.index)
  }

  return (
    <div className={styles.typeFilter}>
      <Dropdown
        className={styles.typeFilterDropdown}
        data-testid="company-type-filter"
        options={[
          { label: 'Subsidiary', value: CompanyType.SUBSIDIARY },
          { label: 'Company', value: CompanyType.COMPANY },
        ]}
        value={options.value}
        onChange={(e) => handleChange(e.value as CompanyType)}
      />
      {Boolean(options.value) && (
        <button
          onClick={() => handleChange('')}
          className={`${styles.clearButton} p-column-filter-clear-button p-link`}
          type="button"
          aria-label="Clear"
        >
          <span className="pi pi-filter-slash" aria-hidden="true"></span>
        </button>
      )}
    </div>
  )
}

export default CompanyTypeFilter
