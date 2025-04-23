import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocalizedValue } from '../../hooks/useLocalizedValue.tsx'
import { VariantsProductsTable } from './VariantsProductsTable.tsx'
import { Product, ProductType } from '../../models/Category'
import { DataTableFilterMeta } from 'primereact/datatable'
import { useProductData } from '../../context/ProductDataProvider'
import { useProductsApi } from '../../api/products'
import { useUIBlocker } from '../../context/UIBlcoker'
import ConfirmBox from '../shared/ConfirmBox'
import logoDark from '../../../assets/images/logoDark.png'
import TableActions from '../shared/TableActions'
import { useDashboardContext } from '../../context/Dashboard.context.tsx'

export const Variants = () => {
  const { product } = useProductData()

  const parentId = useMemo(() => {
    if (product.productType === ProductType.parentVariant && product.id) {
      return product.id
    } else if (
      product.productType === ProductType.variant &&
      product.parentVariantId
    ) {
      return product.parentVariantId
    }
  }, [product])

  return (
    <div>
      {parentId && <VariantsList variantParentId={parentId}></VariantsList>}
    </div>
  )
}

interface VariantListProps {
  variantParentId: string
}

export const VariantsList = (props: VariantListProps) => {
  const { variantParentId } = props
  const { i18n, t } = useTranslation()
  const { blockPanel } = useUIBlocker()
  const { contentLanguage } = useDashboardContext()
  const { getContentLangValue } = useLocalizedValue()

  const { permissions } = useDashboardContext()
  const canBeManaged = permissions?.products?.manager

  const [variantFilters, setVariantFilters] = useState<DataTableFilterMeta>({
    parentVariantId: {
      value: variantParentId,
      matchMode: 'contains',
    },
  })

  const { deleteProduct } = useProductsApi()

  const [isDeleteConfirmOpened, setIsDeleteConfirmOpened] = useState(false)

  const deleteVariant = useCallback(
    async (id: string) => {
      blockPanel(true)
      try {
        await deleteProduct(id)
      } catch (e) {
        console.error(e)
      } finally {
        setIsDeleteConfirmOpened(false)
        blockPanel(false)
        setVariantFilters({
          parentVariantId: {
            value: variantParentId,
            matchMode: 'contains',
          },
        })
      }
    },
    [deleteProduct]
  )

  const columns = useMemo(() => {
    return [
      {
        key: 'imageUrl',
        header: t(`products.table.image`),
        field: 'media',
        filter: false,
        sortable: false,
        body: (pr: Product) => {
          return (
            <img
              className="thumb"
              src={pr.media && pr.media.length > 0 ? pr.media[0].url : logoDark}
            />
          )
        },
      },
      {
        key: 'name',
        header: t(`products.table.name`),
        filterPlaceholder: t(`products.table.filters.name`),
        field: `name`,
        filter: true,
        sortable: true,
        showFilterMenu: false,
        body: (rowData: Product) => getContentLangValue(rowData.name),
      },
      {
        key: 'code',
        header: t(`products.table.code`),
        filterPlaceholder: t(`products.table.filters.code`),
        field: 'code',
        filter: true,
        sortable: true,
        showFilterMenu: false,
      },
      {
        key: 'actions',
        showFilterMenu: false,
        body: (rowData: { id: string }) => {
          return (
            <div className="flex">
              <TableActions
                managerPermission={canBeManaged}
                onDelete={() => setIsDeleteConfirmOpened(true)}
              />
              <ConfirmBox
                visible={isDeleteConfirmOpened}
                onAccept={() => deleteVariant(rowData.id)}
                onReject={() => {
                  setIsDeleteConfirmOpened(false)
                }}
                title={t('products.actions.delete.title')}
              />
            </div>
          )
        },
      },
    ]
  }, [i18n.language, contentLanguage, isDeleteConfirmOpened])

  return (
    <>
      <div className="grid grid-nogutter">
        <div className="col-6 module-subtitle mb-5 mt-3">
          {t('products.edit.tab.attributes.title')}
        </div>
      </div>
      <VariantsProductsTable
        columns={columns}
        preFilters={variantFilters}
      ></VariantsProductsTable>
    </>
  )
}
