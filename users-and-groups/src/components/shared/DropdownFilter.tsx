import { Dropdown } from 'primereact/dropdown'
import { SelectItemOptionsType } from 'primereact/selectitem'
import { ColumnFilterElementTemplateOptions } from 'primereact/column'

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
      className="p-column-filter"
      style={{ minWidth: '180px' }}
      panelClassName="p-dropdown-panel-dialog"
    />
  )
}

export default DropdownFilterTemplate
