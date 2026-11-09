import { useCallback, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useSearchParams } from 'react-router'
import { FormProvider, useForm } from 'react-hook-form'
import {
  ProgressSpinner,
  Tabs,
  useToast,
  type TabItem,
} from '@emporix/component-library'
import HeaderSection from '../components/shared/HeaderSection'
import useMixinsForm, {
  MIXINS_LOADING_TAB_ID,
} from '../components/mixins/useMixinsForm'
import type { MixinsFormMetadata } from '../components/mixins/helpers'
import EntityChangelogTab from '../components/auditLog/EntityChangelogTab'
import CouponAddEditActions from '../components/coupons/CouponAddEditActions'
import CouponGeneralForm from '../components/coupons/CouponGeneralForm'
import CouponDiscountForm from '../components/coupons/CouponDiscountForm'
import CouponRulesForm from '../components/coupons/CouponRulesForm'
import { useTabs } from '../hooks/useTabs'
import { useCouponsApi } from '../hooks/api/coupons'
import useCouponPermissions from '../hooks/useCouponPermissions'
import { useUIBlocker } from '../context/UIBlcoker'
import { useCouponData } from '../context/Coupon.provider'
import type { Mixins } from '../models/Mixins.model'
import { SchemaType } from '../models/Schema.model'
import { couponsListPath } from '../constants/paths'
import {
  CouponFormFields,
  createCouponForm,
  mapCouponToForm,
} from '../helpers/couponForm.helpers'
import {
  CouponTab,
  getCouponErrorMessage,
} from '../helpers/couponErrors.helpers'
import styles from './Coupon.page.module.scss'

const TABS: CouponTab[] = ['general', 'types', 'rules']
const AUDIT_LOG_TAB = 'audit-log'

const CouponPage = () => {
  const { t, i18n } = useTranslation()
  const { code } = useParams()
  const [searchParams] = useSearchParams()
  const { coupon, syncCoupon } = useCouponData()
  const { canManage, canViewAuditLog } = useCouponPermissions()
  const { patchCoupon } = useCouponsApi()
  const { blockPanel } = useUIBlocker()
  const { showSuccess, showError } = useToast()

  const methods = useForm<CouponFormFields>({
    defaultValues: createCouponForm(),
  })
  const { isDirty } = methods.formState

  useEffect(() => {
    if (!coupon || isDirty) return
    methods.reset(mapCouponToForm(coupon))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity: reset on load only
  }, [coupon])

  const saveMixin = useCallback(
    async (data: Mixins, { key, url }: MixinsFormMetadata) => {
      if (!coupon) return
      blockPanel(true)
      try {
        await patchCoupon(
          {
            mixins: { ...coupon.mixins, [key]: data },
            metadata: { mixins: { ...coupon.metadata?.mixins, [key]: url } },
          },
          coupon.code
        )
        showSuccess(t('coupons.edit.toast.update.success'))
        await syncCoupon()
      } catch (e: unknown) {
        console.error(e)
        showError(
          t('coupons.edit.toast.mixinSave.error'),
          getCouponErrorMessage(e)
        )
      } finally {
        blockPanel(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
    [coupon, i18n.language]
  )

  const { loadMixins, mixinsTabs, isMixinsLoading } = useMixinsForm({
    type: SchemaType.COUPON,
    onEdit: saveMixin,
    managerPermissions: canManage,
  })

  // Reload mixin tabs only when their data changes, so saving the coupon itself
  // does not discard unsaved edits in a mixin tab.
  const mixinsKey = coupon
    ? JSON.stringify([
        coupon.code,
        coupon.mixins ?? {},
        coupon.metadata?.mixins ?? {},
      ])
    : undefined

  useEffect(() => {
    if (!coupon) return
    void loadMixins(
      (coupon.metadata?.mixins ?? {}) as Record<string, string>,
      (coupon.mixins ?? {}) as Mixins
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on the mixin data
  }, [mixinsKey])

  const editMixinsTabs = useMemo(
    () => (code ? mixinsTabs : []),
    [code, mixinsTabs]
  )
  const showAuditLog = canViewAuditLog

  const tabIds = useMemo(
    () => [
      ...TABS,
      ...editMixinsTabs.map((tab) => tab.id),
      ...(showAuditLog ? [AUDIT_LOG_TAB] : []),
    ],
    [editMixinsTabs, showAuditLog]
  )
  const { activeTab, onTabChange } = useTabs(tabIds, true)

  // While mixins (re)load, a `?tab=<mixin>` URL has no matching tab yet:
  // keep the loading placeholder selected instead of jumping to General.
  const urlTab = searchParams.get('tab')
  const activeTabId =
    isMixinsLoading && urlTab && !tabIds.includes(urlTab)
      ? MIXINS_LOADING_TAB_ID
      : (activeTab ?? TABS[0])

  const tabs: TabItem[] = useMemo(() => {
    const items: TabItem[] = [
      {
        id: 'general',
        label: t('coupons.edit.tab.details.title'),
        content: <CouponGeneralForm />,
      },
      {
        id: 'types',
        label: t('coupons.edit.tab.type.title'),
        content: <CouponDiscountForm />,
      },
      {
        id: 'rules',
        label: t('coupons.edit.tab.rules.title'),
        content: <CouponRulesForm />,
      },
      ...editMixinsTabs,
    ]
    if (showAuditLog) {
      items.push({
        id: AUDIT_LOG_TAB,
        label: t('auditLog.entityChangelog.tab'),
        disabled: !code,
        content: code ? (
          <EntityChangelogTab
            entity="coupon"
            entityId={code}
            isActive={activeTabId === AUDIT_LOG_TAB}
          />
        ) : null,
      })
    }
    return items
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rebuilt per language and tab state
  }, [i18n.language, editMixinsTabs, showAuditLog, code, activeTabId])

  if (code && !coupon) {
    return <ProgressSpinner />
  }

  return (
    <FormProvider {...methods}>
      <HeaderSection
        title={t('coupons.singular')}
        subtitle={code ? coupon?.name : undefined}
        backTo={couponsListPath()}
        moduleActions={
          <CouponAddEditActions onShowTab={(tab) => onTabChange(tab)} />
        }
      />
      <div className={styles.tabs}>
        <Tabs
          data-testid="coupon-tabs"
          scrollable
          keepMounted
          tabs={tabs}
          activeTabId={activeTabId}
          onTabChange={onTabChange}
        />
      </div>
    </FormProvider>
  )
}

export default CouponPage
