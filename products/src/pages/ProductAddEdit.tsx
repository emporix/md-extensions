import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router'
import { ProductType } from '../models/Category.ts'
import { TabPanel, TabView } from 'primereact/tabview'
import { Button } from 'primereact/button'
import { useProductsApi } from '../api/products'
import { ProductAvailability } from '../components/products/ProductAvailability.tsx'
import {
  RefreshValuesProvider,
  useRefresh,
} from '../context/RefreshValuesProvider'
import { useUIBlocker } from '../context/UIBlcoker'
import { useTabs } from '../hooks/useTabs'
import BackButton from '../components/shared/BackButton.tsx'
import { ProductPrices } from '../components/products/ProductPrices.tsx'
import HeaderSection from '../components/shared/HeaderSection.tsx'
import ConfirmBox from '../components/shared/ConfirmBox'
import { useLocalizedValue } from '../hooks/useLocalizedValue.tsx'
import useUpdateEffect from '../hooks/useUpdateEffect.tsx'
import useCustomNavigate from '../hooks/useCustomNavigate.tsx'
import { VariantInformation } from '../components/products/VariantInformation.tsx'
import { ProductDetailsForm } from '../components/products/ProductDetailsForm.tsx'
import {
  ProductDataProvider,
  useProductData,
} from '../context/ProductDataProvider'
import { Variants } from '../components/products/Variants.tsx'
import { CategoriesAssignmentForm } from '../components/products/CategoriesAssignmentForm.tsx'
import ProductBundle from '../components/products/ProductBundle.tsx'
import ProductLinked from '../components/products/ProductLinked.tsx'
import { useToast } from '../context/ToastProvider'
import ProductSuppliers from '../components/products/ProductSuppliers.tsx'
import AssetsViewer from '../components/shared/AssetsViewer.tsx'
import MediaAssetUpload from '../components/shared/MediaAssetUpload'
import { Asset, MediaRefIdType } from '../models/Assets'
import { useMediaAssets } from '../api/mediaAssets'
import { BsTrashFill } from 'react-icons/bs'
import useMixinsForm from '../components/shared/mixins/useMixinsForm'
import { SchemaType } from '../models/Schema'
import { MixinsFormMetadata } from '../components/shared/mixins/helpers'
import { deepClone, removeObjectEmptyValues } from '../helpers/utils'
import { Mixins } from '../models/Mixins'
import TabsLoader from '../components/shared/TabsLoader.tsx'
import { useDashboardContext } from '../context/Dashboard.context.tsx'

const TABS = [
  'general',
  'categories',
  'suppliers',
  'prices',
  'availability',
  'bundle',
  'media',
  'linked',
  'variants',
  'custom',
  'images',
  'demo',
]

const ProductAddEditView = () => {
  const { t } = useTranslation()
  const { id } = useParams()
  const { blockPanel } = useUIBlocker()
  const { tenant } = useDashboardContext()

  const { activeIndex, onTabChange } = useTabs(TABS)
  const [isDeleteConfirmOpened, setIsDeleteConfirmOpened] = useState(false)
  const [isDeletingProduct, setIsDeletingProduct] = useState(false)
  const [assets, setAssets] = useState<Asset[]>([])
  const { deleteProducts, patchProduct } = useProductsApi()
  const { navigate } = useCustomNavigate()
  const { setRefreshValue, refresh } = useRefresh()
  const toast = useToast()
  const { permissions } = useDashboardContext()
  const canBeManaged = permissions?.products?.manager

  const { getContentLangValue } = useLocalizedValue()
  const { getAllAssetsForId } = useMediaAssets()

  const { product, parentProduct, refreshData } = useProductData()

  useEffect(() => {
    if (
      !product ||
      !product.mixins ||
      !product.metadata ||
      !product.metadata.mixins
    )
      return
    loadMixins(product.metadata.mixins, product.mixins)
  }, [refreshData, product])

  const saveMixin = async (data: Mixins, mixinMetadata: MixinsFormMetadata) => {
    const { key, url } = mixinMetadata
    const value = deepClone(data)
    removeObjectEmptyValues(value)

    blockPanel(true)
    try {
      await patchProduct({
        id: product.id,
        mixins: { [key]: { ...value } },
        metadata: { mixins: { [key]: url } },
      })
      await refreshData()
      toast.showToast(t('products.edit.toast.update.success'), '', 'success')
    } catch (e) {
      console.error(e)
    } finally {
      blockPanel(false)
    }
  }

  const { mixinsForms, loadMixins, isMixinsLoading } = useMixinsForm({
    type: SchemaType.PRODUCT,
    onEdit: saveMixin,
    managerPermissions: canBeManaged,
  })

  useUpdateEffect(() => {
    navigate(`/products`)
  }, [tenant])

  useEffect(() => {
    ;(async () => {
      if (id) {
        const assets = await getAllAssetsForId(id)
        setAssets(assets)
      }
    })()
  }, [id, refresh])

  const handleDelete = () => {
    setIsDeleteConfirmOpened(true)
  }

  const onConfirmDelete = useCallback(async () => {
    try {
      blockPanel(true)
      setIsDeletingProduct(true)
      if (!id) {
        throw `no product id`
      }
      await deleteProducts([id])
      setIsDeleteConfirmOpened(false)
    } catch (err) {
      console.error(err)
    } finally {
      blockPanel(false)
      setIsDeletingProduct(false)
      navigate('/ products')
    }
  }, [id])

  return (
    <div className="module products">
      <div className="col-12">
        <BackButton label={t('products.title')} to={'/ products'} />
      </div>
      <>
        <HeaderSection
          title={
            id ? (
              <>
                {t('products.edit.title')}
                <span className="highlight-text ml-1">
                  {getContentLangValue(product.name)} ({product.id})
                </span>
                {product.parentVariantId && parentProduct && (
                  <VariantInformation parent={parentProduct} />
                )}
              </>
            ) : (
              <>{t('products.edit.create')}</>
            )
          }
          siteSelect
        />

        {id && (
          <div className="col-12 mb-2">
            <Button
              disabled={!canBeManaged}
              onClick={handleDelete}
              loading={false}
              className="p-button-secondary"
            >
              <BsTrashFill size={16} className="mr-2" />
              <span>{t('products.actions.delete.title')}</span>
            </Button>
          </div>
        )}

        <div className="col-12 ">
          <TabView
            scrollable
            activeIndex={activeIndex}
            onTabChange={onTabChange}
          >
            <TabPanel
              header={t('products.edit.tab.general.title')}
              key="general"
            >
              <ProductDetailsForm />
            </TabPanel>
            <TabPanel
              header={t('products.edit.tab.categories.title')}
              key="categories"
              disabled={!product.id}
            >
              <CategoriesAssignmentForm />
            </TabPanel>
            <TabPanel
              header={t('products.edit.tab.suppliers.tabTitle')}
              key="suppliers"
              disabled={!product.id}
            >
              <ProductSuppliers />
            </TabPanel>
            <TabPanel
              disabled={!product.id}
              header={t('products.edit.tab.prices.title')}
              key="price"
            >
              <ProductPrices />
            </TabPanel>
            <TabPanel
              header={t('products.edit.tab.availability.title')}
              key="availability"
              disabled={
                !product.id || product.productType === ProductType.parentVariant
              }
            >
              <ProductAvailability productId={product.id as string} />
            </TabPanel>
            <TabPanel
              header={t('products.edit.tab.bundle.title')}
              key="bundle"
              disabled={
                !(product.productType?.toUpperCase() === ProductType.bundle) ||
                !product.id
              }
            >
              <ProductBundle
                bundledItems={product.bundledProducts || []}
                editedId={product.id as string}
              />
            </TabPanel>

            <TabPanel
              disabled={!product.id}
              header={t('products.edit.tab.media.tabTitle')}
              key="media"
            >
              {assets && (
                <AssetsViewer
                  managerPermissions={canBeManaged}
                  assets={assets}
                  categoryId={id as string}
                  refresh={() => setRefreshValue()}
                />
              )}

              <MediaAssetUpload
                managerPermissions={canBeManaged}
                type={MediaRefIdType.PRODUCT}
                id={id as string}
                refresh={() => setRefreshValue()}
              />
            </TabPanel>

            <TabPanel
              disabled={!product.id}
              header={t('products.edit.tab.linked.title')}
              key="linked"
            >
              <ProductLinked
                relatedItems={product.relatedItems || []}
                editedId={product.id as string}
              />
            </TabPanel>

            <TabPanel
              disabled={!parentProduct}
              header={t('products.edit.tab.attributes.title')}
              key="variants"
            >
              <Variants />
            </TabPanel>
            {isMixinsLoading ? (
              <TabPanel disabled={true} header={<TabsLoader />} />
            ) : (
              mixinsForms.map((f: any) => (
                <TabPanel header={f.name} key={f.id}>
                  {f.template}
                </TabPanel>
              ))
            )}
          </TabView>
        </div>
      </>

      <ConfirmBox
        visible={isDeleteConfirmOpened}
        onAccept={onConfirmDelete}
        onReject={() => {
          setIsDeleteConfirmOpened(false)
        }}
        loading={isDeletingProduct}
        title={`${t('products.actions.delete.message')}`}
      />
    </div>
  )
}

export default function ProductAddEdit() {
  return (
    <RefreshValuesProvider>
      <ProductDataProvider>
        <ProductAddEditView />
      </ProductDataProvider>
    </RefreshValuesProvider>
  )
}
