import {
  Dropdown,
  type DataTableColumnFilterElementOptions,
} from '@emporix/component-library'
import styles from './DropdownFilter.module.scss'

type DropdownFilterOption = {
  readonly label: string
  readonly value: string
}

type DropdownFilterProps = {
  readonly dropdownOptions: DropdownFilterOption[]
  readonly filterOptions: DataTableColumnFilterElementOptions
  readonly placeholder?: string
}

export const DropdownFilter = ({
  placeholder,
  dropdownOptions,
  filterOptions,
}: DropdownFilterProps) => {
  return (
    <Dropdown
      data-testid="dropdown-filter"
      placeholder={placeholder}
      options={dropdownOptions}
      value={filterOptions.value}
      onChange={(e) =>
        filterOptions.filterApplyCallback(e.value, filterOptions.index)
      }
    />
  )
}

const DropdownFilterTemplate = (
  options: DataTableColumnFilterElementOptions,
  menu: DropdownFilterOption[]
) => {
  return (
    <Dropdown
      value={options.value}
      options={menu}
      onChange={(e) => {
        options.filterApplyCallback(e.value, options.index)
      }}
      className={`${styles.filterDropdown} p-column-filter`}
    />
  )
}

export default DropdownFilterTemplate
