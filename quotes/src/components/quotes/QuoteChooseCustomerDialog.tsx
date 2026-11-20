import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DataTable,
  Dialog,
  PrimaryButton,
  SecondaryButton,
  useToast,
} from '@emporix/component-library'
import usePagination from '../../hooks/usePagination'
import { makeCall } from '../../helpers/api'
import { useCustomerApi } from '../../hooks/api/customers'
import { Customer } from '../../models/Customer.model'
import useQuoteCustomersColumns from '../../hooks/useQuoteCustomersColumns'
import { useQuoteData } from '../../context/Quote.provider'
import { Customer as QuoteDataCustomer } from '../../models/Quotes.model'
import styles from './QuoteChooseCustomerDialog.module.scss'

interface Props {
  onHide: () => void
  onCustomerSelect?: (customer: Customer) => void
}

/**
 * MD `QuoteChooseCustomerDialog`: a lazy single-select customers table. Like
 * MD's radio column, a click on the selected row clears the selection.
 */
const QuoteChooseCustomerDialog = (props: Props) => {
  const { onHide, onCustomerSelect } = props
  const { t } = useTranslation()
  const { syncCustomers } = useCustomerApi()
  const { showError } = useToast()
  const {
    paginationParams,
    onFilterCallback,
    onPageCallback,
    onSortCallback,
    totalCount,
    setTotalCount,
  } = usePagination()
  const { columns } = useQuoteCustomersColumns()

  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  )
  const { setCustomer } = useQuoteData()

  useEffect(() => {
    loadCustomers()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [paginationParams])

  const loadCustomers = async () => {
    try {
      const data = await makeCall(
        () => syncCustomers(paginationParams),
        setIsLoadingCustomers
      )
      setCustomers(data.values)
      setTotalCount(data.totalRecords)
    } catch (e: unknown) {
      console.error(e)
      showError(t('quotes.toasts.errorFetchCustomers'))
    }
  }

  // The component library applies no row-click selection next to
  // `onRowClick`, so the click toggles here (returns' customer table).
  const toggleCustomerSelection = useCallback(
    (customer: Customer) => {
      setSelectedCustomer(
        selectedCustomer?.id === customer.id ? null : customer
      )
    },
    [selectedCustomer]
  )

  // The row instance from `value` keeps the radio of the selected row on.
  const selectionRow =
    selectedCustomer == null
      ? null
      : (customers.find((customer) => customer.id === selectedCustomer.id) ??
        selectedCustomer)

  return (
    <Dialog
      header={t('segments.dialogs.addMembers.title')}
      // MD `w-8`; inline because MD's global `.p-dialog` width beats a class.
      style={{ width: '66.6667%' }}
      visible={true}
      onHide={onHide}
      // Prime's default in MD: a click on the mask does not close it.
      dismissableMask={false}
      // Only the rows of the table scroll; the dialog keeps its height.
      fixedHeight
      data-testid="quote-choose-customer-dialog"
    >
      <DataTable
        fillHeight
        dataKey="id"
        value={customers}
        columns={columns}
        lazy={true}
        selection={selectionRow}
        pagination={{
          ...paginationParams,
          totalRecords: totalCount,
        }}
        loading={isLoadingCustomers}
        selectionMode="single"
        onSelectionChange={(next) => {
          // Single mode yields one row; tolerate an array if Prime passes one.
          if (Array.isArray(next)) {
            setSelectedCustomer((next[0] as Customer | undefined) ?? null)
            return
          }
          setSelectedCustomer((next as Customer | null) ?? null)
        }}
        onRowClick={(row) => toggleCustomerSelection(row as Customer)}
        currentPageReportTemplate={t('global.pagination')}
        emptyMessage={t('segments.tables.members.emptyText')}
        sortField={paginationParams.sortField}
        sortOrder={paginationParams.sortOrder}
        onPage={onPageCallback}
        onFilter={onFilterCallback}
        onSort={onSortCallback}
        data-testid="quote-customers-table"
      />
      <div className={styles.buttons}>
        <SecondaryButton onClick={onHide}>{t('global.cancel')}</SecondaryButton>
        <PrimaryButton
          disabled={selectedCustomer === null}
          onClick={() => {
            if (selectedCustomer) {
              setCustomer({
                customerId: selectedCustomer.id,
                firstName: selectedCustomer.firstName,
                lastName: selectedCustomer.lastName,
                contactEmail: selectedCustomer.contactEmail,
              } as unknown as QuoteDataCustomer)
              onCustomerSelect?.(selectedCustomer)
            }
            onHide()
          }}
        >
          {t('quotes.dialog.addCustomer')}
        </PrimaryButton>
      </div>
    </Dialog>
  )
}

export default QuoteChooseCustomerDialog
