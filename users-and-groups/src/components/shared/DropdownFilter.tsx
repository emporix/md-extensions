import { Dropdown } from 'primereact/dropdown'
import { ColumnFilterElementTemplateOptions } from 'primereact/column'
import { SelectItemOptionsType } from 'primereact/selectitem'
import styles from './DropdownFilter.module.scss'

type DropdownFilterProps = {
  readonly dropdownOptions: SelectItemOptionsType
  readonly filterOptions: ColumnFilterElementTemplateOptions
  readonly placeholder?: string
}

export const DropdownFilter = ({
  placeholder,
  dropdownOptions,
  filterOptions,
}: DropdownFilterProps) => {
  return (
    <Dropdown
      data-test-id="dropdown-filter"
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
  options: ColumnFilterElementTemplateOptions,
  menu: { label: string; value: string }[]
) => {
  return (
    <Dropdown
      value={options.value}
      showClear
      options={menu}
      onChange={(e) => {
        options.filterApplyCallback(e.value, options.index)
      }}
      className={`${styles.filterDropdown} p-column-filter`}
      panelClassName={styles.filterDropdownPanel}
    />
  )
}

export default DropdownFilterTemplate
