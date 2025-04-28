import { useCallback, useEffect, useState } from 'react'
import { RelatedId, RelatedItem, RelatedType } from '../../models/Category'
import { useConfigurationApi } from '../../api/configuration'
import { useProductsApi } from '../../api/products'
import ProductSearchAdd from './ProductSearchAdd'
import { Dialog } from 'primereact/dialog'
import { useTranslation } from 'react-i18next'
import { DataTable } from 'primereact/datatable'
import { Column, ColumnProps } from 'primereact/column'
import { deepClone } from '../../helpers/utils'
import EmptyTable from '../shared/EmptyTable'
import { Dropdown } from 'primereact/dropdown'
import { Button } from 'primereact/button'
import Localized from '../../models/Localized'
import useForm from '../../hooks/useForm.tsx'
import { useUIBlocker } from '../../context/UIBlcoker'
import { useProductData } from '../../context/ProductDataProvider'
import { useLocalizedValue } from '../../hooks/useLocalizedValue.tsx'
import logoDark from '../../../assets/images/logoDark.png'
import { useDashboardContext } from '../../context/Dashboard.context.tsx'

interface ProductLinkedProps {
  relatedItems: RelatedItem[]
  editedId: string
  className: string
}

interface TableLinkedItem {
  imageUrl: string
  name: Localized
  productId: string
  type: RelatedType
}

interface RelatedTypeDropdown {
  label: string
  value: RelatedType
}

const ProductLinked = (props: ProductLinkedProps) => {
  const { t, i18n } = useTranslation()
  const { getSingleConfiguration } = useConfigurationApi()
  const { getProduct, updateProduct } = useProductsApi()
  const { product, refreshData } = useProductData()
  const [addDialogOpened, setAddDialogOpened] = useState<boolean>(false)
  const [isValid, setIsValid] = useState<boolean>(true)
  const [types, setTypes] = useState<RelatedTypeDropdown[]>([])
  const [items, setItems] = useState<TableLinkedItem[]>([])
  const [selected, setSelected] = useState<TableLinkedItem[]>([])
  const { getContentLangValue } = useLocalizedValue()
  const { setFormField, setFormData, setInitFormData, formData, formDirty } =
    useForm<{ relatedItems: RelatedItem[] }>()

  const { blockPanel } = useUIBlocker()
  const { permissions } = useDashboardContext()
  const canBeManaged = permissions?.products?.manager

  const convertRelatedIdToRelatedType = (id: RelatedId): RelatedType => {
    const fallback = { id: id } as RelatedType
    if (types === undefined || types.length === 0) {
      return fallback
    }
    return types.filter((type) => type.value.id === id)[0]?.value ?? fallback
  }

  const validateRelatedItems = (relatedItems: RelatedItem[]) => {
    const state =
      relatedItems.filter((relatedItem) => relatedItem?.type === undefined)
        .length === 0
    setIsValid(state)
  }

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

  const columns: ColumnProps[] = [
    {
      columnKey: 'selection',
      selectionMode: canBeManaged ? 'multiple' : undefined,
      style: { width: '4%', minWidth: '3em' },
    },
    {
      columnKey: 'image',
      header: t('products.edit.tab.linked.columns.image'),
      field: 'image',
      showFilterMenu: false,
      body: (rowData: TableLinkedItem) => (
        <img
          alt="Product image"
          src={rowData.imageUrl}
          style={{
            verticalAlign: 'middle',
            maxWidth: '6rem',
            maxHeight: '4rem',
          }}
        />
      ),
      style: { width: '8rem' },
    },
    {
      columnKey: 'name',
      header: t('products.edit.tab.linked.columns.name'),
      body: (rowData: TableLinkedItem) => (
        <span>{getContentLangValue(rowData.name)}</span>
      ),
      sortable: true,
      showFilterMenu: false,
      showClearButton: false,
    },
    {
      columnKey: 'productId',
      field: 'productId',
      header: t('products.edit.tab.linked.columns.id'),
      showFilterMenu: false,
      showClearButton: false,
    },
    {
      columnKey: 'type',
      header: t('products.edit.tab.linked.columns.type'),
      body: (rowData: TableLinkedItem) => (
        <Dropdown
          disabled={!canBeManaged}
          options={types}
          value={convertRelatedIdToRelatedType(rowData.type.id)}
          itemTemplate={(type: RelatedTypeDropdown) => (
            <div>{displayRelationType(type?.value)}</div>
          )}
          valueTemplate={(type: RelatedTypeDropdown) => (
            <div>{displayRelationType(type?.value)}</div>
          )}
          onChange={(ev) => onTypeChange(rowData.productId, ev.value)}
        />
      ),
      style: { width: '22%' },
    },
  ]

  const getBlockedIds = () => {
    const existedIds = props.relatedItems.map((i) => i.refId)
    return [...existedIds, props.editedId]
  }

  const syncTypes = useCallback(async () => {
    const data = await getSingleConfiguration('relation_types')
    const parsedData: RelatedType[] = JSON.parse(data.value as string)
    const options: RelatedTypeDropdown[] = parsedData
      .map((relatedType) => ({
        label: displayRelationType(relatedType),
        value: relatedType,
      }))
      .sort((a, b) => (a.label > b.label ? 1 : -1))
    setTypes(options)
  }, [getSingleConfiguration])

  useEffect(() => {
    setTypes((types) =>
      types?.sort((a, b) =>
        displayRelationType(a.value) > displayRelationType(b.value) ? 1 : -1
      )
    )
  }, [i18n.language])

  const addNewHandler = (productsIds: string[]) => {
    let newRelatedItems = productsIds.map((i) => ({
      refId: i,
      type: types[0].value.id,
    }))
    newRelatedItems = [...(formData.relatedItems || []), ...newRelatedItems]
    setFormField('relatedItems', newRelatedItems)
    validateRelatedItems(newRelatedItems)
    setAddDialogOpened(false)
  }

  const onTypeChange = useCallback(
    (id: string, value: RelatedType) => {
      const newRelatedItems = deepClone(formData.relatedItems || [])
      const index = newRelatedItems.findIndex((i) => i.refId === id)
      newRelatedItems[index].type = value.id
      setFormField('relatedItems', newRelatedItems)
      validateRelatedItems(newRelatedItems)
    },
    [formData]
  )

  const onRemoveItems = useCallback(() => {
    const selectedIds = selected.map((i) => i.productId)
    const newRelatedItems = deepClone(props.relatedItems).filter(
      (i) => !selectedIds.includes(i.refId)
    )
    setFormField('relatedItems', newRelatedItems)
    validateRelatedItems(newRelatedItems)
    setSelected([])
  }, [selected, props.relatedItems])

  const mapRelatedItemToTableItem = useCallback(
    async (relatedItem: RelatedItem): Promise<TableLinkedItem> => {
      const product = await getProduct(relatedItem.refId)
      return {
        name: product.name,
        productId: relatedItem.refId,
        imageUrl: product.media[0]?.url ?? logoDark,
        type: convertRelatedIdToRelatedType(relatedItem.type),
      }
    },
    [getProduct]
  )

  useEffect(() => {
    syncTypes()
    setInitFormData({ relatedItems: props.relatedItems || [] })
  }, [])

  useEffect(() => {
    ;(async () => {
      const tableItems = await Promise.all(
        (formData.relatedItems || []).map(mapRelatedItemToTableItem)
      )
      setItems(tableItems)
    })()
  }, [formData.relatedItems])

  const reset = useCallback(() => {
    setFormData({ relatedItems: props.relatedItems })
  }, [props.relatedItems])

  const submit = useCallback(async () => {
    blockPanel(true)
    try {
      if (formData.relatedItems) {
        await updateProduct({
          ...product,
          relatedItems: [...formData.relatedItems],
        })
        refreshData()
        setInitFormData({ relatedItems: formData.relatedItems })
      }
    } catch (err) {
      console.error(err)
    } finally {
      blockPanel(false)
    }
  }, [formData, props.editedId])

  return (
    <>
      <div className={'grid grid-nogutter'}>
        <div className="col-6 module-subtitle mb-5 mt-3">
          {t('products.edit.tab.linked.title')}
        </div>
        <div className="col-6 flex justify-content-end align-items-center">
          <Button
            disabled={!formDirty || !canBeManaged}
            className="p-button-secondary"
            label={t('global.discard')}
            onClick={reset}
          />
          <Button
            className="ml-2"
            disabled={!formDirty || !canBeManaged || !isValid}
            label={t('global.save')}
            onClick={submit}
          />
        </div>
      </div>
      <div className="linked-products-wrapper">
        {items.length > 0 ? (
          <>
            <div className="flex mb-3">
              <Button
                disabled={!canBeManaged}
                className={canBeManaged ? 'mr-3' : 'p-button-secondary mr-3'}
                label={t('products.edit.tab.linked.add')}
                type="button"
                onClick={() => setAddDialogOpened(true)}
              />
              <Button
                label={t('products.edit.tab.linked.remove')}
                disabled={selected.length === 0 || !canBeManaged}
                className={canBeManaged ? '' : 'p-button-secondary'}
                type="button"
                onClick={() => onRemoveItems()}
              />
            </div>
            <DataTable
              value={items}
              data-test-id="linked-products-table"
              responsiveLayout="scroll"
              onSelectionChange={(event) => setSelected(event.value)}
              selection={selected}
            >
              {columns.map((column: ColumnProps) => {
                return <Column {...column} key={column.columnKey} />
              })}
            </DataTable>
          </>
        ) : (
          <EmptyTable
            managerPermissions={canBeManaged}
            className="w-12 flex-grow-1"
            text={t('products.edit.tab.linked.table.emptyText')}
            buttonLabel={t('products.edit.tab.linked.table.emptyLink')}
            action={() => setAddDialogOpened(true)}
          />
        )}

        <Dialog
          header={t('products.edit.tab.linked.dialogTitle')}
          visible={addDialogOpened}
          onHide={() => setAddDialogOpened(false)}
          style={{ width: '90vw', maxWidth: '700px' }}
        >
          <ProductSearchAdd
            onSubmit={addNewHandler}
            getBlockedIds={getBlockedIds}
          />
        </Dialog>
      </div>
    </>
  )
}

ProductLinked.defaultProps = {
  className: '',
}

export default ProductLinked
