import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FilterMatchMode,
  PaginatedSelector,
  type DataTablePaginationState,
} from '@emporix/component-library'
import { PaginationProps } from '../../hooks/usePagination'
import { StylableProps } from '../../helpers/props'
import { useCustomerApi } from '../../hooks/api/customers'
import { usePermissions } from '../../context/PermissionsProvider'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import { Customer } from '../../models/Customer.model'
import { EmployeeDomains } from '../../configs/accessControls'

type CustomersSelectorProps = StylableProps & {
  readonly value?: string | string[]
  /** MD contract: customer numbers. */
  readonly onChange: (v: string[]) => void
  /** Overrides the default edit right taken from the target entity's manager role. */
  readonly canManage?: boolean
}

const filters = [
  { name: { en: 'First name', de: 'Vorname' }, code: 'firstName' },
  { name: { en: 'Last name', de: 'Nachname' }, code: 'lastName' },
  {
    name: { en: 'Customer number', de: 'Kundennummer' },
    code: 'customerNumber',
  },
]

/** Coupons restrict by customer number, so it is the selector id (MD parity). */
const asSelectorItem = (customer: Customer): Customer => ({
  ...customer,
  id: customer.customerNumber ?? customer.id,
})

/** Port of MD `components/shared/CustomersSelector` onto CL `PaginatedSelector`. */
const CustomersSelector = ({
  className,
  value,
  onChange,
  canManage,
}: CustomersSelectorProps) => {
  const { t } = useTranslation()
  const { syncCustomers } = useCustomerApi()
  const { hasPermission } = usePermissions()
  const { getUiLangValue } = useLocalizedValue()

  const resolveCustomers = async (selected: string | string[]) => {
    const numbers = Array.isArray(selected) ? selected : [selected]
    const customers = await Promise.all(
      numbers.map(async (customerNumber) => {
        const { values } = await syncCustomers({
          currentPage: 1,
          rows: 5,
          filters: {
            customerNumber: {
              value: customerNumber,
              matchMode: FilterMatchMode.CONTAINS,
            },
          },
        } as Partial<PaginationProps>)
        return values.find(
          (customer) => customer.customerNumber === customerNumber
        )
      })
    )
    return customers
      .filter((customer): customer is Customer => customer !== undefined)
      .map(asSelectorItem)
  }

  const searchCustomers = async (params: DataTablePaginationState) => {
    const { values, totalRecords } = await syncCustomers(
      params as Partial<PaginationProps>
    )
    return { values: values.map(asSelectorItem), totalRecords }
  }

  const itemTemplate = useCallback((item: Customer) => {
    const name = `${item.firstName || ''} ${item.lastName || ''}`.trim()
    return name || item.customerNumber || item.id
  }, [])

  return (
    <PaginatedSelector<Customer>
      className={className}
      value={value}
      onChange={(next) => onChange(next as string[])}
      searchFn={searchCustomers}
      resolveSelected={resolveCustomers}
      canManage={canManage ?? hasPermission(EmployeeDomains.CUSTOMERS_MANAGER)}
      canView={hasPermission(EmployeeDomains.CUSTOMERS_VIEWER)}
      filters={filters.map((filter) => ({
        code: filter.code,
        label: getUiLangValue(filter.name),
      }))}
      itemTemplate={itemTemplate}
      searchPlaceholder={(filterLabel) =>
        t('mixins.labels.search', { filter: filterLabel.toLowerCase() })
      }
      noDataMessage={t('global.noData')}
      noPermissionMessage={t('global.noPermissions')}
      removeItemAriaLabel={t('global.remove')}
      filterAriaLabel={t('global.toggleOptions')}
    />
  )
}

export default CustomersSelector
