import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DataTable,
  DotIndicator,
  FilterMatchMode,
  useToast,
  type DataTableColumnFilterElementOptions,
  type DataTableColumnProps,
} from '@emporix/component-library'

import { createRequestTracker, getApiErrorDetails } from '../../helpers/api'
import type { Site } from '../../models/Site.model'
import { useSiteSettingsApi } from '../../hooks/api/sites'
import { useNotifySitesChanged } from '../../hooks/useNotifySitesChanged'
import { useRefresh } from '../../context/RefreshValuesProvider'
import { usePermissions } from '../../context/PermissionsProvider'
import { useDashboardContext } from '../../context/Dashboard.context'
import { useUIBlocker } from '../../context/UIBlcoker'
import useCustomNavigate from '../../hooks/useCustomNavigate'
import TableActions from '../shared/TableActions'
import BatchDeleteButton from '../shared/BatchDeleteButton'
import BooleanFilter from './BooleanFilter'
import { EmployeeDomains } from '../../configs/accessControls'
import { siteDetailPath } from '../../constants/paths'
import styles from './SitesTable.module.scss'

const TABLE_NAME = 'sites.table'

const textFilter = (
  field: string,
  placeholder: string
): Partial<DataTableColumnProps> => ({
  filter: true,
  filterField: field,
  filterMatchMode: FilterMatchMode.CONTAINS,
  filterPlaceholder: placeholder,
  showFilterMenu: false,
  showClearButton: false,
})

/**
 * Client-side table like MD: one call returns every site of the tenant
 * (inactive ones for a Sites Manager only); filter and sort run on the rows.
 */
const SitesTable = () => {
  const { t, i18n } = useTranslation()
  const { showSuccess, showError } = useToast()
  const { refresh, setRefreshValue } = useRefresh()
  const { blockPanel } = useUIBlocker()
  const { navigate } = useCustomNavigate()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.SITES_MANAGER)
  const { tenant } = useDashboardContext()
  const { getAllSites, deleteSite } = useSiteSettingsApi()
  const notifySitesChanged = useNotifySitesChanged()

  const [sites, setSites] = useState<Site[]>([])
  const [selected, setSelected] = useState<Site[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const trackRequest = useRef(createRequestTracker()).current

  useEffect(() => {
    // Rows and selection belong to the previous tenant; a batch delete must
    // not send their codes to the new one.
    setSelected([])
    setSites([])
  }, [tenant])

  useEffect(() => {
    // The host switches tenant without remounting this remote; only the
    // latest request may fill the table.
    const isLatest = trackRequest()
    setIsLoading(true)
    getAllSites(canManage)
      .then((data) => {
        if (isLatest()) setSites(data)
      })
      .catch((e: unknown) => {
        if (!isLatest()) return
        setSites([])
        showError(t('sites.toasts.errorFetchSites'), getApiErrorDetails(e))
      })
      .finally(() => {
        if (isLatest()) setIsLoading(false)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant, refresh, canManage])

  /**
   * One after another with a toast per site, as MD did. The default site
   * cannot be deleted: the run stops there (MD), but the page is unblocked
   * and the selection cleared either way.
   */
  const deleteSites = async (toDelete: Site[]) => {
    setIsDeleting(true)
    let deletedAny = false
    try {
      for (const site of toDelete) {
        if (site.default) {
          showError(t('sites.toasts.errorDeleteDefaultSite'))
          break
        }
        blockPanel(true)
        try {
          await deleteSite(site.code)
          deletedAny = true
          showSuccess(t('sites.toasts.successDeleteSite', { name: site.name }))
        } catch (e: unknown) {
          showError(t('sites.toasts.errorDeleteSite'), getApiErrorDetails(e))
        } finally {
          blockPanel(false)
        }
      }
    } finally {
      setSelected([])
      setIsDeleting(false)
      if (deletedAny) {
        setRefreshValue()
        notifySitesChanged()
      }
    }
  }

  const openSite = (site: Site) => {
    navigate(siteDetailPath(site.code))
  }

  const activeOptions = useMemo(
    () => [
      { label: t('global.active'), value: true },
      { label: t('global.inactive'), value: false },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [i18n.language, t]
  )

  const columns: DataTableColumnProps[] = useMemo(
    () => [
      {
        columnKey: 'code',
        header: t(`${TABLE_NAME}.code`),
        field: 'code',
        sortable: true,
        ...textFilter('code', t(`${TABLE_NAME}.filters.code`)),
        body: (site: Site) => (
          <div>
            {site.code}
            {site.default && ` (${t('global.default').toLowerCase()})`}
          </div>
        ),
      },
      {
        columnKey: 'name',
        header: t(`${TABLE_NAME}.name`),
        field: 'name',
        sortable: true,
        style: { width: '25%' },
        ...textFilter('name', t(`${TABLE_NAME}.filters.name`)),
      },
      {
        columnKey: 'languages',
        header: t(`${TABLE_NAME}.languages`),
        field: 'languages',
        ...textFilter('languages', t(`${TABLE_NAME}.filters.languages`)),
        body: (site: Site) => (
          <div className={styles.tags}>
            {(site.languages ?? []).map((language) => (
              <span
                key={language}
                className={`${styles.tag} ${styles.languageTag}`}
              >
                {language.toUpperCase()}
              </span>
            ))}
          </div>
        ),
      },
      {
        columnKey: 'currency',
        header: t(`${TABLE_NAME}.currency`),
        field: 'currency',
        ...textFilter('currency', t(`${TABLE_NAME}.filters.currency`)),
      },
      {
        columnKey: 'shipTo',
        header: t(`${TABLE_NAME}.shipTo`),
        field: 'shipToCountries',
        ...textFilter('shipToCountries', t(`${TABLE_NAME}.filters.shipTo`)),
        body: (site: Site) => (
          <div className={styles.tags}>
            {(site.shipToCountries ?? []).map((country) => (
              <span
                key={country}
                className={`${styles.tag} ${styles.countryTag}`}
              >
                {country.toUpperCase()}
              </span>
            ))}
          </div>
        ),
      },
      {
        columnKey: 'active',
        header: t(`${TABLE_NAME}.active`),
        field: 'active',
        dataType: 'boolean',
        sortable: true,
        filter: true,
        filterField: 'active',
        filterMatchMode: FilterMatchMode.EQUALS,
        showFilterMenu: false,
        showClearButton: false,
        headerClassName: styles.activeColumn,
        filterElement: (options: DataTableColumnFilterElementOptions) => (
          <BooleanFilter filterOptions={options} options={activeOptions} />
        ),
        body: (site: Site) => (
          <DotIndicator
            value={Boolean(site.active)}
            label={t(site.active ? 'global.active' : 'global.inactive')}
          />
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [i18n.language, t, activeOptions]
  )

  return (
    <>
      <div className={styles.toolbar}>
        <BatchDeleteButton
          selected={selected}
          onDelete={() => deleteSites(selected)}
          isDeleting={isDeleting}
          pluralsPath="sites"
          disabled={!canManage}
          singularName={selected[0]?.name}
        />
      </div>
      <DataTable
        dataKey="code"
        value={sites}
        columns={columns}
        lazy={false}
        loading={isLoading}
        selectionMode="multiple"
        selection={selected}
        onSelectionChange={(selection) => setSelected(selection as Site[])}
        rowActions={(site: Site) => (
          <TableActions
            managerPermission={canManage}
            onEdit={() => openSite(site)}
            onDelete={() => deleteSites([site])}
            deleteConfirm={{ pluralsPath: 'sites', entityLabel: site.name }}
          />
        )}
        onRowClick={openSite}
        emptyMessage={t('global.noDataFound')}
        data-testid="sites-table"
      />
    </>
  )
}

export default SitesTable
