import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DataTable,
  Dropdown,
  FilterMatchMode,
  PrimaryButton,
  SecondaryButton,
  SectionTitle,
  useToast,
  type DataTableColumnProps,
} from '@emporix/component-library'
import { BsPlus } from 'react-icons/bs'
import {
  Product,
  ProductType,
  RelatedId,
  RelatedItem,
  RelatedType,
} from '../../models/Category.model'
import Localized from '../../models/Localized.model'
import { useConfigurationApi } from '../../hooks/api/configuration'
import { useProductsApi } from '../../hooks/api/products'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import { useUIBlocker } from '../../context/UIBlocker'
import { useProductData } from '../../context/ProductDataProvider'
import { usePermissions } from '../../context/PermissionsProvider'
import { EmployeeDomains, VendorDomains } from '../../configs/accessControls'
import { getApiErrorDetails, getApiErrorStatus } from '../../helpers/api'
import {
  trimCloudinaryImage,
  getFirstImageMediaUrl,
} from '../../helpers/images'
import logoDark from '../../assets/images/logo-dark.png'
import EmptyTable from '../shared/EmptyTable'
import AddProductsDialog from './AddProductsDialog'
import styles from './ProductLinked.module.scss'

interface ProductLinkedProps {
  readonly relatedItems: RelatedItem[]
  readonly editedId: string
}

interface TableLinkedItem {
  imageUrl: string
  name: Localized
  productId: string
  type: RelatedId
  exists: boolean
}

interface RelatedTypeDropdown {
  label: string
  value: RelatedType
}

const ProductLinked = (props: ProductLinkedProps) => {
  const { t, i18n } = useTranslation()
  const { getSingleConfiguration } = useConfigurationApi()
  const { getAllProducts, updateProduct } = useProductsApi()
  const { product, refreshData } = useProductData()
  const [addDialogOpened, setAddDialogOpened] = useState<boolean>(false)
  const { getContentLangValue } = useLocalizedValue()
  const { showSuccess, showError } = useToast()
  const { blockPanel } = useUIBlocker()
  const { hasPermission } = usePermissions()

  const productCache = useRef<Map<string, Product>>(new Map())
  const resolvedIds = useRef<Set<string>>(new Set())
  const [types, setTypes] = useState<RelatedTypeDropdown[]>([])
  const [items, setItems] = useState<TableLinkedItem[]>([])
  const [selected, setSelected] = useState<TableLinkedItem[]>([])
  const [relatedItems, setRelatedItems] = useState<RelatedItem[]>(
    props.relatedItems || []
  )
  const canManage =
    hasPermission(EmployeeDomains.PRODUCTS_MANAGER) ||
    hasPermission(VendorDomains.VENDOR_PRODUCTS_MANAGER)

  const convertRelatedIdToRelatedType = (id: RelatedId): RelatedType => {
    const fallback = { id: id } as RelatedType
    if (types === undefined || types.length === 0) {
      return fallback
    }
    return types.filter((type) => type.value.id === id)[0]?.value ?? fallback
  }

  const findType = (id: string | undefined): RelatedType =>
    convertRelatedIdToRelatedType(id as RelatedId)

  const displayRelationType = (type: RelatedType): string => {
    if (type === undefined || type === null) {
      return 'unknown'
    }
    if (type.id === 'CONSUMABLE') {
      return t('products.edit.tab.linked.types.consumable')
    }
    if (type.id === 'ACCESSORY') {
      return t('products.edit.tab.linked.types.accessory')
    }
    if (type.name !== undefined) {
      const name = type.name[i18n.language as string]
      if (name === undefined || name === '') {
        return type.id
      }
      return name
    }
    return type.id
  }

  const typeOptions = types.map((type) => ({
    label: type.label,
    value: type.value.id,
  }))

  const columns: DataTableColumnProps[] = [
    {
      columnKey: 'image',
      header: t('products.edit.tab.linked.columns.image'),
      field: 'image',
      showFilterMenu: false,
      body: (rowData: TableLinkedItem) => {
        const imageUrl = rowData.imageUrl
        if (!imageUrl) {
          return <div className={styles.thumbPlaceholder} />
        }
        return (
          <img
            className={styles.thumb}
            src={trimCloudinaryImage(imageUrl, 32, 32)}
            alt={imageUrl}
          />
        )
      },
      style: { width: '8rem' },
    },
    {
      columnKey: 'name',
      field: 'name',
      header: t('products.edit.tab.linked.columns.name'),
      body: (rowData: TableLinkedItem) => (
        <span>
          {rowData.exists ? (
            getContentLangValue(rowData.name)
          ) : (
            <span className={styles.missingName}>
              {t('products.edit.tab.linked.productDoesNotExist')}
            </span>
          )}
        </span>
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
      header: t('products.edit.tab.linked.columns.id'),
      body: (rowData: TableLinkedItem) => (
        <span className={rowData.exists ? undefined : styles.missingId}>
          {rowData.productId}
        </span>
      ),
      filter: true,
      showFilterMenu: false,
      showClearButton: false,
    },
    {
      columnKey: 'type',
      header: t('products.edit.tab.linked.columns.type'),
      body: (rowData: TableLinkedItem) => (
        <div onClick={(ev) => ev.stopPropagation()}>
          {/* Options carry the relation id; the type object is resolved on change. */}
          <Dropdown
            disabled={!canManage}
            options={typeOptions}
            value={convertRelatedIdToRelatedType(rowData.type).id}
            itemTemplate={(option) => (
              <div>{displayRelationType(findType(option.value))}</div>
            )}
            valueTemplate={(option) => (
              <div>
                {displayRelationType(
                  option
                    ? findType(option.value)
                    : convertRelatedIdToRelatedType(rowData.type)
                )}
              </div>
            )}
            onChange={(ev) =>
              onTypeChange(rowData.productId, findType(ev.value as string))
            }
          />
        </div>
      ),
      style: { width: '22%' },
    },
  ]

  const formDirty = useMemo(
    () =>
      JSON.stringify(relatedItems) !== JSON.stringify(props.relatedItems || []),
    [relatedItems, props.relatedItems]
  )

  const syncTypes = async () => {
    const data = await getSingleConfiguration('relation_types')
    const parsedData: RelatedType[] = JSON.parse(data.value as string)
    const options: RelatedTypeDropdown[] = parsedData
      .map((relatedType) => ({
        label: displayRelationType(relatedType),
        value: relatedType,
      }))
      .sort((a, b) => (a.label > b.label ? 1 : -1))
    setTypes(options)
  }

  const addNewHandler = useCallback(
    (productsIds: string[]) => {
      const newItems = productsIds.map((i) => ({
        refId: i,
        type: types[0].value.id,
      }))
      setRelatedItems([...relatedItems, ...newItems])
      setAddDialogOpened(false)
    },
    [types, relatedItems]
  )

  const onTypeChange = useCallback(
    (id: string, value: RelatedType) => {
      setRelatedItems(
        relatedItems.map((i) => (i.refId === id ? { ...i, type: value.id } : i))
      )
    },
    [relatedItems]
  )

  const onRemoveItems = useCallback(() => {
    const selectedIds = selected.map((i) => i.productId)
    setRelatedItems(relatedItems.filter((i) => !selectedIds.includes(i.refId)))
    setSelected([])
  }, [selected, relatedItems])

  const loadItems = useCallback(async () => {
    const missingIds = relatedItems
      .map((i) => i.refId)
      .filter((id) => !resolvedIds.current.has(id))

    if (missingIds.length > 0) {
      try {
        const fetched = await getAllProducts({
          filters: { id: { value: missingIds, matchMode: FilterMatchMode.IN } },
        })
        fetched.forEach((p) => {
          if (p.id) productCache.current.set(p.id, p)
        })
        missingIds.forEach((id) => resolvedIds.current.add(id))
      } catch (e) {
        console.error('Failed to load linked products', e)
      }
    }

    const tableItems = relatedItems.map((relatedItem) => {
      const cached = productCache.current.get(relatedItem.refId)
      if (cached) {
        return {
          name: cached.name,
          productId: relatedItem.refId,
          imageUrl: getFirstImageMediaUrl(cached.media) ?? logoDark,
          type: relatedItem.type,
          exists: true,
        }
      }
      return {
        name: { en: '', de: '' } as Localized,
        productId: relatedItem.refId,
        imageUrl: logoDark,
        type: relatedItem.type,
        exists: false,
      }
    })
    setItems(tableItems)
  }, [relatedItems, getAllProducts])

  const reset = useCallback(() => {
    setRelatedItems(props.relatedItems || [])
  }, [props.relatedItems])

  const submit = useCallback(async () => {
    blockPanel(true)
    try {
      const updatedProduct = {
        ...product,
        relatedItems: [...relatedItems],
      }
      if (
        updatedProduct.productType === ProductType.variant &&
        updatedProduct.metadata
      ) {
        const overridden = new Set(updatedProduct.metadata.overridden || [])
        overridden.add('relatedItems')
        updatedProduct.metadata.overridden = [...overridden]
      }
      await updateProduct(updatedProduct)
      refreshData()
      showSuccess(t('products.edit.toast.update.success'))
    } catch (e: unknown) {
      console.error(e)
      if (getApiErrorStatus(e) === 400) {
        showError(t('products.toast.errorUpdateValidation'))
        return
      }
      showError(
        t('products.edit.toast.update.error'),
        getApiErrorDetails(e) ?? String(e)
      )
    } finally {
      blockPanel(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language, relatedItems, product])

  useEffect(() => {
    void syncTypes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    void loadItems()
  }, [loadItems])

  useEffect(() => {
    setRelatedItems(props.relatedItems || [])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(props.relatedItems)])

  useEffect(() => {
    setTypes((prev) =>
      [...prev].sort((a, b) =>
        displayRelationType(a.value) > displayRelationType(b.value) ? 1 : -1
      )
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language])

  return (
    <>
      <SectionTitle
        className={styles.sectionTitle}
        name={t('products.edit.tab.linked.title')}
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
      {relatedItems.length > 0 ? (
        <>
          <div className={styles.toolbar}>
            <SecondaryButton
              size="small"
              onClick={onRemoveItems}
              disabled={selected.length === 0 || !canManage}
            >
              {`${t('products.edit.tab.linked.remove')}${
                selected.length ? ` (${selected.length})` : ''
              }`}
            </SecondaryButton>
            <PrimaryButton
              className={styles.iconButton}
              onClick={() => setAddDialogOpened(true)}
              disabled={!canManage}
            >
              <BsPlus size={18} />
              {t('products.edit.tab.linked.add')}
            </PrimaryButton>
          </div>
          <DataTable
            value={items}
            dataKey="productId"
            columns={columns}
            showFilter
            selection={selected}
            onSelectionChange={(selection) =>
              setSelected(selection as TableLinkedItem[])
            }
            selectionMode={canManage ? 'multiple' : null}
          />
        </>
      ) : (
        <EmptyTable
          managerPermissions={canManage}
          className={styles.emptyTable}
          text={t('products.edit.tab.linked.table.emptyText')}
          buttonLabel={t('products.edit.tab.linked.table.emptyLink')}
          action={() => setAddDialogOpened(true)}
        />
      )}
      <AddProductsDialog
        visible={addDialogOpened}
        selectedIds={relatedItems.map((i) => i.refId)}
        onClose={() => setAddDialogOpened(false)}
        onSubmit={addNewHandler}
      />
    </>
  )
}

export default ProductLinked
