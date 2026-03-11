import { useMemo, useState, useCallback, useRef } from 'react'
import { Button } from 'primereact/button'
import { Toast } from 'primereact/toast'

import type { AppState } from '../../shared/models/AppState.model'
import { useTranslation } from '../../shared/i18n'
import {
  DashboardProvider,
  useDashboardContext,
} from '../context/DashboardContext'
import { DashboardToolbar } from '../components/DashboardToolbar'
import { DashboardGrid } from '../components/DashboardGrid'
import { WIDGET_REGISTRY, getAvailableWidgetIds } from '../data/widgetRegistry'
import { useSites } from '../hooks/useSites'
import { useDashboardLayout } from '../hooks/useDashboardLayout'
import {
  addWidget,
  removeWidget,
  clearLayoutFromLocalStorage,
} from '../helpers/layout.helpers'
import { DEFAULT_GRID_LAYOUT } from '../data/defaultLayout'
import styles from './DashboardPage.module.scss'

const DashboardContent = () => {
  const { appState, site, timeRange, setSite, setTimeRange } =
    useDashboardContext()
  const { t } = useTranslation(appState?.language ?? 'en')
  const {
    sites,
    loading: sitesLoading,
    error: sitesError,
  } = useSites(appState?.tenant, appState?.token)
  const {
    layout,
    setLayout,
    loading: layoutLoading,
    loadError: layoutLoadError,
    saveError: layoutSaveError,
    clearSaveError,
    saveToGlobal,
    saveToLocalStorage,
    savingGlobal,
  } = useDashboardLayout(appState?.tenant, appState?.token, DEFAULT_GRID_LAYOUT)

  const canSaveGlobal =
    appState?.permissions?.systemPreferences?.manager === true
  const [isEditMode, setIsEditMode] = useState(false)
  const toastRef = useRef<Toast>(null)

  const handleAddWidget = useCallback(
    (widgetId: string) => {
      setLayout((prev) => addWidget(prev, widgetId))
    },
    [setLayout]
  )

  const handleRemoveWidget = useCallback(
    (widgetId: string) => {
      setLayout((prev) => removeWidget(prev, widgetId))
    },
    [setLayout]
  )

  const handleResetToDefaults = useCallback(() => {
    clearLayoutFromLocalStorage()
    setLayout(DEFAULT_GRID_LAYOUT.map((item) => ({ ...item })))
    if (canSaveGlobal) {
      saveToGlobal(DEFAULT_GRID_LAYOUT.map((item) => ({ ...item })))
    }
  }, [setLayout, canSaveGlobal, saveToGlobal])

  const layoutIds = useMemo(
    () => new Set(layout.map((item) => item.i)),
    [layout]
  )
  const availableToAdd = useMemo(
    () => getAvailableWidgetIds().filter((id) => !layoutIds.has(id)),
    [layoutIds]
  )

  return (
    <div className={styles.page}>
      <Toast ref={toastRef} />
      <header className={styles.header}>
        <div className={styles.headerRow}>
          <DashboardToolbar
            sites={sites}
            selectedSite={site}
            onSiteChange={setSite}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
            sitesLoading={sitesLoading}
            sitesError={sitesError}
          />
          <div className={styles.headerActions}>
            {layoutLoading && (
              <span className={styles.layoutLoading} aria-live="polite">
                {t('dashboard.loadingLayout')}
              </span>
            )}
            {layoutLoadError && (
              <span className={styles.layoutError} role="alert">
                {layoutLoadError}
              </span>
            )}
            {isEditMode && availableToAdd.length > 0 && (
              <select
                className={styles.addWidgetSelect}
                value=""
                onChange={(e) => {
                  const id = e.target.value
                  if (id) {
                    handleAddWidget(id)
                    e.target.value = ''
                  }
                }}
                aria-label={t('dashboard.addWidget')}
              >
                <option value="">{t('dashboard.addWidgetPlaceholder')}</option>
                {availableToAdd.map((id) => (
                  <option key={id} value={id}>
                    {t(`widgets.${id}`)}
                  </option>
                ))}
              </select>
            )}
            {isEditMode && (
              <>
                <Button
                  type="button"
                  className="p-button-secondary"
                  icon="pi pi-refresh"
                  label={t('dashboard.resetToDefaults')}
                  onClick={handleResetToDefaults}
                  aria-label={t('dashboard.resetLayoutAria')}
                />
                <Button
                  type="button"
                  className="p-button-secondary"
                  icon="pi pi-cloud"
                  label={t('dashboard.saveCustomConfiguration')}
                  onClick={() => {
                    saveToLocalStorage(layout)
                    toastRef.current?.show({
                      severity: 'success',
                      summary: t('dashboard.saveCustomConfiguration'),
                      detail: t('dashboard.toastConfigSavedCustom'),
                    })
                  }}
                  disabled={savingGlobal}
                  aria-label={t('dashboard.saveCustomConfigurationAria')}
                />
                {canSaveGlobal && (
                  <Button
                    type="button"
                    className="p-button-primary"
                    icon="pi pi-globe"
                    label={t('dashboard.saveGlobalConfiguration')}
                    onClick={() => {
                      saveToGlobal(layout).then(() => {
                        toastRef.current?.show({
                          severity: 'success',
                          summary: t('dashboard.saveGlobalConfiguration'),
                          detail: t('dashboard.toastConfigSavedGlobal'),
                        })
                      })
                    }}
                    loading={savingGlobal}
                    disabled={savingGlobal}
                    aria-label={t('dashboard.saveGlobalConfigurationAria')}
                  />
                )}
              </>
            )}
            <Button
              type="button"
              className="p-button-secondary"
              icon={isEditMode ? 'pi pi-arrow-left' : 'pi pi-cog'}
              label={
                isEditMode ? t('dashboard.back') : t('dashboard.customize')
              }
              onClick={() => setIsEditMode((v) => !v)}
              aria-pressed={isEditMode}
              aria-label={
                isEditMode
                  ? t('dashboard.backFromCustomize')
                  : t('dashboard.customizeDashboard')
              }
            />
          </div>
        </div>
      </header>

      {layoutSaveError && (
        <div className={styles.saveErrorBanner} role="alert">
          <span>{layoutSaveError}</span>
          <Button
            type="button"
            className="p-button-text p-button-sm"
            label={t('dashboard.dismiss')}
            onClick={clearSaveError}
            aria-label={t('dashboard.dismissSaveError')}
          />
        </div>
      )}

      <div
        className={styles.gridRegion}
        role="region"
        aria-label={t('dashboard.widgetsRegion')}
      >
        <DashboardGrid
          layout={layout}
          onLayoutChange={setLayout}
          widgets={WIDGET_REGISTRY}
          isEditMode={isEditMode}
          onRemoveWidget={handleRemoveWidget}
          t={t}
        />
      </div>
    </div>
  )
}

type DashboardPageProps = {
  appState?: AppState
}

export const DashboardPage = ({ appState }: DashboardPageProps) => {
  const dashboardAppState = appState
    ? {
        tenant: appState.tenant,
        language: appState.language,
        token: appState.token,
        currency: appState.currency?.id,
        permissions: appState.permissions,
      }
    : null

  return (
    <DashboardProvider appState={dashboardAppState}>
      <DashboardContent />
    </DashboardProvider>
  )
}
