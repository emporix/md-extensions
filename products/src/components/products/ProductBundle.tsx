import { useCallback, useEffect, useState } from 'react'
import { BundledProduct } from '../../models/Category'
import { useProductsApi } from '../../api/products'
import ProductSearchAdd from './ProductSearchAdd'
import { Dialog } from 'primereact/dialog'
import { useTranslation } from 'react-i18next'
import { Column, ColumnProps } from 'primereact/column'
import { deepClone } from '../../helpers/utils'
import EmptyTable from '../shared/EmptyTable'
import { Button } from 'primereact/button'
import { InputNumber } from 'primereact/inputnumber'
import i18n from 'i18next'
import Localized from '../../models/Localized'
import useForm from '../../hooks/useForm.tsx'
import { useUIBlocker } from '../../context/UIBlcoker'
import { useProductData } from '../../context/ProductDataProvider'
import { useLocalizedValue } from '../../hooks/useLocalizedValue.tsx'
import MdDataTable from '../shared/MdDataTable'
import { useDashboardContext } from '../../context/Dashboard.context.tsx'

interface ProductBundleProps {
  bundledItems: BundledProduct[]
  editedId: string
  className: string
}

interface TableBundledItem {
  imageUrl: string
  name: Localized
  amount: number
  productId: string
}

const ProductBundle = (props: ProductBundleProps) => {
  const { t } = useTranslation()
  const { getProduct, patchProduct } = useProductsApi()
  const [addDialogOpened, setAddDialogOpened] = useState<boolean>(false)
  const [items, setItems] = useState<TableBundledItem[]>([])
  const [selected, setSelected] = useState<TableBundledItem[]>([])
  const { refreshData } = useProductData()
  const { bundledItems } = props
  const { blockPanel } = useUIBlocker()
  const { getContentLangValue } = useLocalizedValue()
  const { setFormField, setFormData, setInitFormData, formData, formDirty } =
    useForm<{ bundledProducts: BundledProduct[] }>()

  const { permissions } = useDashboardContext()
  const canBeManaged = permissions?.products?.manager

  const columns: ColumnProps[] = [
    {
      columnKey: 'image',
      header: t('products.edit.tab.bundle.columns.image'),
      field: 'image',
      showFilterMenu: false,
      body: (rowData: TableBundledItem) => (
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
      header: t('products.edit.tab.bundle.columns.name'),
      body: (rowData: TableBundledItem) => (
        <span>{getContentLangValue(rowData.name)}</span>
      ),
      sortable: true,
      showFilterMenu: false,
      showClearButton: false,
    },
    {
      columnKey: 'amount',
      field: 'amount',
      header: t('products.edit.tab.bundle.columns.amount'),
      body: (rowData: TableBundledItem) => (
        <InputNumber
          disabled={!canBeManaged}
          locale={i18n.language}
          onChange={(ev) => onAmountChange(rowData.productId, ev.value || 1)}
          value={rowData.amount}
        />
      ),
      showFilterMenu: false,
      showClearButton: false,
    },
  ]

  const getBlockedIds = () => {
    const existedIds = bundledItems.map(
      (bundledProduct) => bundledProduct.productId
    )
    return [...existedIds, props.editedId]
  }

  const addNewHandler = (productsIds: string[]) => {
    let newBundledItems: BundledProduct[] = productsIds.map((i) => ({
      productId: i,
      amount: 1,
    }))
    newBundledItems = [...bundledItems, ...newBundledItems]
    setFormField('bundledProducts', newBundledItems)
    setAddDialogOpened(false)
  }

  const onAmountChange = useCallback(
    (id: string, value: number) => {
      const newItems = deepClone(bundledItems)
      const index = newItems.findIndex(
        (bundledProduct) => bundledProduct.productId === id
      )
      if (index !== -1) {
        newItems[index].amount = value
        setFormField('bundledProducts', newItems)
      } else if (formData.bundledProducts) {
        const newBundleItemsIndex = formData.bundledProducts.findIndex(
          (bundledProduct) => bundledProduct.productId === id
        )
        formData.bundledProducts[newBundleItemsIndex].amount = value
      }
    },
    [props.bundledItems, formData]
  )

  const onRemoveItems = useCallback(() => {
    const selectedIds = selected.map((bundledItem) => bundledItem.productId)
    const newItems = deepClone(bundledItems).filter(
      (i) => !selectedIds.includes(i.productId)
    )
    setFormField('bundledProducts', newItems)
    setSelected([])
  }, [selected, props.bundledItems])

  const mapBundledItemToTableItem = useCallback(
    async (bundledItem: BundledProduct): Promise<TableBundledItem> => {
      const product = await getProduct(bundledItem.productId)
      return {
        name: product.name,
        productId: bundledItem.productId,
        imageUrl: product.media[0]?.url,
        amount: bundledItem.amount,
      }
    },
    [getProduct]
  )

  useEffect(() => {
    setInitFormData({ bundledProducts: props.bundledItems || [] })
  }, [])

  useEffect(() => {
    ;(async () => {
      const tableItems = await Promise.all(
        (formData.bundledProducts || []).map(mapBundledItemToTableItem)
      )
      setItems(tableItems)
    })()
  }, [formData.bundledProducts])

  const reset = useCallback(() => {
    setFormData({ bundledProducts: props.bundledItems })
  }, [formData])

  const submit = useCallback(async () => {
    blockPanel(true)
    try {
      if (formData.bundledProducts) {
        await patchProduct({
          id: props.editedId,
          bundledProducts: [...formData.bundledProducts],
        })
        refreshData()
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
          {t('products.edit.tab.bundle.title')}
        </div>
        <div className="col-6 flex justify-content-end align-items-center">
          <Button
            disabled={!formDirty || !canBeManaged}
            className="p-button-secondary"
            label={t('global.discard')}
            onClick={reset}
          />
          <Button
            className={canBeManaged ? 'ml-2' : 'p-button-secondary ml-2'}
            disabled={!formDirty || !canBeManaged}
            label={t('global.save')}
            onClick={submit}
          />
        </div>
      </div>
      {items.length > 0 ? (
        <>
          <div className="flex mb-3">
            <Button
              disabled={!canBeManaged}
              className={canBeManaged ? 'mr-3' : 'p-button-secondary mr-3'}
              label={t('products.edit.tab.bundle.add')}
              type="button"
              onClick={() => setAddDialogOpened(true)}
            />
            <Button
              className={
                selected.length === 0 || !canBeManaged
                  ? 'p-button-secondary'
                  : ''
              }
              label={t('products.edit.tab.bundle.remove')}
              disabled={selected.length === 0 || !canBeManaged}
              type="button"
              onClick={() => onRemoveItems()}
            />
          </div>
          <MdDataTable
            value={items}
            setSelectedItems={setSelected}
            selection={selected}
            selectionMode={canBeManaged ? 'multiple' : undefined}
          >
            {columns.map((column: ColumnProps) => {
              return <Column {...column} key={column.columnKey} />
            })}
          </MdDataTable>
        </>
      ) : (
        <EmptyTable
          managerPermissions={canBeManaged}
          className="w-12 flex-grow-1"
          text={t('products.edit.tab.bundle.table.emptyText')}
          buttonLabel={t('products.edit.tab.bundle.table.emptyLink')}
          action={() => setAddDialogOpened(true)}
        />
      )}

      <Dialog
        header={t('products.edit.tab.bundle.dialogTitle')}
        visible={addDialogOpened}
        onHide={() => setAddDialogOpened(false)}
        style={{ width: '90vw', maxWidth: '700px' }}
      >
        <ProductSearchAdd
          onSubmit={addNewHandler}
          getBlockedIds={getBlockedIds}
        />
      </Dialog>
    </>
  )
}

ProductBundle.defaultProps = {
  className: '',
}

export default ProductBundle
