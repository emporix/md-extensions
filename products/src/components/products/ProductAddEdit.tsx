import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useSearchParams } from 'react-router'
import {
  ConfirmBox,
  SecondaryButton,
  Tabs,
  useToast,
  type TabItem,
} from '@emporix/component-library'
import { BsTrashFill } from 'react-icons/bs'
import { Product, ProductType } from '../../models/Category.model'
import { useProductsApi } from '../../hooks/api/products'
import { ProductAvailability } from './ProductAvailability'
import {
  RefreshValuesProvider,
  useRefresh,
} from '../../context/RefreshValuesProvider'
import { useUIBlocker } from '../../context/UIBlocker'
import { useTabs } from '../../hooks/useTabs'
import { ProductPrices } from './ProductPrices'
import HeaderSection from '../shared/HeaderSection'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import useUpdateEffect from '../../hooks/useUpdateEffect'
import useCustomNavigate from '../../hooks/useCustomNavigate'
import { VariantInformation } from './VariantInformation'
import { ProductDetailsForm } from './ProductDetailsForm'
import {
  ProductDataProvider,
  useProductData,
} from '../../context/ProductDataProvider'
import { ActiveNodeProvider } from '../../context/ActiveNodeProvider'
import { Variants } from './Variants'
import DynamicVariantHierarchySidebar from './dynamicVariants/DynamicVariantHierarchySidebar'
import { getVariantCodes } from '../../helpers/dynamicVariants/hierarchy.helpers'
import {
  persistedOverriddenFields,
  stripInheritedFields,
} from '../../helpers/dynamicVariants/inheritableFields.helpers'
import { deepClone } from '../../helpers/utils'
import { getApiErrorStatus } from '../../helpers/api'
import CategoriesAssignmentForm from './CategoriesAssignmentForm'
import ProductBundle from './ProductBundle'
import ProductLinked from './ProductLinked'
import AssetsViewer from '../shared/AssetsViewer'
import MediaAssetUpload from '../shared/MediaAssetUpload'
import { Asset, MediaRefIdType } from '../../models/Assets.model'
import { useMediaAssets } from '../../hooks/api/mediaAssets'
import useMixinsForm, { MIXINS_LOADING_TAB_ID } from '../mixins/useMixinsForm'
import { SchemaType } from '../../models/Schema.model'
import { MixinsFormMetadata } from '../mixins/helpers'
import { applyMixinSaveData } from '../mixins/siteAwareMixin.helpers'
import { Mixins } from '../../models/Mixins.model'
import { Metadata } from '../../models/Metadata.model'
import { usePermissions } from '../../context/PermissionsProvider'
import { useDashboardContext } from '../../context/Dashboard.context'
import { EmployeeDomains, VendorDomains } from '../../configs/accessControls'
import EntityChangelogTab from '../auditLog/EntityChangelogTab'
import { productsListPath } from '../../constants/paths'
import styles from './ProductAddEdit.module.scss'

/** URL `?tab=` ids — MD tab names (host links use e.g. `?tab=prices`). */
const GENERAL_TAB = 'general'
const CATEGORIES_TAB = 'categories'
const PRICES_TAB = 'prices'
const AVAILABILITY_TAB = 'availability'
const BUNDLE_TAB = 'bundle'
const MEDIA_TAB = 'media'
const LINKED_TAB = 'linked'
const VARIANTS_TAB = 'variants'
const AUDIT_LOG_TAB = 'audit-log'

/** MD error toast detail: `details || message || String(e)`. */
type ApiErrorLike = {
  response?: { data?: { details?: string; message?: string } }
}
const getUpdateErrorDetail = (e: unknown) => {
  const data = (e as ApiErrorLike | undefined)?.response?.data
  return data?.details || data?.message || String(e)
}

const ProductAddEditView = () => {
  const { t } = useTranslation()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const { blockPanel } = useUIBlocker()
  const { tenant } = useDashboardContext()

  const [isDeleteConfirmOpened, setIsDeleteConfirmOpened] = useState(false)
  const [isDeletingProduct, setIsDeletingProduct] = useState(false)
  const [assets, setAssets] = useState<Asset[]>([])
  const { deleteProduct, patchProduct, updateProduct } = useProductsApi()
  const { navigate } = useCustomNavigate()
  const { setRefreshValue, refresh } = useRefresh()
  const toast = useToast()
  const { showError } = toast
  const { hasPermission } = usePermissions()
  const canManage =
    hasPermission(EmployeeDomains.PRODUCTS_MANAGER) ||
    hasPermission(VendorDomains.VENDOR_PRODUCTS_MANAGER)

  const canManageMedia =
    hasPermission(EmployeeDomains.PRODUCTS_MANAGER) ||
    hasPermission(VendorDomains.VENDOR_MEDIA_MANAGER)

  const canViewMedia =
    hasPermission(EmployeeDomains.PRODUCTS_VIEWER) ||
    hasPermission(VendorDomains.VENDOR_MEDIA_VIEWER)

  const canViewAvailability =
    hasPermission(EmployeeDomains.PRODUCTS_VIEWER) ||
    hasPermission(VendorDomains.VENDOR_AVAILABILITY_VIEWER)

  const canViewAuditLog = hasPermission(EmployeeDomains.AUDIT_LOG_VIEWER)

  const { getContentLangValue } = useLocalizedValue()
  const { getAllAssetsForId } = useMediaAssets()

  const { product, parentProduct, refreshData } = useProductData()

  const isDynamicVariant =
    product.productType === ProductType.dynamicVariant ||
    product.productType?.toUpperCase() === ProductType.dynamicVariant

  const showUpdateError = (e: unknown) => {
    const status = getApiErrorStatus(e)
    if (status === 400) {
      showError(t('products.toast.errorUpdateValidation'))
    } else if (status === 409) {
      showError(t('products.toast.errorUpdateConflict'))
    } else {
      showError(t('products.edit.toast.update.error'), getUpdateErrorDetail(e))
    }
  }

  const saveMixin = async (data: Mixins, mixinMetadata: MixinsFormMetadata) => {
    const { key, url } = mixinMetadata
    // Full PUT: PATCH recursively merges and leaves omitted overlay fields /
    // null mixin keys in place. Custom instances use the same upsert pattern.
    let productToUpdate: Partial<Product> = deepClone({
      ...product,
      mixins: applyMixinSaveData(product.mixins, data, mixinMetadata),
      metadata: {
        ...product.metadata,
        mixins: {
          ...product.metadata?.mixins,
          [key]: url,
        },
      },
    })
    if (isDynamicVariant) {
      delete productToUpdate.template
      delete productToUpdate.inheritedVariantAttributes
      delete productToUpdate.variants
      delete productToUpdate.metadata?.overridden
      if (productToUpdate.parentVariantId) {
        productToUpdate = stripInheritedFields(
          productToUpdate,
          persistedOverriddenFields(product)
        )
      }
    }
    delete productToUpdate.metadata?.createdAt
    delete productToUpdate.metadata?.modifiedAt
    blockPanel(true)
    try {
      await updateProduct(productToUpdate)
      await refreshData()
      toast.showToast(t('products.edit.toast.update.success'), '', 'success')
    } catch (e: unknown) {
      showUpdateError(e)
      throw e
    } finally {
      blockPanel(false)
    }
  }

  const saveClassificationMixins = async (
    mixinsData: Mixins,
    metadataUrls: Metadata
  ) => {
    blockPanel(true)
    try {
      await patchProduct({
        id: product.id,
        mixins: mixinsData,
        // Classification metadata holds schema URLs (MD `Metadata` was `any`).
        metadata: { mixins: metadataUrls as Record<string, string> },
      })
      await refreshData()
      toast.showToast(t('products.edit.toast.update.success'), '', 'success')
    } catch (e: unknown) {
      showUpdateError(e)
    } finally {
      blockPanel(false)
    }
  }

  const { loadMixins, mixinsTabs, classificationsTab, isMixinsLoading } =
    useMixinsForm({
      type: SchemaType.PRODUCT,
      onEdit: saveMixin,
      onEditClassifications: saveClassificationMixins,
      managerPermissions: canManage,
      siteAware: true,
    })

  useEffect(() => {
    if (!product) return
    void loadMixins(
      product.metadata?.mixins,
      product.mixins,
      product.metadata?.classificationMixins
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [refreshData, product])

  useUpdateEffect(() => {
    navigate(productsListPath())
  }, [tenant])

  useEffect(() => {
    void (async () => {
      if (id) {
        const assets = await getAllAssetsForId(id)
        setAssets(assets)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [id, refresh])

  const handleDelete = () => {
    setIsDeleteConfirmOpened(true)
  }

  const variantCodes = useMemo(
    () => (isDynamicVariant ? getVariantCodes(product?.variants) : []),
    [isDynamicVariant, product?.variants]
  )

  const onConfirmDelete = useCallback(async () => {
    try {
      if (!id) return
      blockPanel(true)
      setIsDeletingProduct(true)
      await deleteProduct(id, isDynamicVariant)
      setIsDeleteConfirmOpened(false)
    } catch (err) {
      console.error(err)
    } finally {
      blockPanel(false)
      setIsDeletingProduct(false)
      navigate(productsListPath())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [id, isDynamicVariant])

  const showBundleTab =
    product.productType?.toUpperCase() === ProductType.bundle

  const tabIds = useMemo(
    () => [
      GENERAL_TAB,
      CATEGORIES_TAB,
      ...(classificationsTab ? [classificationsTab.id] : []),
      PRICES_TAB,
      AVAILABILITY_TAB,
      ...(showBundleTab ? [BUNDLE_TAB] : []),
      MEDIA_TAB,
      LINKED_TAB,
      VARIANTS_TAB,
      ...mixinsTabs.map((tab) => tab.id),
      ...(canViewAuditLog ? [AUDIT_LOG_TAB] : []),
    ],
    [classificationsTab, showBundleTab, mixinsTabs, canViewAuditLog]
  )
  const { activeTab, onTabChange } = useTabs(tabIds, true)

  // While mixins (re)load, a `?tab=<mixin>` URL has no matching tab yet:
  // keep the loading placeholder selected instead of jumping to General.
  const urlTab = searchParams.get('tab')
  const activeTabId =
    isMixinsLoading && urlTab && !tabIds.includes(urlTab)
      ? MIXINS_LOADING_TAB_ID
      : (activeTab ?? GENERAL_TAB)

  const tabs: TabItem[] = [
    {
      id: GENERAL_TAB,
      label: t('products.edit.tab.general.title'),
      content: <ProductDetailsForm />,
    },
    {
      id: CATEGORIES_TAB,
      label: t('products.edit.tab.categories.title'),
      disabled: !product.id,
      content: <CategoriesAssignmentForm />,
    },
    ...(classificationsTab ? [classificationsTab] : []),
    {
      id: PRICES_TAB,
      label: t('products.edit.tab.prices.title'),
      disabled: !product.id,
      content: <ProductPrices />,
    },
    {
      id: AVAILABILITY_TAB,
      label: t('products.edit.tab.availability.title'),
      disabled:
        !product.id ||
        product.productType === ProductType.parentVariant ||
        !canViewAvailability,
      content: <ProductAvailability productId={product.id as string} />,
    },
    ...(showBundleTab
      ? [
          {
            id: BUNDLE_TAB,
            label: t('products.edit.tab.bundle.title'),
            disabled: !product.id,
            content: (
              <ProductBundle
                bundledItems={product.bundledProducts ?? []}
                editedId={product.id as string}
              />
            ),
          },
        ]
      : []),
    {
      id: MEDIA_TAB,
      label: t('products.edit.tab.media.tabTitle'),
      disabled: !product.id || !canViewMedia,
      content: (
        <>
          <AssetsViewer
            managerPermissions={canManageMedia}
            assets={assets}
            refresh={() => setRefreshValue()}
            className={styles.assets}
            showAllMediaTypes
          />
          <MediaAssetUpload
            managerPermissions={canManageMedia}
            type={MediaRefIdType.PRODUCT}
            id={id as string}
            refresh={() => setRefreshValue()}
            acceptAllMedia
          />
        </>
      ),
    },
    {
      id: LINKED_TAB,
      label: t('products.edit.tab.linked.title'),
      disabled: !product.id,
      content: (
        <ProductLinked
          relatedItems={product.relatedItems ?? []}
          editedId={product.id as string}
        />
      ),
    },
    {
      id: VARIANTS_TAB,
      label: t('products.edit.tab.attributes.title'),
      disabled: !parentProduct,
      content: <Variants />,
    },
    ...mixinsTabs,
    ...(canViewAuditLog
      ? [
          {
            id: AUDIT_LOG_TAB,
            label: t('auditLog.entityChangelog.tab'),
            disabled: !product.id,
            content: product.id ? (
              <EntityChangelogTab
                entity="product"
                entityId={product.id}
                isActive={activeTabId === AUDIT_LOG_TAB}
              />
            ) : null,
          },
        ]
      : []),
  ]

  return (
    <>
      <HeaderSection
        title={t('products.singular')}
        subtitle={
          id && (
            <div className={styles.subtitle}>
              {getContentLangValue(product.name)}
              {product.parentVariantId && parentProduct && (
                <VariantInformation parent={parentProduct} />
              )}
            </div>
          )
        }
        moduleActions={
          <>
            {id && (
              <SecondaryButton
                className={styles.deleteButton}
                disabled={!canManage}
                onClick={handleDelete}
              >
                <BsTrashFill size={16} aria-hidden />
                {t('global.delete')}
              </SecondaryButton>
            )}
          </>
        }
        backTo={productsListPath()}
      />

      <div className={isDynamicVariant ? styles.dynamicLayout : undefined}>
        {isDynamicVariant && (
          <DynamicVariantHierarchySidebar className={styles.sidebar} />
        )}
        <div className={styles.tabsColumn}>
          <Tabs
            tabs={tabs}
            activeTabId={activeTabId}
            onTabChange={onTabChange}
          />
        </div>
      </div>

      <ConfirmBox
        visible={isDeleteConfirmOpened}
        onAccept={onConfirmDelete}
        onReject={() => {
          setIsDeleteConfirmOpened(false)
        }}
        loading={isDeletingProduct}
        title={t('products.dynamicVariant.dialogs.deleteTreeNode.title')}
        message={t('confirmBox.message')}
        acceptLabel={t('global.yes')}
        rejectLabel={t('global.cancel')}
      >
        {isDynamicVariant && variantCodes.length > 0 ? (
          <div>
            {t('products.dynamicVariant.dialogs.deleteTreeNode.text2', {
              count: variantCodes.length,
            })}
            <ul className={styles.variantCodes}>
              {variantCodes.map((v) => (
                <li key={v}>{v}</li>
              ))}
            </ul>
          </div>
        ) : undefined}
      </ConfirmBox>
    </>
  )
}

const ProductAddEdit = () => (
  <RefreshValuesProvider>
    <ProductDataProvider>
      <ActiveNodeProvider>
        <ProductAddEditView />
      </ActiveNodeProvider>
    </ProductDataProvider>
  </RefreshValuesProvider>
)

export default ProductAddEdit
