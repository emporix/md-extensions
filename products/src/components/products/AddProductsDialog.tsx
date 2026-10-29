import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Chip,
  DataTable,
  Dialog,
  PrimaryButton,
  type DataTableColumnProps,
  type DataTablePaginationState,
} from '@emporix/component-library'
import { Product } from '../../models/Category.model'
import { useProductsApi } from '../../hooks/api/products'
import usePagination from '../../hooks/usePagination'
import { getFirstImageMediaUrl } from '../../helpers/images'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import styles from './AddProductsDialog.module.scss'
import { ProductThumbnail } from '../shared/ProductThumbnail'

export interface AddProductsDialogProps {
  readonly visible: boolean
  readonly selectedIds: string[]
  readonly onClose: () => void
  readonly onSubmit: (ids: string[]) => void
}

export function AddProductsDialog(props: AddProductsDialogProps) {
  const { visible, selectedIds, onClose, onSubmit } = props
  const { i18n, t } = useTranslation()
  const { syncPaginatedProducts } = useProductsApi()
  const { getContentLangValue } = useLocalizedValue()
  // Not synced to the URL: the dialog must not move the product page's params.
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
    if (visible) {
      resetPagination()
      setProductsToAdd([])
    }
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
        setProductsToAdd((prev) => {
          const prevIds = new Set(prev.map((p) => p.id))
          const preSelected = data.filter(
            (p) => p.id && selectedIds.includes(p.id) && !prevIds.has(p.id)
          )
          return preSelected.length > 0 ? [...prev, ...preSelected] : prev
        })
      } finally {
        setIsLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginationParams, visible])

  const handleClose = useCallback(() => {
    setProductsToAdd([])
    onClose()
  }, [onClose])

  const handleSubmit = useCallback(() => {
    const newIds = productsToAdd
      .map((p) => p.id as string)
      .filter((id) => !selectedIds.includes(id))
    onSubmit(newIds)
    setProductsToAdd([])
  }, [productsToAdd, onSubmit, selectedIds])

  const removeProductToAdd = useCallback((product: Product) => {
    setProductsToAdd((prev) => prev.filter((p) => p.id !== product.id))
  }, [])

  const isDataSelectable = useCallback(
    (event: { data: Product }) => {
      if (!event.data.id) return false
      return !selectedIds.includes(event.data.id)
    },
    [selectedIds]
  )

  const handleSelectionChange = useCallback(
    (items: Product[]) => {
      const kept = productsToAdd.filter(
        (p) => p.id && selectedIds.includes(p.id)
      )
      const newOnes = items.filter((p) => p.id && !selectedIds.includes(p.id))
      setProductsToAdd([...kept, ...newOnes])
    },
    [selectedIds, productsToAdd]
  )

  const newlySelected = useMemo(
    () => productsToAdd.filter((p) => p.id && !selectedIds.includes(p.id)),
    [productsToAdd, selectedIds]
  )

  const columns: DataTableColumnProps[] = useMemo(() => {
    return [
      {
        columnKey: 'media',
        field: 'media[0].url',
        style: { width: '3em' },
        filter: false,
        sortable: false,
        body: (rowData: Product) => {
          const imageUrl = getFirstImageMediaUrl(rowData.media)
          return <ProductThumbnail url={imageUrl} />
        },
      },
      {
        columnKey: 'name',
        field: 'name',
        header: t('products.table.name'),
        body: (rowData: Product) => getContentLangValue(rowData.name),
        filter: true,
        sortable: true,
        showFilterMenu: false,
        showClearButton: false,
      },
      {
        columnKey: 'id',
        field: 'id',
        header: t('products.table.id'),
        filter: true,
        sortable: true,
        showFilterMenu: false,
        showClearButton: false,
      },
      {
        columnKey: 'code',
        field: 'code',
        header: t('products.table.code'),
        filter: true,
        sortable: true,
        showFilterMenu: false,
        showClearButton: false,
      },
    ]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language, t])

  const pagination: DataTablePaginationState = {
    ...paginationParams,
    totalRecords: totalCount,
  }

  return (
    <Dialog
      visible={visible}
      style={{ width: '90vw', maxHeight: '90vh' }}
      className={styles.dialog}
      onHide={handleClose}
      header={t('products.dialogs.addProducts.title')}
      footer={
        <div className={styles.footer}>
          <PrimaryButton
            disabled={newlySelected.length === 0}
            onClick={handleSubmit}
            loading={isLoading}
          >
            {t('products.dialogs.addProducts.submit')}
          </PrimaryButton>
        </div>
      }
    >
      {newlySelected.length > 0 ? (
        <div className={styles.chips}>
          {newlySelected.map((p) => {
            const label = getContentLangValue(p.name)
            return (
              <Chip
                key={p.id}
                className={styles.chip}
                label={label}
                title={label}
                removable
                removeAriaLabel={t('global.remove')}
                onRemove={() => removeProductToAdd(p)}
              />
            )
          })}
        </div>
      ) : (
        <div className={styles.chipsPlaceholder} />
      )}
      <DataTable
        className={styles.table}
        value={products}
        dataKey="id"
        columns={columns}
        loading={isLoading}
        selectionMode="multiple"
        selection={productsToAdd}
        onSelectionChange={(selection) =>
          handleSelectionChange(selection as Product[])
        }
        isRowSelectable={isDataSelectable}
        rowClassName={(row: Product) =>
          row.id && selectedIds.includes(row.id)
            ? styles.rowAlreadySelected
            : ''
        }
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

export default AddProductsDialog
