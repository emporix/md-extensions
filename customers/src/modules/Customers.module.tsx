import { Button } from 'primereact/button'
import { Column, ColumnProps } from 'primereact/column'
import {
  DataTableFilterParams,
  DataTableSortParams,
} from 'primereact/datatable'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCustomerApi } from '../api/customers'
import { PaginatedResponse } from '../api/orders'
import BatchDeleteButton from '../components/shared/BatchDeleteButton'
import { useUIBlocker } from '../context/UIBlcoker'
import { makeCall } from '../helpers/api'
import usePagination from '../hooks/usePagination'
import { Customer } from '../models/Customer'
import HeaderSection from '../components/shared/HeaderSection'
import useCustomNavigate from '../hooks/useCustomNavigate'
import TableActions from '../components/shared/TableActions'
import { usePermissions } from '../context/PermissionsProvider'
import { useTenant } from '../context/TenantProvider'
import MdDataTable from '../components/MdDataTable'
import { SchemaType } from 'models/Schema'
import { TableExtensions } from 'components/TableExtensions'
import { useConfiguration } from 'context/ConfigurationProvider'
import { DisplayMixin, parseColumnProps } from 'models/DisplayMixin'
import { useLocalizedValue } from 'hooks/useLocalizedValue'
import { useToast } from 'context/ToastProvider'

const TABLE_NAME = 'customers'
const TABLE_NAME_CONFIG_KEY = 'ext_customers'

const CustomersModule = () => {
  const { syncCustomers, deleteCustomer } = useCustomerApi()
  const [isLoading, setIsLoading] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [refreshKey, setRefreshKey] = useState(0)
  const { blockPanel } = useUIBlocker()
  const [selectedCustomers, setSelectedCustomers] = useState<Customer[]>([])
  const { navigate } = useCustomNavigate()
  const [isDeletingProducts, setIsDeletingProducts] = useState(false)
  const { getUiLangValue } = useLocalizedValue()
  const [visibleColumns, setVisibleColumns] = useState<string[]>([])
  const { showError, showSuccess } = useToast()

  const { i18n, t } = useTranslation()
  const {
    paginationParams,
    onPageCallback,
    setTotalCount,
    totalCount,
    setPaginationParams,
  } = usePagination({
    currentPage: 1,
    rows: 10,
    first: 0,
    sortOrder: -1,
    sortField: 'metadataCreatedAt',
  })
  const { tenant } = useTenant()

  const { permissions } = usePermissions()
  const canBeManaged = permissions?.customers?.manager

  const { getTableMixinColumns, fetchVisibleColumns, tableConfigurations } =
    useConfiguration()
  const [visibleMixins, setVisibleMixins] = useState<DisplayMixin[]>(
    getTableMixinColumns(TABLE_NAME_CONFIG_KEY)
  )
  const invalidateCustomers = () => {
    // Temporary setTimeout solution till API will fix
    setTimeout(() => setRefreshKey(Date.now()), 500)
  }

  useEffect(() => {
    setVisibleColumns(fetchVisibleColumns(TABLE_NAME_CONFIG_KEY))
    setVisibleMixins(getTableMixinColumns(TABLE_NAME_CONFIG_KEY))
  }, [tableConfigurations])

  useEffect(() => {
    ;(async () => {
      try {
        setIsLoading(true)
        const { values, totalRecords } = await makeCall<
          PaginatedResponse<Customer>
        >(() => syncCustomers(paginationParams), setIsLoading)
        setCustomers(values)
        setTotalCount(totalRecords)
      } catch (e) {
        console.error(e)
      } finally {
        setIsLoading(false)
      }
    })()
  }, [paginationParams, refreshKey, tenant])

  const deleteSingleHandler = async (customerId: string) => {
    try {
      await deleteCustomer(customerId)
      const filteredCustomers = selectedCustomers.filter(
        (c) => c.id !== customerId
      )
      showSuccess(t('customers.toasts.successDelete'))
      setSelectedCustomers(filteredCustomers)
      invalidateCustomers()
    } catch (e) {
      console.error(e)
      showError(t('customers.toasts.errorDelete'))
    }
  }

  const customerActions = (rowData: { id: string }) => {
    return (
      <TableActions
        managerPermission={canBeManaged}
        onDelete={() => deleteSingleHandler(rowData.id)}
        onEdit={() => navigate(`/customers/${rowData.id}`)}
        deleteConfirm={{ pluralsPath: 'customers', entity: rowData }}
      />
    )
  }

  const columns = useMemo<ColumnProps[]>(() => {
    let rawColumns: ColumnProps[] = [
      {
        columnKey: 'id',
        header: t(TABLE_NAME + '.table.columns.id'),
        filterField: 'id',
        field: 'id',
        filter: true,
        sortable: true,
        showFilterMenu: false,
        showClearButton: false,
      },
      {
        columnKey: 'firstName',
        header: t(TABLE_NAME + '.table.columns.firstName'),
        field: 'firstName',
        filter: true,
        sortable: true,
        showFilterMenu: false,
        showClearButton: false,
      },
      {
        columnKey: 'lastName',
        header: t(TABLE_NAME + '.table.columns.lastName'),
        filterField: 'lastName',
        field: 'lastName',
        filter: true,
        sortable: true,
        showFilterMenu: false,
        showClearButton: false,
      },
      {
        columnKey: 'contactEmail',
        header: t(TABLE_NAME + '.table.columns.contactEmail'),
        filterField: 'contactEmail',
        field: 'contactEmail',
        filter: true,
        sortable: true,
        showFilterMenu: false,
        showClearButton: false,
      },
      {
        columnKey: 'preferredSite',
        header: t(TABLE_NAME + '.table.columns.preferredSite'),
        filterField: 'preferredSite',
        field: 'preferredSite',
        filter: true,
        sortable: true,
        showFilterMenu: false,
        showClearButton: false,
      },
    ].map((col) => {
      const hidden =
        visibleColumns.length > 0
          ? !visibleColumns.includes(col.columnKey || '')
          : false
      return { ...col, hidden }
    })

    rawColumns = [
      ...rawColumns,
      ...visibleMixins.map((m) => ({
        ...parseColumnProps(m, getUiLangValue),
      })),
    ]

    rawColumns.push({
      columnKey: 'actions',
      headerStyle: { width: '110px' },
      body: customerActions,
    })

    return rawColumns
  }, [i18n.language, visibleMixins])
  const onFilterCallback = (event: DataTableFilterParams) => {
    setPaginationParams({
      ...paginationParams,
      first: 0,
      currentPage: 1,
      filters: event.filters,
    })
  }

  const onSortCallback = (event: DataTableSortParams) => {
    setPaginationParams({
      ...paginationParams,
      sortOrder: event.sortOrder,
      sortField: event.sortField,
    })
  }

  const batchDelete = useCallback(async () => {
    try {
      blockPanel(true)
      setIsDeletingProducts(true)
      await Promise.all(
        selectedCustomers
          .map((customer) => customer?.id)
          .map((customerId) => {
            if (customerId) {
              return deleteCustomer(customerId)
            } else {
              return Promise.resolve()
            }
          })
      )
      setSelectedCustomers([])
      showSuccess(t('customers.toasts.successDelete'))
    } finally {
      blockPanel(false)
      setIsDeletingProducts(false)
      setSelectedCustomers([])
      invalidateCustomers()
    }
  }, [selectedCustomers])

  return (
    <div className="module">
      <HeaderSection
        title={t('customers.plural')}
        moduleActions={
          <Button
            disabled={!canBeManaged}
            label={t('customers.createCustomer')}
            onClick={() => navigate('/customers/add')}
          />
        }
      />
      <div className="w-full flex justify-content-between mb-2">
        <BatchDeleteButton
          disabled={!canBeManaged}
          selected={selectedCustomers}
          onDelete={batchDelete}
          isDeleting={isDeletingProducts}
          pluralsPath="customers"
        />
        <TableExtensions
          tableConfigurationKey={TABLE_NAME_CONFIG_KEY}
          tableColumns={columns
            .filter((column) => Object.hasOwn(column, 'hidden'))
            .map((column) => column.columnKey ?? '')}
          tableName={TABLE_NAME + '.table.columns'}
          schemaType={SchemaType.CUSTOMER}
          managerPermission={canBeManaged}
        />
      </div>
      <MdDataTable
        setSelectedItems={setSelectedCustomers}
        onRowClick={(item) => {
          navigate(`/customers/${item.id}`)
        }}
        selection={selectedCustomers}
        value={customers}
        paginationOptions={{
          ...paginationParams,
          totalRecords: totalCount,
        }}
        sortField={paginationParams.sortField}
        sortOrder={paginationParams.sortOrder}
        onFilter={onFilterCallback}
        onSort={onSortCallback}
        onPage={onPageCallback}
        lazy={true}
        isLoading={isLoading}
      >
        <Column selectionMode="multiple" headerStyle={{ width: '3em' }} />
        {columns.map((column: ColumnProps) => {
          return (
            <Column key={column.columnKey ?? column.field} {...column} />
          )
        })}
      </MdDataTable>
    </div>
  )
}

export default CustomersModule
