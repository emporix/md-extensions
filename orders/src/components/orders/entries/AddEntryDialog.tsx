import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Chip,
  DataTable,
  Dialog,
  PrimaryButton,
  QuantityStepper,
  useToast,
  type DataTableColumnProps,
  type DataTablePaginationState,
} from '@emporix/component-library'
import { useProductsApi } from '../../../hooks/api/products'
import { useOrdersApi } from '../../../hooks/api/orders'
import usePagination from '../../../hooks/usePagination'
import { useLocalizedValue } from '../../../hooks/useLocalizedValue'
import { useOrderData } from '../../../contexts/OrderData.provider'
import { getApiErrorDetails, getApiErrorMessage } from '../../../helpers/api'
import { trimCloudinaryImage } from '../../../helpers/images'
import { addNewEntriesFromProducts } from '../../../helpers/orders'
import type { Product } from '../../../models/Product.model'
import styles from './AddEntryDialog.module.scss'

type AddEntryDialogProps = {
  readonly onClose: () => void
  readonly visible: boolean
}

const AddEntryDialog = ({ onClose, visible }: AddEntryDialogProps) => {
  const { t, i18n } = useTranslation()
  const { showError } = useToast()
  const { syncPaginatedProducts } = useProductsApi()
  const { addEntries } = useOrdersApi()
  const { getContentLangValue } = useLocalizedValue()
  const { order, newEntries, updateOrder } = useOrderData()
  // Not synced to the URL: the dialog must not move the entries page's params.
  const {
    paginationParams,
    onPageCallback,
    resetPagination,
    onFilterCallback,
    onSortCallback,
  } = usePagination(undefined, false)

  const [isLoading, setIsLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [productsToAdd, setProductsToAdd] = useState<Product[]>([])
  const [totalCount, setTotalCount] = useState<number>()

  useEffect(() => {
    if (visible) resetPagination()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  useEffect(() => {
    if (!visible) return
    void (async () => {
      try {
        setIsLoading(true)
        const { totalCount: count, data } =
          await syncPaginatedProducts(paginationParams)
        setProducts(data)
        setTotalCount(count)
      } catch (e: unknown) {
        showError(t('orders.toasts.errorFetchProducts'), getApiErrorDetails(e))
      } finally {
        setIsLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginationParams, visible])

  const handleClose = () => {
    setProductsToAdd([])
    onClose()
  }

  const onSubmit = async () => {
    if (!order) return
    try {
      setIsLoading(true)
      const updatedOrder = await addNewEntriesFromProducts(
        order.id,
        newEntries,
        productsToAdd,
        addEntries
      )
      updateOrder(updatedOrder)
      handleClose()
    } catch (e: unknown) {
      showError(
        t('orders.toasts.errorEntriesUpdate'),
        getApiErrorDetails(e) ?? getApiErrorMessage(e) ?? String(e)
      )
    } finally {
      setIsLoading(false)
    }
  }

  const setQuantity = (rowData: Product, value: number) => {
    setProductsToAdd((prev) => {
      if (value === 0) return prev.filter((p) => p.id !== rowData.id)
      const exists = prev.some((p) => p.id === rowData.id)
      return exists
        ? prev.map((p) => (p.id === rowData.id ? { ...p, quantity: value } : p))
        : [...prev, { ...rowData, quantity: value }]
    })
  }

  const columns: DataTableColumnProps[] = useMemo(
    () => [
      {
        columnKey: 'media',
        field: 'media[0].url',
        style: { width: '3em' },
        body: (product: Product) => {
          const imageUrl = product.media?.[0]?.url
          return imageUrl ? (
            <img
              className={styles.thumb}
              src={trimCloudinaryImage(imageUrl, 32, 32)}
              alt={imageUrl}
            />
          ) : (
            <div className={styles.thumbPlaceholder} />
          )
        },
      },
      {
        columnKey: 'name',
        field: 'name',
        header: t('orders.entry.actions.addProduct.table.name'),
        body: (rowData: Product) => getContentLangValue(rowData.name),
        filter: true,
        sortable: true,
        showFilterMenu: false,
        showClearButton: false,
      },
      {
        columnKey: 'id',
        field: 'id',
        header: t('orders.entry.actions.addProduct.table.id'),
        filter: true,
        sortable: true,
        showFilterMenu: false,
        showClearButton: false,
      },
      {
        columnKey: 'code',
        field: 'code',
        header: t('orders.entry.actions.addProduct.table.code'),
        filter: true,
        sortable: true,
        showFilterMenu: false,
        showClearButton: false,
      },
      {
        columnKey: 'productType',
        field: 'productType',
        header: t('orders.entry.actions.addProduct.table.productType'),
        filter: true,
        sortable: true,
        showFilterMenu: false,
        showClearButton: false,
      },
      {
        columnKey: 'action',
        field: 'action',
        header: t('orders.entry.actions.addProduct.table.action'),
        body: (rowData: Product) => (
          <QuantityStepper
            min={0}
            value={
              productsToAdd.find((p) => p.id === rowData.id)?.quantity ?? 0
            }
            onChange={(e) => setQuantity(rowData, e.value ?? 0)}
          />
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [i18n.language, t, productsToAdd]
  )

  const pagination: DataTablePaginationState = {
    ...paginationParams,
    totalRecords: totalCount,
  }

  return (
    <Dialog
      visible={visible}
      style={{ width: '90vw', maxHeight: '90vh' }}
      onHide={handleClose}
      header={t('orders.entry.actions.addProduct.dialog.title')}
      footer={
        <div className={styles.footer}>
          <PrimaryButton
            disabled={productsToAdd.length === 0}
            loading={isLoading}
            onClick={onSubmit}
          >
            {t('orders.entry.actions.addProduct.dialog.title')}
          </PrimaryButton>
        </div>
      }
    >
      {productsToAdd.length > 0 ? (
        <div className={styles.chips}>
          {productsToAdd.map((p) => {
            const label = `${p.quantity}x ${getContentLangValue(p.name)}`
            return (
              <Chip
                key={p.id}
                className={styles.chip}
                label={label}
                title={label}
                removable
                removeAriaLabel={t('global.remove')}
                onRemove={() =>
                  setProductsToAdd((prev) =>
                    prev.filter((item) => item.id !== p.id)
                  )
                }
              />
            )
          })}
        </div>
      ) : (
        <div className={styles.chipsPlaceholder} />
      )}
      <DataTable
        className={styles.table}
        dataKey="id"
        value={products}
        columns={columns}
        loading={isLoading}
        lazy={true}
        pagination={pagination}
        sortField={paginationParams.sortField}
        sortOrder={paginationParams.sortOrder}
        onPage={onPageCallback}
        onFilter={onFilterCallback}
        onSort={onSortCallback}
      />
    </Dialog>
  )
}

export default AddEntryDialog
