import { Dropdown } from 'primereact/dropdown'
import { SelectItemOptionsType } from 'primereact/selectitem'
import { ColumnFilterElementTemplateOptions } from 'primereact/column'

interface DropdownFilterProps {
  dropdownOptions: SelectItemOptionsType
  filterOptions: ColumnFilterElementTemplateOptions
  placeholder?: string
}

export const DropdownFilter = (props: DropdownFilterProps) => {
  const { placeholder, dropdownOptions, filterOptions } = props
  return (
    <Dropdown
      data-test-id="dropdown-filter"
      placeholder={placeholder}
      options={dropdownOptions}
      value={filterOptions.value}
      onChange={(e) =>
        filterOptions.filterApplyCallback(e.value, filterOptions.index)
      }
    ></Dropdown>
  )
}
