import {
  Dropdown,
  type DataTableColumnFilterElementOptions,
} from '@emporix/component-library'

type BooleanFilterOption = {
  readonly label: string
  readonly value: boolean
}

type BooleanFilterProps = {
  readonly filterOptions: DataTableColumnFilterElementOptions
  readonly options: BooleanFilterOption[]
}

/** MD `DropdownFilterTemplate` for a yes/no column, clearable. */
const BooleanFilter = ({ filterOptions, options }: BooleanFilterProps) => (
  <Dropdown
    data-testid="active-filter"
    value={filterOptions.value}
    options={options}
    showClear
    onChange={(e) =>
      filterOptions.filterApplyCallback(e.value ?? null, filterOptions.index)
    }
  />
)

export default BooleanFilter
