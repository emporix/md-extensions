import { useCallback, useEffect, useMemo, useState } from 'react'
import { Availability, DistributionChannel } from '@emporix/api-calls'
import { Mixins } from '../../models/Mixins.model'
import { useAvailabilityApi } from '../../hooks/api/availability'
import { SchemaType } from '../../models/Schema.model'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import useMixinsForm from '../mixins/useMixinsForm'
import { MixinsFormMetadata } from '../mixins/helpers'
import {
  Dropdown,
  InputNumber,
  PrimaryButton,
  SecondaryButton,
  SectionBox,
  type TabItem,
  Tabs,
  useToast,
} from '@emporix/component-library'
import { useRefresh } from '../../context/RefreshValuesProvider'
import { usePermissions } from '../../context/PermissionsProvider'
import { EmployeeDomains, VendorDomains } from '../../configs/accessControls'
import styles from './AvailabilityRecordExpansion.module.scss'

const GENERAL_TAB_ID = 'general'

type Props = {
  readonly productId: string
  readonly record: Availability
  readonly rowKey: string
  readonly onDirtyChange?: (rowKey: string, isDirty: boolean) => void
}

interface GeneralForm {
  stockLevel: number
  distributionChannel?: DistributionChannel
}

const distributionChannelOptions: {
  label: string
  value: DistributionChannel
}[] = [
  { label: 'Assortment', value: 'ASSORTMENT' },
  { label: 'Home Delivery', value: 'HOME_DELIVERY' },
  { label: 'Pickup', value: 'PICKUP' },
]

const AvailabilityRecordExpansion = (props: Props) => {
  const { productId, record, rowKey, onDirtyChange } = props
  const { t } = useTranslation()
  const toast = useToast()
  const { setRefreshValue } = useRefresh()
  const { updateProductAvailability, createProductAvailability } =
    useAvailabilityApi()
  const { hasPermission } = usePermissions()
  const canManage =
    hasPermission(EmployeeDomains.PRODUCTS_MANAGER) ||
    hasPermission(VendorDomains.VENDOR_AVAILABILITY_MANAGER)
  const [savingGeneral, setSavingGeneral] = useState(false)
  const [activeTabId, setActiveTabId] = useState(GENERAL_TAB_ID)

  // General (static) fields — its own tab with its own save, like the other
  // mixin-enabled entity detail views.
  const initial = useMemo<GeneralForm>(
    () => ({
      stockLevel: record.stockLevel ?? 0,
      distributionChannel: record.distributionChannel,
    }),
    // Include the actual values so a save -> refresh (same id/site, updated data)
    // recomputes initial and reset/discard reflect the persisted values.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
    [record.id, record.site, record.stockLevel, record.distributionChannel]
  )
  const generalMethods = useForm<GeneralForm>({ defaultValues: initial })
  const { control, reset, getValues, formState } = generalMethods

  // Availability has no PATCH — persist the whole record via PUT/POST, merging
  // in whatever the caller changed (General fields or a single mixin schema).
  const persist = useCallback(
    async (payload: Availability) => {
      if (record.id) {
        await updateProductAvailability(productId, record.site, payload)
      } else {
        await createProductAvailability(productId, record.site, payload)
      }
      setRefreshValue()
    },
    [
      record,
      productId,
      updateProductAvailability,
      createProductAvailability,
      setRefreshValue,
    ]
  )

  const saveGeneral = useCallback(async () => {
    const general = getValues()
    setSavingGeneral(true)
    try {
      await persist({
        ...record,
        stockLevel: general.stockLevel,
        distributionChannel: general.distributionChannel as DistributionChannel,
      })
      reset(general)
      toast.showToast(
        t('products.edit.tab.availability.toast.saved'),
        '',
        'success'
      )
    } catch (e) {
      console.error(e)
      toast.showToast(
        t('products.edit.tab.availability.toast.error'),
        '',
        'error'
      )
    } finally {
      setSavingGeneral(false)
    }
  }, [getValues, persist, record, reset, t, toast])

  const saveMixin = useCallback(
    async (data: Mixins, { key, url }: MixinsFormMetadata) => {
      try {
        await persist({
          ...record,
          mixins: { ...record.mixins, [key]: { ...data } },
          metadata: {
            ...record.metadata,
            mixins: { ...record.metadata?.mixins, [key]: url },
          },
        })
        toast.showToast(
          t('products.edit.tab.availability.toast.saved'),
          '',
          'success'
        )
      } catch (e) {
        console.error(e)
        toast.showToast(
          t('products.edit.tab.availability.toast.error'),
          '',
          'error'
        )
      }
    },
    [persist, record, t, toast]
  )

  const { loadMixins, mixinsTabs, mixinsForms } = useMixinsForm({
    type: SchemaType.AVAILABILITY,
    onEdit: saveMixin,
    managerPermissions: canManage,
  })

  // Depend on `record` (not id/site) so a save -> refresh -> freshly-fetched
  // record reloads the mixin forms; otherwise the saved value stays stale until
  // the row is collapsed and re-expanded.
  useEffect(() => {
    ;(async () => {
      await loadMixins(record.metadata?.mixins, record.mixins)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [record])

  useEffect(() => {
    reset(initial)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [initial])

  useEffect(() => {
    onDirtyChange?.(rowKey, formState.isDirty)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [formState.isDirty, rowKey])

  useEffect(() => {
    return () => onDirtyChange?.(rowKey, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [rowKey])

  const generalContent = (
    <SectionBox
      actions={
        <>
          <SecondaryButton
            onClick={() => reset(initial)}
            disabled={!formState.isDirty || !canManage}
          >
            {t('global.discard')}
          </SecondaryButton>
          <PrimaryButton
            className={styles.saveButton}
            onClick={saveGeneral}
            loading={savingGeneral}
            disabled={!formState.isDirty || !canManage}
          >
            {t('global.save')}
          </PrimaryButton>
        </>
      }
    >
      <div className={styles.fields}>
        <Controller
          name="stockLevel"
          control={control}
          render={({ field }) => (
            <InputNumber
              className={styles.field}
              label={t('products.edit.tab.availability.columns.stockLevel')}
              readOnly={!canManage}
              value={field.value}
              onChange={(e) => field.onChange(e.value ?? 0)}
              min={0}
              useGrouping={false}
            />
          )}
        />
        <Controller
          name="distributionChannel"
          control={control}
          render={({ field }) => (
            <Dropdown
              className={styles.field}
              label={t(
                'products.edit.tab.availability.columns.distributionChannel'
              )}
              disabled={!canManage}
              value={field.value}
              options={distributionChannelOptions}
              onChange={(e) => field.onChange(e.value)}
            />
          )}
        />
      </div>
    </SectionBox>
  )

  // Base the layout on whether the record has mixin schemas assigned — a stable
  // signal known immediately and preserved across a save->refresh reload — rather
  // than on `isMixinsLoading`/`mixinsForms.length`, which drop out briefly during
  // the reload and would unmount the TabView (bouncing the user back to General).
  const hasMixins =
    mixinsForms.length > 0 ||
    Object.keys(record.metadata?.mixins ?? {}).some(
      (key) => !key.startsWith('class_')
    )

  // No mixin schema assigned → plain General form, no tabs.
  if (!hasMixins) {
    return <div className={styles.expansion}>{generalContent}</div>
  }

  const generalTab: TabItem = {
    id: GENERAL_TAB_ID,
    label: t('products.edit.tab.availability.record.general'),
    content: generalContent,
  }

  return (
    <div className={styles.expansion}>
      <Tabs
        tabs={[generalTab, ...mixinsTabs]}
        activeTabId={activeTabId}
        onTabChange={setActiveTabId}
      />
    </div>
  )
}

export default AvailabilityRecordExpansion
