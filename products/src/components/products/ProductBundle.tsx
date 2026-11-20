import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DataTable,
  FilterMatchMode,
  InputNumber,
  PrimaryButton,
  SecondaryButton,
  SectionTitle,
  useToast,
  type DataTableColumnFilterElementOptions,
  type DataTableColumnProps,
} from '@emporix/component-library'
import { BsPlus } from 'react-icons/bs'
import { BundledProduct, Product } from '../../models/Category.model'
import Localized from '../../models/Localized.model'
import { useProductsApi } from '../../hooks/api/products'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import { useUIBlocker } from '../../context/UIBlocker'
import { useProductData } from '../../context/ProductDataProvider'
import { usePermissions } from '../../context/PermissionsProvider'
import { EmployeeDomains, VendorDomains } from '../../configs/accessControls'
import { getApiErrorDetails } from '../../helpers/api'
import { getFirstImageMediaUrl } from '../../helpers/images'
import EmptyTable from '../shared/EmptyTable'
import NumberFilterTemplate from '../shared/NumberFilterTemplate'
import AddProductsDialog from './AddProductsDialog'
import styles from './ProductBundle.module.scss'
import { ProductThumbnail } from '../shared/ProductThumbnail'

interface ProductBundleProps {
  readonly bundledItems: BundledProduct[]
  readonly editedId: string
}

interface TableBundledItem {
  imageUrl: string
  name: Localized
  amount: number
  productId: string
}

const ProductBundle = (props: ProductBundleProps) => {
  const { i18n, t } = useTranslation()
  const { getAllProducts, patchProduct } = useProductsApi()
  const { refreshData } = useProductData()
  const { blockPanel } = useUIBlocker()
  const { getContentLangValue } = useLocalizedValue()
  const { showSuccess, showError } = useToast()
  const { hasPermission } = usePermissions()

  // Ids already requested, so an id the API does not return is not refetched.
  const requestedIds = useRef<Set<string>>(new Set())
  const [productsById, setProductsById] = useState<
    ReadonlyMap<string, Product>
  >(new Map())
  const [pendingRequests, setPendingRequests] = useState(0)
  const [addDialogOpened, setAddDialogOpened] = useState<boolean>(false)
  const [selected, setSelected] = useState<TableBundledItem[]>([])
  const [bundledProducts, setBundledProducts] = useState<BundledProduct[]>(
    props.bundledItems || []
  )
  const canManage =
    hasPermission(EmployeeDomains.PRODUCTS_MANAGER) ||
    hasPermission(VendorDomains.VENDOR_PRODUCTS_MANAGER)

  const columns: DataTableColumnProps[] = [
    {
      columnKey: 'image',
      header: t('products.edit.tab.bundle.columns.image'),
      field: 'image',
      showFilterMenu: false,
      body: (rowData: TableBundledItem) => {
        const imageUrl = rowData.imageUrl
        return <ProductThumbnail url={imageUrl} />
      },
      style: { width: '8rem' },
    },
    {
      columnKey: 'name',
      field: 'name',
      header: t('products.edit.tab.bundle.columns.name'),
      body: (rowData: TableBundledItem) => (
        <span>{getContentLangValue(rowData.name)}</span>
      ),
      sortable: true,
      filter: true,
      filterMatchMode: FilterMatchMode.CUSTOM,
      filterFunction: (value: Localized, filter: string) => {
        if (!filter) return true
        const localized = getContentLangValue(value)
        return localized?.toLowerCase().includes(filter.toLowerCase()) ?? false
      },
      showFilterMenu: false,
      showClearButton: false,
    },
    {
      columnKey: 'productId',
      field: 'productId',
      header: t('products.edit.tab.bundle.columns.id'),
      filter: true,
      showFilterMenu: false,
      showClearButton: false,
    },
    {
      columnKey: 'amount',
      field: 'amount',
      header: t('products.edit.tab.bundle.columns.amount'),
      body: (rowData: TableBundledItem) => (
        <InputNumber
          readOnly={!canManage}
          locale={i18n.language}
          onChange={(ev) => onAmountChange(rowData.productId, ev.value || 1)}
          value={rowData.amount}
        />
      ),
      filterMatchMode: FilterMatchMode.EQUALS,
      filterElement: (options: DataTableColumnFilterElementOptions) => (
        <NumberFilterTemplate filterOptions={options} />
      ),
      showFilterMenu: false,
      showClearButton: false,
    },
  ]

  const formDirty = useMemo(
    () =>
      JSON.stringify(bundledProducts) !==
      JSON.stringify(props.bundledItems || []),
    [bundledProducts, props.bundledItems]
  )

  const addNewHandler = useCallback(
    (productsIds: string[]) => {
      const newBundledItems: BundledProduct[] = productsIds.map((i) => ({
        productId: i,
        amount: 1,
      }))
      setBundledProducts([...bundledProducts, ...newBundledItems])
      setAddDialogOpened(false)
    },
    [bundledProducts]
  )

  const onAmountChange = useCallback(
    (id: string, value: number) => {
      setBundledProducts(
        bundledProducts.map((bp) =>
          bp.productId === id ? { ...bp, amount: value } : bp
        )
      )
    },
    [bundledProducts]
  )

  const onRemoveItems = useCallback(() => {
    const selectedIds = selected.map((bundledItem) => bundledItem.productId)
    setBundledProducts(
      bundledProducts.filter((i) => !selectedIds.includes(i.productId))
    )
    setSelected([])
  }, [selected, bundledProducts])

  const loadMissingProducts = useCallback(async () => {
    const missingIds = [
      ...new Set(bundledProducts.map((b) => b.productId)),
    ].filter((id) => !requestedIds.current.has(id))
    if (missingIds.length === 0) return

    missingIds.forEach((id) => requestedIds.current.add(id))
    setPendingRequests((count) => count + 1)
    try {
      const fetched = await getAllProducts({
        filters: { id: { value: missingIds, matchMode: FilterMatchMode.IN } },
      })
      setProductsById((current) => {
        const next = new Map(current)
        fetched.forEach((p) => {
          if (p.id) next.set(p.id, p)
        })
        return next
      })
    } catch (e) {
      // Let the next run retry these ids.
      missingIds.forEach((id) => requestedIds.current.delete(id))
      console.error('Failed to load bundled products', e)
    } finally {
      setPendingRequests((count) => count - 1)
    }
  }, [bundledProducts, getAllProducts])

  // Rows come straight from `bundledProducts`, so the table never shows
  // "No data found" for a filled bundle while names and images still load.
  const items = useMemo<TableBundledItem[]>(
    () =>
      bundledProducts.map((bundledItem) => {
        const product = productsById.get(bundledItem.productId)
        return {
          name: product?.name ?? ({ en: '', de: '' } as Localized),
          productId: bundledItem.productId,
          imageUrl: getFirstImageMediaUrl(product?.media) ?? '',
          amount: bundledItem.amount,
        }
      }),
    [bundledProducts, productsById]
  )

  const reset = useCallback(() => {
    setBundledProducts(props.bundledItems || [])
  }, [props.bundledItems])

  const submit = useCallback(async () => {
    blockPanel(true)
    try {
      await patchProduct({
        id: props.editedId,
        bundledProducts: [...bundledProducts],
      })
      refreshData()
      showSuccess(t('products.edit.toast.update.success'))
    } catch (e: unknown) {
      console.error(e)
      showError(
        t('products.edit.toast.update.error'),
        getApiErrorDetails(e) ?? String(e)
      )
    } finally {
      blockPanel(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language, bundledProducts, props.editedId])

  useEffect(() => {
    void loadMissingProducts()
  }, [loadMissingProducts])

  useEffect(() => {
    setBundledProducts(props.bundledItems || [])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(props.bundledItems)])

  return (
    <>
      <SectionTitle
        className={styles.sectionTitle}
        name={t('products.edit.tab.bundle.title')}
        actions={
          <div className={styles.titleActions}>
            <SecondaryButton
              disabled={!formDirty || !canManage}
              onClick={reset}
            >
              {t('global.discard')}
            </SecondaryButton>
            <PrimaryButton
              disabled={!formDirty || !canManage}
              onClick={() => void submit()}
            >
              {t('global.save')}
            </PrimaryButton>
          </div>
        }
      />
      {bundledProducts.length > 0 ? (
        <>
          <div className={styles.toolbar}>
            <SecondaryButton
              size="small"
              onClick={onRemoveItems}
              disabled={selected.length === 0 || !canManage}
            >
              {`${t('products.edit.tab.bundle.remove')}${
                selected.length ? ` (${selected.length})` : ''
              }`}
            </SecondaryButton>
            <PrimaryButton
              className={styles.iconButton}
              onClick={() => setAddDialogOpened(true)}
              disabled={!canManage}
            >
              <BsPlus size={18} />
              {t('products.edit.tab.bundle.add')}
            </PrimaryButton>
          </div>
          <DataTable
            value={items}
            dataKey="productId"
            columns={columns}
            loading={pendingRequests > 0}
            showFilter
            selection={selected}
            onSelectionChange={(selection) =>
              setSelected(selection as TableBundledItem[])
            }
            selectionMode={canManage ? 'multiple' : null}
          />
        </>
      ) : (
        <EmptyTable
          managerPermissions={canManage}
          className={styles.emptyTable}
          text={t('products.edit.tab.bundle.table.emptyText')}
          buttonLabel={t('products.edit.tab.bundle.table.emptyLink')}
          action={() => setAddDialogOpened(true)}
        />
      )}
      <AddProductsDialog
        visible={addDialogOpened}
        selectedIds={bundledProducts.map((bp) => bp.productId)}
        onClose={() => setAddDialogOpened(false)}
        onSubmit={addNewHandler}
      />
    </>
  )
}

export default ProductBundle
