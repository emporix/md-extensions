import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router'
import { Controller, useForm } from 'react-hook-form'
import {
  Calendar,
  Checkbox,
  Divider,
  Dropdown,
  FieldLabel,
  InputText,
  PrimaryButton,
  SecondaryButton,
  SectionBox,
  Tabs,
  useToast,
  type TabItem,
} from '@emporix/component-library'

import HeaderSection from '../components/shared/HeaderSection'
import FormGrid from '../components/shared/FormGrid'
import LocalizedInput from '../components/shared/LocalizedInput'
import CategoriesSelector from '../components/shared/CategoriesSelector'
import {
  createRequestTracker,
  getApiErrorDetails,
  loadLatest,
  makeCall,
} from '../helpers/api'
import { getLocaleHourFormat } from '../helpers/date'
import { useDashboardContext } from '../context/Dashboard.context'
import { useUIBlocker } from '../context/UIBlcoker'
import { usePermissions } from '../context/PermissionsProvider'
import { useRefresh } from '../context/RefreshValuesProvider'
import { useSites } from '../context/SitesProvider'
import { useCatalogsApi } from '../hooks/api/catalogs'
import useCustomNavigate from '../hooks/useCustomNavigate'
import { useLocalizedValue } from '../hooks/useLocalizedValue'
import { useTabs } from '../hooks/useTabs'
import {
  createCatalogForm,
  hasName,
  toCatalogPayload,
  type Catalog,
  type CatalogFormFields,
} from '../models/Catalog.model'
import { EmployeeDomains } from '../configs/accessControls'
import { catalogDetailPath, listPath } from '../constants/paths'
import styles from './CatalogPage.module.scss'

/** MD tab ids, kept for `?tab=` deep links. */
const TABS = ['details', 'categories', 'published', 'validity']

const toDate = (value: string | null): Date | null =>
  value ? new Date(value) : null

const CatalogPage = () => {
  const { t, i18n } = useTranslation()
  const { id } = useParams()
  const { navigate } = useCustomNavigate()
  const { showSuccess, showError } = useToast()
  const { blockPanel } = useUIBlocker()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.CATALOGS_MANAGER)
  const canViewCategories = hasPermission(EmployeeDomains.CATEGORIES_VIEWER)
  const canManageCategories = hasPermission(EmployeeDomains.CATEGORIES_MANAGER)
  const { refresh, setRefreshValue } = useRefresh()
  const { tenant } = useDashboardContext()
  const { sites } = useSites()
  // MD listed the site names and stored the site codes.
  const siteOptions = (sites ?? []).map((site) => ({
    label: site.name,
    value: site.code,
  }))
  const { getContentLangValue } = useLocalizedValue()
  const { getCatalog, createCatalog, updateCatalog } = useCatalogsApi()
  const { activeTab, onTabChange } = useTabs(TABS, true)
  const trackRequest = useRef(createRequestTracker()).current

  const [catalog, setCatalog] = useState<Catalog>()
  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty, isValid },
  } = useForm<CatalogFormFields>({
    mode: 'onChange',
    defaultValues: createCatalogForm(),
  })

  // Until the catalog of the current tenant + id is loaded, the form cannot
  // be edited or saved.
  const currentKey = id ? `${tenant}:${id}` : undefined
  const [loadedKey, setLoadedKey] = useState<string>()
  const isLoaded = !currentKey || loadedKey === currentKey
  const isLocked = !canManage || !isLoaded

  // MD went back to the list when the tenant changed on add / edit.
  const firstTenant = useRef(tenant)
  useEffect(() => {
    if (tenant !== firstTenant.current) {
      navigate(listPath(), { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant])

  useEffect(() => {
    if (!id) {
      setCatalog(undefined)
      setLoadedKey(undefined)
      reset(createCatalogForm())
      return
    }

    // A tenant switch sends the page back to the list (above); the old id
    // must not be fetched from the new tenant.
    if (tenant !== firstTenant.current) return

    const key = `${tenant}:${id}`
    void loadLatest(
      trackRequest,
      () => makeCall(() => getCatalog(id), blockPanel),
      (fetched) => {
        setCatalog(fetched)
        reset(createCatalogForm(fetched))
        setLoadedKey(key)
      },
      (e: unknown) => {
        showError(
          t('catalogs.edit.errors.fetching.title'),
          getApiErrorDetails(e)
        )
        navigate(listPath(), { replace: true })
      }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, tenant, refresh])

  const submit = async (data: CatalogFormFields) => {
    try {
      if (id) {
        await makeCall(
          () => updateCatalog(toCatalogPayload(data, catalog)),
          blockPanel
        )
        showSuccess(t('catalogs.edit.toast.update.success'))
        setRefreshValue()
        return
      }

      const newId = await makeCall(
        () => createCatalog(toCatalogPayload(data)),
        blockPanel
      )
      showSuccess(t('catalogs.edit.toast.create.success'))
      navigate(catalogDetailPath(newId), { replace: true })
    } catch (e: unknown) {
      // The form keeps the entered values.
      showError(t('catalogs.toasts.error'), getApiErrorDetails(e))
    }
  }

  const tabs: TabItem[] = [
    {
      id: 'details',
      label: t('catalogs.edit.tab.details.title'),
      content: (
        <SectionBox>
          <FormGrid className={styles.form}>
            <Controller
              name="id"
              control={control}
              render={({ field }) => (
                <InputText
                  label={t('catalogs.edit.tab.details.id')}
                  tooltip={t('catalogs.edit.tab.tooltip.id')}
                  value={field.value}
                  onChange={(event) => field.onChange(event.target.value)}
                  disabled={!!id || isLocked}
                  data-testid="catalog-id"
                />
              )}
            />
            <Controller
              name="name"
              control={control}
              rules={{ validate: hasName }}
              render={({ field }) => (
                <LocalizedInput
                  label={t('catalogs.edit.tab.details.name')}
                  required
                  value={field.value}
                  onChange={(value) => field.onChange(value ?? {})}
                  disabled={isLocked}
                  data-testid="catalog-name"
                />
              )}
            />
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <LocalizedInput
                  className={styles.fullRow}
                  label={t('catalogs.edit.tab.details.description')}
                  value={field.value}
                  onChange={(value) => field.onChange(value ?? {})}
                  disabled={isLocked}
                  data-testid="catalog-description"
                />
              )}
            />
          </FormGrid>
        </SectionBox>
      ),
    },
    {
      id: 'categories',
      label: t('catalogs.edit.tab.categories.title'),
      content: (
        <SectionBox>
          <FieldLabel>
            {t('catalogs.edit.tab.categories.categoryIds')}
          </FieldLabel>
          <Controller
            name="categoryIds"
            control={control}
            render={({ field }) => (
              <CategoriesSelector
                className={styles.categories}
                value={canViewCategories ? field.value : []}
                onChange={(value) => field.onChange(value)}
                // The selector's own right is Categories Manager, as in MD;
                // without Catalogs Manager the form is read-only as well.
                canManage={canManageCategories && !isLocked}
                showRoots
                showUnpublished
              />
            )}
          />
        </SectionBox>
      ),
    },
    {
      id: 'published',
      label: t('catalogs.edit.tab.published.title'),
      content: (
        <SectionBox>
          <FormGrid className={styles.form}>
            <Controller
              name="publishedSites"
              control={control}
              render={({ field }) => (
                <Dropdown
                  label={t('catalogs.edit.tab.published.publishedTo')}
                  multiple
                  filter
                  options={siteOptions}
                  value={canViewCategories ? field.value : []}
                  placeholder={
                    canViewCategories ? undefined : t('global.noPermissions')
                  }
                  onChange={(event) =>
                    field.onChange((event.value as string[] | null) ?? [])
                  }
                  disabled={isLocked || !canViewCategories}
                  data-testid="catalog-sites"
                />
              )}
            />
          </FormGrid>
        </SectionBox>
      ),
    },
    {
      id: 'validity',
      label: t('catalogs.edit.tab.visibility.title'),
      content: (
        <SectionBox>
          <FormGrid className={styles.form}>
            <Controller
              name="visibleFrom"
              control={control}
              render={({ field }) => (
                <Calendar
                  label={t('catalogs.edit.tab.visibility.from')}
                  showTime
                  hourFormat={getLocaleHourFormat(i18n.language)}
                  value={toDate(field.value)}
                  onChange={(event) =>
                    field.onChange(
                      event.value instanceof Date
                        ? event.value.toISOString()
                        : null
                    )
                  }
                  disabled={isLocked}
                  data-testid="catalog-visible-from"
                />
              )}
            />
            <Controller
              name="visibleTo"
              control={control}
              render={({ field }) => (
                <Calendar
                  label={t('catalogs.edit.tab.visibility.to')}
                  showTime
                  hourFormat={getLocaleHourFormat(i18n.language)}
                  value={toDate(field.value)}
                  onChange={(event) =>
                    field.onChange(
                      event.value instanceof Date
                        ? event.value.toISOString()
                        : null
                    )
                  }
                  disabled={isLocked}
                  data-testid="catalog-visible-to"
                />
              )}
            />
          </FormGrid>
          <Divider />
          <Controller
            name="visible"
            control={control}
            render={({ field }) => (
              <div className={styles.checkbox}>
                <Checkbox
                  inputId="catalog-visible"
                  checked={field.value}
                  onChange={(event) => field.onChange(event.checked)}
                  disabled={isLocked}
                  data-testid="catalog-visible"
                />
                <label htmlFor="catalog-visible">
                  {t('catalogs.edit.tab.visibility.visible')}
                </label>
              </div>
            )}
          />
        </SectionBox>
      ),
    },
  ]

  return (
    <>
      <HeaderSection
        title={t('catalogs.singular')}
        subtitle={id ? getContentLangValue(catalog?.name) : undefined}
        backTo={listPath()}
        moduleActions={
          <div className={styles.actions}>
            <SecondaryButton
              disabled={!isDirty || isLocked}
              onClick={() => reset()}
              data-testid="catalog-discard"
            >
              {t('global.discard')}
            </SecondaryButton>
            <PrimaryButton
              disabled={!isDirty || !isValid || isLocked}
              onClick={handleSubmit(submit)}
              data-testid="catalog-save"
            >
              {t('global.save')}
            </PrimaryButton>
          </div>
        }
      />
      <Tabs
        tabs={tabs}
        activeTabId={activeTab ?? 'details'}
        onTabChange={onTabChange}
        scrollable
        // Every tab stays mounted (hidden when inactive), as in the other
        // remotes' forms.
        keepMounted
        data-testid="catalog-tabs"
      />
    </>
  )
}

export default CatalogPage
