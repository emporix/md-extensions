import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useParams, useSearchParams } from 'react-router'
import { FormProvider, useForm } from 'react-hook-form'
import {
  PrimaryButton,
  SecondaryButton,
  SectionBox,
  Tabs,
  useToast,
  type TabItem,
} from '@emporix/component-library'

import HeaderSection from '../components/shared/HeaderSection'
import SitesGeneralForm from '../components/sites/SitesGeneralForm'
import SitesAddressForm from '../components/sites/SitesAddressForm'
import SitesCoordinatesForm from '../components/sites/SitesCoordinatesForm'
import SitesAssistedBuyingForm from '../components/sites/SitesAssistedBuyingForm'
import { useCanManageSites } from '../components/sites/useCanManageSites'
import EntityChangelogTab from '../components/auditLog/EntityChangelogTab'
import useMixinsForm, {
  MIXINS_LOADING_TAB_ID,
} from '../components/mixins/useMixinsForm'
import type { MixinsFormMetadata } from '../components/mixins/helpers'
import { useSiteSettingsApi } from '../hooks/api/sites'
import { useNotifySitesChanged } from '../hooks/useNotifySitesChanged'
import { useTabs } from '../hooks/useTabs'
import useCustomNavigate from '../hooks/useCustomNavigate'
import { useUIBlocker } from '../context/UIBlcoker'
import { usePermissions } from '../context/PermissionsProvider'
import { useFeatureToggles } from '../context/FeatureTogglesProvider'
import { useDashboardContext } from '../context/Dashboard.context'
import { EmployeeDomains } from '../configs/accessControls'
import {
  createRequestTracker,
  getApiErrorDetails,
  loadLatest,
} from '../helpers/api'
import {
  createForm,
  mapToForm,
  mapToPayload,
  mapToUpdatePayload,
  SiteFormFields,
} from '../helpers/sites.helpers'
import type { Site, SitePatch } from '../models/Site.model'
import type { Mixins } from '../models/Mixins.model'
import { SchemaType } from '../models/Schema.model'
import { siteDetailPath, sitesListPath } from '../constants/paths'
import styles from './SiteAddEditPage.module.scss'

/** Site mixins hidden while the `filter-site-mixins` toggle is on (MD). */
export const EXCLUDED_MIXIN_IDS = [
  'customerSettings',
  'orderProcessSettings',
  'merchantInfo',
  'productSettings',
  'feeService',
  'imageSize',
  'couponSettings',
  'hubspotProperties',
  'linkablePages',
  'mapsApiKey',
]

export const FILTER_SITE_MIXINS_FEATURE_TOGGLE = 'filter-site-mixins'
const DETAILS_TAB = 'details'
const AUDIT_LOG_TAB = 'audit-log'

const SiteAddEdit = () => {
  const { t } = useTranslation()
  const { siteCode } = useParams()
  const [searchParams] = useSearchParams()
  const { navigate } = useCustomNavigate()
  const { showSuccess, showError } = useToast()
  const { blockPanel } = useUIBlocker()
  const { hasPermission } = usePermissions()
  const canManage = useCanManageSites()
  const canViewAuditLog = hasPermission(EmployeeDomains.AUDIT_LOG_VIEWER)
  const toggles = useFeatureToggles()
  const { createSite, editSite, getSite, patchSite } = useSiteSettingsApi()
  const notifySitesChanged = useNotifySitesChanged()
  const trackRequest = useRef(createRequestTracker()).current

  const methods = useForm<SiteFormFields>({
    mode: 'onChange',
    defaultValues: createForm(),
  })
  const { handleSubmit, formState, reset } = methods
  const [site, setSite] = useState<Site>()

  const saveMixinRef = useRef<
    (data: Mixins, mixinMetadata: MixinsFormMetadata) => Promise<void>
  >(async () => undefined)
  const { loadMixins, mixinsTabs, isMixinsLoading } = useMixinsForm({
    type: SchemaType.SITE,
    onEdit: (data, mixinMetadata) => saveMixinRef.current(data, mixinMetadata),
    managerPermissions: canManage,
  })

  const applySite = useCallback(
    (loaded: Site) => {
      void loadMixins(
        (loaded.metadata?.mixins ?? {}) as Record<string, string>,
        (loaded.mixins ?? {}) as Mixins
      )
      reset(mapToForm(loaded))
      setSite(loaded)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadMixins is not stable
    [reset]
  )

  const reloadData = useCallback(
    async (code: string) => {
      await loadLatest(
        trackRequest,
        () => getSite(code),
        applySite,
        (e) => {
          showError(t('sites.toasts.errorFetchSite'), getApiErrorDetails(e))
        }
      )
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- toast helpers are not stable
    [getSite, applySite, trackRequest]
  )

  useEffect(() => {
    if (!siteCode) return
    blockPanel(true)
    void reloadData(siteCode).finally(() => blockPanel(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteCode])

  saveMixinRef.current = async (data, mixinMetadata) => {
    if (!siteCode) return
    const { key, url } = mixinMetadata
    const patch: SitePatch = {
      mixins: { ...(site?.mixins ?? {}), [key]: data },
      metadata: { mixins: { [key]: url } },
    }
    blockPanel(true)
    try {
      await patchSite(siteCode, patch)
      showSuccess(t('sites.toasts.successUpdateSite'))
      notifySitesChanged()
      await reloadData(siteCode)
    } catch (e: unknown) {
      showError(t('sites.toasts.errorUpdateSite'), getApiErrorDetails(e))
    } finally {
      blockPanel(false)
    }
  }

  const submitCreateSite = async (data: SiteFormFields) => {
    blockPanel(true)
    try {
      const newSiteCode = await createSite(mapToPayload(data))
      showSuccess(t('sites.toasts.successCreateSite'))
      notifySitesChanged()
      navigate(siteDetailPath(newSiteCode), { replace: true })
    } catch (e: unknown) {
      showError(t('sites.toasts.errorCreateSite'), getApiErrorDetails(e))
    } finally {
      blockPanel(false)
    }
  }

  const submitEditSite = async (data: SiteFormFields) => {
    if (!siteCode) return
    blockPanel(true)
    try {
      await editSite(siteCode, mapToUpdatePayload(site, data))
      showSuccess(t('sites.toasts.successUpdateSite'))
      notifySitesChanged()
      await reloadData(siteCode)
    } catch (e: unknown) {
      showError(t('sites.toasts.errorUpdateSite'), getApiErrorDetails(e))
    } finally {
      blockPanel(false)
    }
  }

  const visibleMixinsTabs = useMemo(
    () =>
      toggles.isToggleValid(FILTER_SITE_MIXINS_FEATURE_TOGGLE)
        ? mixinsTabs.filter((tab) => !EXCLUDED_MIXIN_IDS.includes(tab.id))
        : mixinsTabs,
    [mixinsTabs, toggles]
  )

  const tabIds = useMemo(
    () => [
      DETAILS_TAB,
      ...visibleMixinsTabs.map((tab) => tab.id),
      ...(canViewAuditLog ? [AUDIT_LOG_TAB] : []),
    ],
    [visibleMixinsTabs, canViewAuditLog]
  )
  const { activeTab, onTabChange } = useTabs(tabIds, true)
  // While mixins (re)load, a `?tab=<mixin>` URL has no matching tab yet:
  // keep the loading placeholder selected instead of jumping to the details.
  const urlTab = searchParams.get('tab')
  const activeTabId =
    isMixinsLoading && urlTab && !tabIds.includes(urlTab)
      ? MIXINS_LOADING_TAB_ID
      : (activeTab ?? DETAILS_TAB)

  const details = (
    <div className={styles.sections}>
      <SectionBox name={t('sites.general')}>
        <SitesGeneralForm />
      </SectionBox>
      <SectionBox name={t('sites.address')}>
        <SitesAddressForm />
      </SectionBox>
      <SectionBox name={t('sites.coordinates')}>
        <SitesCoordinatesForm />
      </SectionBox>
      <SectionBox name={t('sites.assistedBuying')}>
        <SitesAssistedBuyingForm />
      </SectionBox>
    </div>
  )

  const tabs: TabItem[] = siteCode
    ? [
        { id: DETAILS_TAB, label: t('sites.details'), content: details },
        ...visibleMixinsTabs,
        ...(canViewAuditLog
          ? [
              {
                id: AUDIT_LOG_TAB,
                label: t('auditLog.entityChangelog.tab'),
                content: (
                  <EntityChangelogTab
                    entity="site"
                    entityId={siteCode}
                    isActive={activeTabId === AUDIT_LOG_TAB}
                  />
                ),
              },
            ]
          : []),
      ]
    : []

  return (
    <FormProvider {...methods}>
      <HeaderSection
        title={t('sites.singular')}
        subtitle={siteCode && site?.name}
        backTo={sitesListPath()}
        moduleActions={
          <div className={styles.actions}>
            <SecondaryButton
              data-testid="site-discard"
              disabled={!formState.isDirty}
              onClick={() => reset()}
            >
              {t('global.discard')}
            </SecondaryButton>
            <PrimaryButton
              data-testid="site-save"
              disabled={!formState.isValid || !formState.isDirty || !canManage}
              onClick={handleSubmit(
                siteCode ? submitEditSite : submitCreateSite
              )}
            >
              {t('global.save')}
            </PrimaryButton>
          </div>
        }
      />
      {siteCode ? (
        <Tabs
          data-testid="site-tabs"
          scrollable
          keepMounted
          tabs={tabs}
          activeTabId={activeTabId}
          onTabChange={onTabChange}
        />
      ) : (
        details
      )}
    </FormProvider>
  )
}

/**
 * The key remounts the page per site (and for `add`), so no form state leaks
 * from one site into the next (create → edit). A host tenant switch leaves
 * the page for the list: the site belongs to the previous tenant.
 */
const SiteAddEditPage = () => {
  const { siteCode } = useParams()
  const { tenant } = useDashboardContext()
  const openedForTenant = useRef(tenant)

  if (tenant !== openedForTenant.current) {
    return <Navigate to={sitesListPath()} replace />
  }

  return <SiteAddEdit key={siteCode ?? 'add'} />
}

export default SiteAddEditPage
