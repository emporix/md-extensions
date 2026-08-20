import { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DataTable,
  type DataTableColumnProps,
  type DataTableFilterEvent,
  type DataTablePaginationState,
} from '@emporix/component-library'

import { useReturnForm } from '../../contexts/ReturnForm.provider'
import TableActions from '../shared/TableActions'
import { usePermissions } from '../../context/PermissionsProvider'
import usePagination, {
  DEFAULT_PAGINATION_PROPS,
} from '../../hooks/usePagination'
import type { Customer } from '../../models/Customer.model'
import { EmployeeDomains } from '../../configs/accessControls'
import { HOST_CUSTOMER_PATH } from '../../constants/paths'

const ReturnAddCustomers = () => {
  const {
    isLoading,
    customers,
    selectedCustomer,
    selectCustomer,
    totalCustomers,
    fetchCustomers,
  } = useReturnForm()
  const { t } = useTranslation()
  const { hasPermission } = usePermissions()
  const canViewCustomers = hasPermission(EmployeeDomains.CUSTOMERS_VIEWER)

  const {
    paginationParams,
    onPageCallback,
    setTotalCount,
    totalCount,
    setPaginationParams,
  } = usePagination(DEFAULT_PAGINATION_PROPS, false)

  const toggleCustomerSelection = useCallback(
    (customer: Customer) => {
      if (selectedCustomer && selectedCustomer.id === customer.id) {
        selectCustomer(null)
      } else {
        selectCustomer(customer)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedCustomer]
  )

  const onFilterCallback = (event: DataTableFilterEvent) => {
    setPaginationParams({
      ...paginationParams,
      first: 0,
      currentPage: 1,
      filters: event.filters,
    })
  }

  useEffect(() => {
    setTotalCount(totalCustomers)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalCustomers])

  useEffect(() => {
    fetchCustomers(paginationParams)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginationParams])

  const columns: DataTableColumnProps[] = [
    {
      columnKey: 'firstName',
      header: t('returns.create.customers.firstName'),
      field: 'firstName',
      filterField: 'firstName',
      sortable: true,
      filter: true,
    },
    {
      columnKey: 'lastName',
      header: t('returns.create.customers.lastName'),
      field: 'lastName',
      filterField: 'lastName',
      sortable: true,
      filter: true,
    },
  ]

  const pagination: DataTablePaginationState = {
    ...paginationParams,
    totalRecords: totalCount,
  }

  return (
    <DataTable
      dataKey="id"
      value={customers}
      columns={columns}
      selection={selectedCustomer ? [selectedCustomer] : []}
      onSelectionChange={(selection) =>
        selectCustomer((selection as Customer[])[0] ?? null)
      }
      selectionMode="single"
      onRowClick={(row) => toggleCustomerSelection(row as Customer)}
      pagination={pagination}
      lazy={true}
      sortField="created"
      sortOrder={-1}
      onFilter={onFilterCallback}
      onPage={onPageCallback}
      loading={isLoading}
      emptyTemplate={canViewCustomers ? '' : t('global.noPermissions')}
      rowActions={(customer: Customer) => (
        <TableActions
          onEdit={() =>
            // Customer details live in the host, not in this remote.
            window.location.assign(HOST_CUSTOMER_PATH(customer.id))
          }
        />
      )}
    />
  )
}

export default ReturnAddCustomers
