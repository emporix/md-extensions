import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DataTable,
  Tabs,
  useToast,
  type DataTableColumnProps,
} from '@emporix/component-library'
import useMixinsForm from '../../mixins/useMixinsForm'
import type { MixinsFormMetadata } from '../../mixins/helpers'
import { useProductsApi } from '../../../hooks/api/products'
import { useOrdersApi } from '../../../hooks/api/orders'
import { useLocalizedValue } from '../../../hooks/useLocalizedValue'
import { useUIBlocker } from '../../../context/UIBlocker'
import { useOrderData } from '../../../contexts/OrderData.provider'
import { getApiErrorMessage } from '../../../helpers/api'
import type Localized from '../../../models/Localized.model'
import type { Mixins } from '../../../models/Mixins.model'
import { Entry, Order, ProductType } from '../../../models/Order.model'
import styles from './Legacy.module.scss'

type BundleItem = {
  productId: string
  amount: number
  name: Localized | string
  imageUrl: string
}

type EntryTableExpansionProps = {
  readonly entry: Entry
  readonly entries: Entry[]
  readonly order: Order
  readonly readonly?: boolean
}

/** Bundle contents + entry mixin tabs for legacy order entries. */
const EntryTableExpansion = ({
  entry,
  entries,
  order,
  readonly = false,
}: EntryTableExpansionProps) => {
  const { t } = useTranslation()
  const { showSuccess, showError } = useToast()
  const { getProduct } = useProductsApi()
  const { patchOrder } = useOrdersApi()
  const { getContentLangValue, contentLanguage } = useLocalizedValue()
  const { blockPanel } = useUIBlocker()
  const { refreshData } = useOrderData()
  const [bundleItems, setBundleItems] = useState<BundleItem[]>([])
  const [activeTab, setActiveTab] = useState<string>()
  const isBundle = entry.product?.productType === ProductType.bundle

  useEffect(() => {
    const bundled = entry.product?.bundledProducts
    if (!bundled) return
    void (async () => {
      const items: BundleItem[] = []
      for (const product of bundled) {
        try {
          const data = await getProduct(product.productId)
          items.push({
            productId: product.productId,
            amount: product.amount,
            name: data.name,
            imageUrl: data.media?.[0]?.url || '',
          })
        } catch (e) {
          console.error(e)
        }
      }
      setBundleItems(items)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const saveMixin = async (data: Mixins, metadata: MixinsFormMetadata) => {
    const newEntries = entries.map((e) =>
      e.id === entry.id
        ? { ...e, mixins: { ...e.mixins, [metadata.key]: data } }
        : e
    )
    blockPanel(true)
    try {
      await patchOrder(order.id, { entries: newEntries })
      await refreshData()
      showSuccess(t('orders.data.toast.orderUpdated'))
    } catch (e: unknown) {
      showError(t('orders.toasts.errorUpdate'), getApiErrorMessage(e))
    } finally {
      blockPanel(false)
    }
  }

  // No schema type: legacy entries only show the mixins they already carry.
  const { loadMixins, mixinsForms } = useMixinsForm({
    onEdit: saveMixin,
    managerPermissions: !readonly,
  })

  useEffect(() => {
    void loadMixins(
      (entry.metadata?.mixins as Record<string, string>) ?? {},
      entry.mixins ?? {}
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order])

  const columns: DataTableColumnProps[] = useMemo(
    () => [
      {
        columnKey: 'gapStart',
        style: { width: '80px', minWidth: '80px' },
        body: () => <span />,
      },
      {
        columnKey: 'image',
        style: { width: '3rem' },
        body: (item: BundleItem) => (
          <div className={styles.imageWrapper}>
            <img
              className={styles.image}
              src={item.imageUrl}
              alt={getContentLangValue(item.name)}
            />
          </div>
        ),
      },
      { columnKey: 'id', style: { width: '15%' }, field: 'productId' },
      {
        columnKey: 'name',
        style: { width: '35%' },
        body: (item: BundleItem) => getContentLangValue(item.name),
      },
      {
        columnKey: 'amount',
        style: { width: '7rem', textAlign: 'center' },
        field: 'amount',
      },
      { columnKey: 'gapEnd', body: () => <span /> },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [contentLanguage]
  )

  const tabs = mixinsForms.map((form) => ({
    id: form.id,
    label: form.name,
    content: form.template,
  }))

  return (
    <div>
      {isBundle && (
        <DataTable
          value={bundleItems}
          columns={columns}
          loading={bundleItems.length === 0}
          paginator={false}
          showFilter={false}
          showHeaders={false}
        />
      )}
      {tabs.length > 0 && (
        <div className={styles.expansionTabs}>
          <Tabs
            tabs={tabs}
            activeTabId={activeTab ?? tabs[0].id}
            onTabChange={setActiveTab}
          />
        </div>
      )}
    </div>
  )
}

export default EntryTableExpansion
