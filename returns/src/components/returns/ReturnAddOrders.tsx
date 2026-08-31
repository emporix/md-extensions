import { useEffect } from 'react'
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
import type { Order } from '../../models/Order.model'
import { EmployeeDomains, VendorDomains } from '../../configs/accessControls'
import { HOST_CUSTOMER_PATH } from '../../constants/paths'

const ANONYMOUS_CUSTOMER_ID = 'ANONYMOUS'

const ReturnAddOrders = ({ isActive }: { readonly isActive: boolean }) => {
  const {
    isLoading,
    orders,
    selectedOrders,
    selectedCustomer,
    toggleOrder,
    totalOrdersCount,
    chooseAnonymousEmail,
    fetchCustomerOrders,
  } = useReturnForm()
  const { t } = useTranslation()
  const { hasPermission } = usePermissions()
  const canViewOrders =
    hasPermission(EmployeeDomains.ORDERS_VIEWER) ||
    hasPermission(VendorDomains.VENDOR_ORDERS_VIEWER)

  const {
    paginationParams,
    onPageCallback,
    setTotalCount,
    totalCount,
    setPaginationParams,
  } = usePagination(DEFAULT_PAGINATION_PROPS, false)

  useEffect(() => {
    setTotalCount(totalOrdersCount)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalOrdersCount])

  const onFilterCallback = (event: DataTableFilterEvent) => {
    setPaginationParams({
      ...paginationParams,
      first: 0,
      currentPage: 1,
      filters: event.filters,
    })
  }

  useEffect(() => {
    const params = { ...paginationParams }
    const filters = { ...(params.filters ?? {}) }

    if (selectedCustomer) {
      filters['customer.id'] = {
        value: selectedCustomer.id,
        matchMode: 'equals',
      }
    } else {
      // With no customer picked, only anonymous orders are eligible — and once
      // one is selected, restrict to that guest's email.
      filters['customer.id'] = {
        value: ANONYMOUS_CUSTOMER_ID,
        matchMode: 'equals',
      }
      if (selectedOrders.length !== 0) {
        filters['customer.email'] = {
          value: selectedOrders[0].customer.email,
          matchMode: 'equals',
        }
      }
    }

    params.filters = filters
    void fetchCustomerOrders(params)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginationParams, selectedCustomer, isActive, selectedOrders])

  useEffect(() => {
    if (!selectedCustomer && selectedOrders.length !== 0) {
      chooseAnonymousEmail(selectedOrders[0].customer.email)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrders])

  const columns: DataTableColumnProps[] = [
    {
      columnKey: 'id',
      header: t('returns.create.orders.orderNumber'),
      field: 'id',
      filterField: 'id',
      sortable: true,
      filter: true,
    },
    {
      columnKey: 'customer.email',
      header: t('global.email'),
      field: 'customer.email',
      filterField: 'customer.email',
      sortable: true,
      filter: true,
    },
  ]

  const pagination: DataTablePaginationState = {
    first: paginationParams.first,
    rows: paginationParams.rows,
    filters: paginationParams.filters,
    totalRecords: totalCount,
  }

  const header = canViewOrders
    ? selectedCustomer
      ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}`
      : t('returns.create.notSelectedCustomer')
    : undefined

  return (
    <DataTable
      dataKey="id"
      header={header}
      value={orders}
      columns={columns}
      selection={selectedOrders}
      onSelectionChange={(selection) => toggleOrder(selection as Order[])}
      selectionMode="multiple"
      pagination={pagination}
      lazy={true}
      sortField="created"
      sortOrder={-1}
      onFilter={onFilterCallback}
      onPage={onPageCallback}
      loading={isLoading}
      emptyTemplate={canViewOrders ? '' : t('global.noPermissions')}
      rowActions={(order: Order) =>
        order.customer.id !== ANONYMOUS_CUSTOMER_ID ? (
          <TableActions
            onEdit={() =>
              // Customer details live in the host, not in this remote.
              window.location.assign(HOST_CUSTOMER_PATH(order.customer.id))
            }
          />
        ) : null
      }
    />
  )
}

export default ReturnAddOrders
