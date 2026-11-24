import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useSearchParams } from 'react-router'
import { Tabs, useToast, type TabItem } from '@emporix/component-library'
import HeaderSection from '../components/shared/HeaderSection'
import SitesSelect from '../components/shared/SitesSelect'
import QuotesTabGeneral from '../components/quotes/QuotesTabGeneral'
import QuotesTabProducts from '../components/quotes/QuotesTabProducts'
import QuotesTabPreview from '../components/quotes/QuotesTabPreview'
import QuotesTabApproval from '../components/quotes/QuotesTabApproval'
import QuoteStatusBadge from '../components/quotes/QuoteStatusBadge'
import QuotesTabGeneralStatus from '../components/quotes/QuotesTabGeneralStatus'
import { hasQuoteStatusDetails } from '../helpers/quoteStatus.helpers'
import { getApiErrorDetails } from '../helpers/api'
import EntityChangelogTab from '../components/auditLog/EntityChangelogTab'
import useMixinsForm, {
  MIXINS_LOADING_TAB_ID,
} from '../components/mixins/useMixinsForm'
import type { MixinsFormMetadata } from '../components/mixins/helpers'
import { useTabs } from '../hooks/useTabs'
import { useQuotesApi } from '../hooks/api/quotes'
import { useQuoteData } from '../context/Quote.provider'
import { useSites } from '../context/SitesProvider'
import { useUIBlocker } from '../context/UIBlocker'
import { usePermissions } from '../context/PermissionsProvider'
import { QuoteEditOp, QuoteUpdateRequest } from '../models/Quotes.model'
import { SchemaType } from '../models/Schema.model'
import type { Mixins } from '../models/Mixins.model'
import { EmployeeDomains } from '../configs/accessControls'
import { quotesListPath } from '../constants/paths'
import styles from './Quotes.page.module.scss'

const TABS = ['general', 'products', 'preview', 'approval']
const AUDIT_LOG_TAB = 'audit-log'

/**
 * MD `QuotesAddEditPage`: the quote's tabs (only General before the draft
 * exists), mixin tabs and the audit log. Like MD's TabView, only the active
 * tab is mounted, so each tab loads when it is opened. The host tenant switch
 * is handled by the route, which leaves for the list.
 */
const QuotesAddEditPage = () => {
  const { t } = useTranslation()
  const { quoteId } = useParams()
  const [searchParams] = useSearchParams()
  const { quote, isQuoteCompleted, refreshData } = useQuoteData()
  const { updateCurrentSite, sites } = useSites()
  const toast = useToast()
  const { blockPanel } = useUIBlocker()
  const { updateQuote } = useQuotesApi()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.QUOTES_MANAGER)
  const canViewAuditLog = hasPermission(EmployeeDomains.AUDIT_LOG_VIEWER)

  // The mixin forms load for each loaded quote, also after a save refreshed
  // it. MD keyed this on `refreshData`, which is new on every render, so it
  // requested the schemas and references again on every render.
  useEffect(() => {
    if (!quote) return
    loadMixins(quote.metadata.mixins as Record<string, string>, quote.mixins)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `loadMixins` is new on every render
  }, [quote])

  // Opening a quote switches the selected site to the quote's site.
  useEffect(() => {
    if (!quote || !sites) return
    const site = sites.find((site) => site.code === quote.siteCode)
    if (site) {
      updateCurrentSite(site)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [quote, sites])

  const getQuoteSubtitle = () => {
    if (quote && isQuoteCompleted) {
      return (
        <div className={styles.subtitle}>
          {quoteId}
          <QuoteStatusBadge
            className={styles.statusBadge}
            status={quote.status.value}
          />
        </div>
      )
    } else {
      return quoteId
    }
  }

  const saveMixin = async (data: Mixins, mixinMetadata: MixinsFormMetadata) => {
    if (!quote?.id) return
    const { key, url } = mixinMetadata
    const updateOperation: QuoteUpdateRequest[] = [
      {
        op: QuoteEditOp.add,
        path: `/mixins/${key}`,
        value: data,
      },
    ]
    if (mixinMetadata !== null) {
      updateOperation.push({
        op: QuoteEditOp.add,
        path: `/metadata/mixins/${key}`,
        value: url,
      })
    }
    blockPanel(true)
    try {
      await updateQuote(quote.id, updateOperation)
      toast.showToast(t('quotes.toasts.successUpdate'), '', 'success')
      refreshData()
    } catch (e: unknown) {
      console.error(e)
      toast.showError(t('quotes.toasts.errorUpdate'), getApiErrorDetails(e))
    } finally {
      blockPanel(false)
    }
  }

  const { loadMixins, mixinsTabs, isMixinsLoading } = useMixinsForm({
    type: SchemaType.QUOTE,
    onEdit: saveMixin,
    // A completed quote is read-only on every tab (MD left the mixins
    // editable).
    managerPermissions: canManage && !isQuoteCompleted,
  })

  // Keyed on the ids: the mixin tabs are rebuilt on every render (MD passes a
  // new `onEdit` each time), the tab list only changes with them.
  const mixinTabIds = JSON.stringify(mixinsTabs.map((tab) => tab.id))
  const tabIds = useMemo(
    () => [
      ...TABS,
      ...(JSON.parse(mixinTabIds) as string[]),
      ...(canViewAuditLog ? [AUDIT_LOG_TAB] : []),
    ],
    [mixinTabIds, canViewAuditLog]
  )
  const { activeTab, onTabChange } = useTabs(tabIds, true)

  // While the mixins load, a `?tab=<mixin>` has no tab yet: keep the loading
  // placeholder selected instead of opening General (an index like MD's
  // `?tab=4` resolves on its own, as in MD).
  const urlTab = searchParams.get('tab')
  // Follow the URL as soon as its tab exists. `useTabs` syncs its state in an
  // effect, so right after a mixins reload it still points at General for one
  // render, which would mount General and send its requests (MD's index-based
  // TabView stayed on the tab).
  const urlTabId = !urlTab
    ? undefined
    : /^\d+$/.test(urlTab)
      ? tabIds[Number(urlTab)]
      : tabIds.includes(urlTab)
        ? urlTab
        : undefined
  const activeTabId =
    isMixinsLoading &&
    urlTab &&
    !/^\d+$/.test(urlTab) &&
    !tabIds.includes(urlTab)
      ? MIXINS_LOADING_TAB_ID
      : (urlTabId ?? activeTab ?? TABS[0])

  const tabs: TabItem[] = [
    {
      id: 'general',
      label: t('quotes.tabs.general.title'),
      content: <QuotesTabGeneral />,
    },
    {
      id: 'products',
      label: t('quotes.tabs.products.title'),
      disabled: !quoteId,
      content: <QuotesTabProducts />,
    },
    {
      id: 'preview',
      label: t('quotes.tabs.preview.title'),
      disabled: !quoteId,
      content: <QuotesTabPreview />,
    },
    {
      id: 'approval',
      label: t('quotes.tabs.approval.title'),
      disabled: !quoteId,
      content: <QuotesTabApproval />,
    },
    ...mixinsTabs,
    ...(canViewAuditLog
      ? [
          {
            id: AUDIT_LOG_TAB,
            label: t('auditLog.entityChangelog.tab'),
            disabled: !quoteId,
            // Only the active tab is mounted, so the log is active whenever
            // it renders.
            content: quoteId ? (
              <EntityChangelogTab entity="quote" entityId={quoteId} isActive />
            ) : null,
          },
        ]
      : []),
  ]

  return (
    <>
      <HeaderSection
        title={t('quotes.singular')}
        subtitle={getQuoteSubtitle()}
        backTo={quotesListPath()}
      >
        <div className={styles.siteSelect}>
          <SitesSelect disabled={!!quote} />
        </div>
      </HeaderSection>
      <div className={styles.tabs}>
        {quote && hasQuoteStatusDetails(quote.status) && (
          // Above the tabs, so the status message shows on every tab (MD had
          // it on the General tab only; COP-7116 QA).
          <QuotesTabGeneralStatus className={styles.statusBox} quote={quote} />
        )}
        <Tabs
          data-testid="quote-tabs"
          scrollable
          tabs={tabs}
          activeTabId={activeTabId}
          onTabChange={onTabChange}
        />
      </div>
    </>
  )
}

export default QuotesAddEditPage
