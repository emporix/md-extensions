import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Controller } from 'react-hook-form'
import {
  DataTable,
  FieldLabel,
  InputText,
  SectionBox,
  type DataTableColumnProps,
} from '@emporix/component-library'

import { useReturnForm } from '../../contexts/ReturnForm.provider'
import TableActions from '../shared/TableActions'
import FormGrid from '../shared/FormGrid'
import FormGridRow from '../shared/FormGridRow'
import ReturnAddProductsExpansion from './ReturnAddProductsExpansion'
import TotalMoneyValue from './TotalMoneyValue'
import type { Order } from '../../models/Order.model'
import { HOST_CUSTOMER_PATH } from '../../constants/paths'
import styles from './ReturnAddProducts.module.scss'

interface ReturnAddProductsProps {
  readonly review?: boolean
}

const ReturnAddProducts = ({ review = false }: ReturnAddProductsProps) => {
  const { t } = useTranslation()
  const {
    selectedCustomer,
    isLoading,
    selectedOrders,
    selectProduct,
    totalPrice,
    control,
    errors,
    selectedEntriesMap,
  } = useReturnForm()
  const [expandedRows, setExpandedRows] = useState<Order[]>()

  const ordersToDisplay = useMemo(() => {
    if (!review) {
      return selectedOrders
    }
    return selectedOrders.map((order) => ({
      ...order,
      entries: selectedEntriesMap.get(order.id) ?? [],
    }))
  }, [selectedOrders, selectedEntriesMap, review])

  useEffect(() => {
    // Collapse stale expansions when the order selection changes.
    setExpandedRows(undefined)
  }, [selectedOrders.length])

  const columns: DataTableColumnProps[] = useMemo(
    () => [
      { columnKey: 'expander', expander: true, style: { width: '3em' } },
      { columnKey: 'id', field: 'id' },
    ],
    []
  )

  if (!control) {
    return null
  }

  return (
    <>
      <SectionBox className={styles.section}>
        <FormGrid>
          <FormGridRow>
            <Controller
              control={control}
              name="reason.code"
              render={({ field }) => (
                <div className={styles.codeField}>
                  <InputText
                    label={t('returns.details.returnCode')}
                    error={errors.reason?.code?.message}
                    data-testid="code-input"
                    value={field.value || ''}
                    onChange={field.onChange}
                    readOnly={review}
                  />
                </div>
              )}
            />
            <Controller
              control={control}
              name="reason.details"
              render={({ field }) => (
                <div className={styles.detailsField}>
                  <InputText
                    label={t('returns.details.returnReason')}
                    error={errors.reason?.details?.message}
                    data-testid="details-input"
                    value={field.value || ''}
                    onChange={field.onChange}
                    readOnly={review}
                  />
                </div>
              )}
            />
          </FormGridRow>
          {review && (
            <div className={styles.customerField}>
              <FieldLabel>{t('returns.create.selectedCustomer')}</FieldLabel>
              {selectedCustomer ? (
                `${selectedCustomer.firstName} ${selectedCustomer.lastName}`
              ) : (
                <div className={styles.noCustomer}>
                  {t('returns.create.noCustomerSelected')}
                </div>
              )}
            </div>
          )}
        </FormGrid>
      </SectionBox>

      <DataTable
        dataKey="id"
        value={ordersToDisplay}
        columns={columns}
        loading={isLoading}
        expandedRows={expandedRows}
        onRowToggle={(rows) => setExpandedRows(rows as Order[])}
        rowExpansionTemplate={(order) => (
          <ReturnAddProductsExpansion
            order={order as Order}
            onSelect={selectProduct}
            readonly={review}
          />
        )}
        sortField="created"
        sortOrder={-1}
        paginator={false}
        showHeaders={false}
        pagination={{ totalRecords: ordersToDisplay.length }}
        rowActions={
          review
            ? undefined
            : (order: Order) => (
                <TableActions
                  onEdit={() =>
                    // Customer details live in the host, not in this remote.
                    window.location.assign(
                      HOST_CUSTOMER_PATH(order.customer.id)
                    )
                  }
                />
              )
        }
      />

      {selectedOrders.length > 0 && (
        <TotalMoneyValue
          value={totalPrice}
          currency={selectedOrders[0].currency}
          label={t('returns.details.total')}
        />
      )}
    </>
  )
}

export default ReturnAddProducts
