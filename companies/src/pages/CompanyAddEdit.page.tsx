import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useLocation, useParams, useSearchParams } from 'react-router'
import {
  Calendar,
  Dropdown,
  InputText,
  PrimaryButton,
  SecondaryButton,
  SectionBox,
  SectionTitle,
  Tabs,
  useToast,
  type TabItem,
} from '@emporix/component-library'
import HeaderSection from '../components/shared/HeaderSection'
import FormGrid from '../components/shared/FormGrid'
import FormGridRow from '../components/shared/FormGridRow'
import useMixinsForm, {
  MIXINS_LOADING_TAB_ID,
} from '../components/mixins/useMixinsForm'
import type { MixinsFormMetadata } from '../components/mixins/helpers'
import EntityChangelogTab from '../components/auditLog/EntityChangelogTab'
import { Subsidiaries } from '../components/companies/Subsidiaries'
import { CustomerGroupsTable } from '../components/companies/CustomerGroupsTable'
import { PrimaryContacts } from '../components/companies/PrimaryContacts'
import { ApprovalGroup } from '../components/companies/ApprovalGroup'
import Locations from '../components/companies/Locations'
import CompanyBreadcrumb, {
  type CompanyBreadcrumbItem,
} from '../components/companies/CompanyBreadcrumb'
import { ContactAssignmentList } from '../components/contacts/ContactAssignmentList'
import { useCustomerManagementApi } from '../hooks/api/customerManagement'
import { useConfigurationApi } from '../hooks/api/configuration'
import { useCountries } from '../hooks/useCountries'
import { useCurrencies } from '../hooks/useCurrencies'
import { useLocalizedValue } from '../hooks/useLocalizedValue'
import { useTabs } from '../hooks/useTabs'
import useForm from '../hooks/useForm'
import useCustomNavigate from '../hooks/useCustomNavigate'
import { useUIBlocker } from '../context/UIBlocker'
import { useRefresh } from '../context/RefreshValuesProvider'
import { usePermissions } from '../context/PermissionsProvider'
import { useDashboardContext } from '../context/Dashboard.context'
import { EmployeeDomains } from '../configs/accessControls'
import { parseRestrictions } from '../helpers/restrictions'
import { assignHostLocation } from '../helpers/hostUrls'
import {
  createRequestTracker,
  getApiErrorDetails,
  loadLatest,
} from '../helpers/api'
import { CompanyType, LegalEntity } from '../models/LegalEntity.model'
import type { Country } from '../models/Country.model'
import type { Mixins } from '../models/Mixins.model'
import { SchemaType } from '../models/Schema.model'
import {
  companiesListPath,
  companyAddPath,
  companyDetailPath,
  contactAddPath,
  customerAssignmentAddPath,
  HOST_CUSTOMER_PATH,
  locationAddPath,
} from '../constants/paths'
import styles from './CompanyAddEdit.module.scss'

const TABS = [
  'company-details',
  'subsidiaries',
  'locations',
  'policies',
  'customers',
  'client-groups',
]
const AUDIT_LOG_TAB = 'audit-log'

/** MD `RestrictionsProvider.parseCompanyRestrictions` scopes. */
const COMPANY_RESTRICTION_SCOPES = [
  'customermanagement.legalentity_manage',
  'customermanagement.legalentity_read',
]

type RestrictionOption = { label: string; value: string }

/** MD `reloadData`: mixin containers always exist on a loaded company. */
const withMixinContainers = (legalEntity: LegalEntity): LegalEntity => ({
  ...legalEntity,
  mixins: legalEntity.mixins ?? {},
  metadata: {
    ...(legalEntity.metadata ?? {}),
    mixins: (legalEntity.metadata?.mixins as Record<string, string>) ?? {},
  },
})

const CompanyAddEdit = () => {
  const { i18n, t } = useTranslation()
  const { companyId } = useParams()
  const routerLocation = useLocation()
  const { formData, setInitFormData, formDirty, setFormField, resetForm } =
    useForm<LegalEntity>()
  const { navigate } = useCustomNavigate()
  const { refresh } = useRefresh()
  const { activeCountries } = useCountries()
  const { getLegalEntity, createLegalEntity, updateLegalEntity } =
    useCustomerManagementApi()
  const { blockPanel } = useUIBlocker()
  const [searchParams] = useSearchParams()
  const [parentId, setParentId] = useState<string | null>()
  const [parent, setParent] = useState<LegalEntity | null>(null)
  const customerId = searchParams.get('customerId')
  const parentCompanyIdParam = searchParams.get('parentCompany')
  const { currencies } = useCurrencies()
  const { showSuccess, showError } = useToast()
  const { hasPermission, userScopes } = usePermissions()
  const companyRestrictions = useMemo(
    () => parseRestrictions(COMPANY_RESTRICTION_SCOPES, userScopes),
    [userScopes]
  )
  const canManage = hasPermission(EmployeeDomains.COMPANIES_MANAGER)
  const canViewCustomers = hasPermission(EmployeeDomains.CUSTOMERS_VIEWER)
  const canManageCustomers = hasPermission(EmployeeDomains.CUSTOMERS_MANAGER)
  const canViewAuditLog = hasPermission(EmployeeDomains.AUDIT_LOG_VIEWER)
  const hasFullRestrictionAccess = companyRestrictions === null
  const [breadcrumbs, setBreadcrumbs] = useState<CompanyBreadcrumbItem[]>([])
  const [restrictionsOptions, setRestrictionsOptions] = useState<
    RestrictionOption[]
  >([])
  const { getRestrictions } = useConfigurationApi()
  const { getContentLangValue } = useLocalizedValue()
  const trackRequest = useRef(createRequestTracker()).current

  // The mixin save reads the current form; the ref keeps the callback handed
  // to `useMixinsForm` stable while always calling the latest closure.
  const saveMixinRef = useRef<
    (data: Mixins, mixinMetadata: MixinsFormMetadata) => Promise<void>
  >(async () => undefined)

  const { loadMixins, mixinsTabs, isMixinsLoading } = useMixinsForm({
    type: SchemaType.COMPANY,
    onEdit: (data, mixinMetadata) => saveMixinRef.current(data, mixinMetadata),
    managerPermissions: canManage,
  })

  /**
   * Loads the company into the form (MD `reloadData` + `loadData`). Only the
   * latest request may write the form, so a slow response cannot overwrite a
   * newer one. When the first load fails the company does not exist (or is
   * not readable): show the error and go back to the list.
   */
  const loadCompany = useCallback(
    (id: string, leaveOnError: boolean) =>
      loadLatest(
        trackRequest,
        () => getLegalEntity(id) as unknown as Promise<LegalEntity>,
        (loaded) => {
          const legalEntity = withMixinContainers(loaded)
          setInitFormData(legalEntity)
          void loadMixins(
            legalEntity.metadata?.mixins as Record<string, string>,
            legalEntity.mixins
          )
        },
        (e) => {
          showError(t('companies.toasts.errorLoad'), getApiErrorDetails(e))
          console.error(e)
          if (leaveOnError) {
            navigate(companiesListPath())
          }
        }
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
    [getLegalEntity, trackRequest, i18n.language]
  )

  useEffect(() => {
    let current = true
    ;(async () => {
      blockPanel(true)
      try {
        if (companyId) {
          await loadCompany(companyId, true)
        }
        if (parentCompanyIdParam) {
          setParentId(parentCompanyIdParam)
          setFormField('parentId', parentCompanyIdParam)
          setFormField('type', CompanyType.SUBSIDIARY)
          try {
            const parentEntity = await getLegalEntity(parentCompanyIdParam)
            if (current) {
              setParent({ ...(parentEntity as unknown as LegalEntity) })
            }
          } catch (e: unknown) {
            console.error(e)
          }
        } else {
          setParent(null)
          setParentId(undefined)
        }
      } finally {
        blockPanel(false)
      }
    })()
    return () => {
      current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [companyId, refresh, parentCompanyIdParam])

  const reloadAfterSave = useCallback(async () => {
    if (!companyId) return
    blockPanel(true)
    try {
      await loadCompany(companyId, false)
    } finally {
      blockPanel(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [companyId, loadCompany])

  saveMixinRef.current = async (
    data: Mixins,
    mixinMetadata: MixinsFormMetadata
  ) => {
    const { key, url } = mixinMetadata
    const payload: Partial<LegalEntity> = {
      ...formData,
      mixins: { ...formData.mixins, [key]: data },
      metadata: {
        ...(formData.metadata ?? {}),
        mixins: {
          ...((formData.metadata?.mixins as Record<string, string>) ?? {}),
          [key]: url,
        },
      },
    }
    try {
      blockPanel(true)
      await updateLegalEntity(payload)
      showSuccess(t('companies.toast.update.title'))
    } catch (e: unknown) {
      showError(t('companies.toasts.errorSave'), getApiErrorDetails(e))
      console.error(e)
    } finally {
      blockPanel(false)
      void reloadAfterSave()
    }
  }

  const onSubmit = useCallback(async () => {
    const companyData = { ...formData }
    if (!companyData.restrictions || companyData.restrictions.length === 0) {
      companyData.restrictions = undefined
    }

    if (companyId) {
      try {
        blockPanel(true)
        await updateLegalEntity(companyData)
        showSuccess(t('companies.toast.update.title'))
      } catch (e: unknown) {
        showError(t('companies.toasts.errorSave'), getApiErrorDetails(e))
        console.error(e)
      } finally {
        blockPanel(false)
        void reloadAfterSave()
      }
    } else {
      try {
        blockPanel(true)
        const createResponse = await createLegalEntity(companyData)
        showSuccess(t('companies.toast.create.title'))
        navigate(companyDetailPath(createResponse.data.id))
      } catch (e: unknown) {
        showError(t('companies.toasts.errorSave'), getApiErrorDetails(e))
        console.error(e)
      } finally {
        blockPanel(false)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [i18n.language, formData, companyId, reloadAfterSave])

  const header =
    parent === null ? t('companies.singular') : t('companies.subsidiary')

  const loadCompanyHierarchy = useCallback(
    async (id: string, isCurrent: () => boolean) => {
      try {
        const company = await getLegalEntity(id)
        if (!company.parentId) {
          if (isCurrent()) setBreadcrumbs([])
          return
        }
        const hierarchy: CompanyBreadcrumbItem[] = [
          { id: company.id, name: company.name },
        ]
        let nextParentId: string = company.parentId
        while (nextParentId) {
          const parentEntity = await getLegalEntity(nextParentId)
          hierarchy.unshift({ id: parentEntity.id, name: parentEntity.name })
          nextParentId = parentEntity.parentId || ''
        }
        if (isCurrent()) setBreadcrumbs(hierarchy)
      } catch (error) {
        console.error('Error loading company hierarchy:', error)
        if (isCurrent()) setBreadcrumbs([])
      }
    },
    [getLegalEntity]
  )

  useEffect(() => {
    if (!companyId) return
    let current = true
    void loadCompanyHierarchy(companyId, () => current)
    return () => {
      current = false
    }
  }, [companyId, loadCompanyHierarchy])

  /**
   * MD `getBackPath`: a company opened from a customer goes back to that
   * customer (a host route outside this remote), a new subsidiary to its
   * parent, anything else to the list.
   */
  const backTo = useMemo(() => {
    if (customerId) {
      return () => assignHostLocation(HOST_CUSTOMER_PATH(customerId))
    }
    return parent && parentId
      ? companyDetailPath(parentId)
      : companiesListPath()
  }, [customerId, parent, parentId])

  useEffect(() => {
    let current = true
    ;(async () => {
      try {
        const config = await getRestrictions()
        if (current && config && config.value && Array.isArray(config.value)) {
          let options: RestrictionOption[] = (config.value as string[]).map(
            (restriction) => ({ label: restriction, value: restriction })
          )
          if (companyRestrictions !== null) {
            options = options.filter((option) =>
              companyRestrictions.includes(option.value)
            )
          }
          setRestrictionsOptions(options)
        }
      } catch (error) {
        console.error('Error fetching restrictions:', error)
      }
    })()
    return () => {
      current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [companyRestrictions])

  useEffect(() => {
    if (
      !companyId &&
      companyRestrictions !== null &&
      companyRestrictions.length === 1 &&
      restrictionsOptions.length === 1 &&
      (!formData.restrictions || formData.restrictions.length === 0)
    ) {
      setFormField('restrictions', [restrictionsOptions[0].value])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [
    restrictionsOptions,
    companyRestrictions,
    companyId,
    formData.restrictions,
  ])

  /**
   * CL Dropdown has no `showClear`: with full restriction access (MD
   * `showClear`) an empty option clears the restriction instead.
   */
  const restrictionDropdownOptions = useMemo(
    () =>
      hasFullRestrictionAccess && restrictionsOptions.length > 0
        ? [
            {
              label: t('companies.edit.form.details.restrictionPlaceholder'),
              value: '',
            },
            ...restrictionsOptions,
          ]
        : restrictionsOptions,
    [hasFullRestrictionAccess, restrictionsOptions, t]
  )

  const countryOptions = useMemo(
    () =>
      activeCountries.map((country: Country) => ({
        label: getContentLangValue(country.name),
        value: country.code,
      })),
    [activeCountries, getContentLangValue]
  )

  const currencyOptions = useMemo(
    () =>
      currencies.map((currency) => ({
        label: currency.code,
        value: currency.code,
      })),
    [currencies]
  )

  const currentPath = `${routerLocation.pathname}${routerLocation.search}`
  const isCreate = companyId === undefined

  const primaryContacts = useMemo(() => {
    const contacts = formData.contacts ?? []
    const primary = contacts.filter((assignment) => assignment.primary)
    return primary.length > 0 ? primary : contacts.slice(0, 1)
  }, [formData.contacts])

  const registrationDate = formData.legalInfo?.registrationDate
    ? new Date(formData.legalInfo.registrationDate)
    : null

  const detailsTab = (
    <>
      <SectionBox
        className={styles.section}
        name={t('companies.edit.form.details.title')}
      >
        <FormGrid>
          <FormGridRow>
            <InputText
              className={styles.col6}
              inputId="company-name"
              label={t('companies.edit.form.details.name')}
              readOnly={!canManage}
              value={formData.name || ''}
              onChange={(event) => setFormField('name', event.target.value)}
            />
            <InputText
              className={styles.col6}
              inputId="company-id"
              label={t('companies.edit.form.details.id')}
              tooltip={t('companies.edit.form.tooltip.id')}
              readOnly={!canManage || companyId !== undefined}
              value={formData.id || ''}
              onChange={(event) => setFormField('id', event.target.value)}
            />
          </FormGridRow>
          <FormGridRow>
            <InputText
              className={styles.col6}
              inputId="company-legal-name"
              label={t('companies.edit.form.legalEntity.legalName')}
              readOnly={!canManage}
              value={formData.legalInfo?.legalName || ''}
              onChange={(event) =>
                setFormField('legalInfo.legalName', event.target.value)
              }
            />
            <InputText
              className={styles.col6}
              inputId="company-tax-number"
              label={t('companies.edit.form.legalEntity.taxRegistrationNumber')}
              readOnly={!canManage}
              value={formData.legalInfo?.taxRegistrationNumber || ''}
              onChange={(event) =>
                setFormField(
                  'legalInfo.taxRegistrationNumber',
                  event.target.value
                )
              }
            />
          </FormGridRow>
          <FormGridRow>
            <Dropdown
              className={styles.col6}
              inputId="company-country"
              data-testid="company-country"
              label={t('companies.edit.form.legalEntity.countryOfRegistration')}
              disabled={!canManage}
              placeholder={t(
                'companies.edit.form.legalEntity.countryOfRegistrationPlaceholder'
              )}
              value={formData.legalInfo?.countryOfRegistration || ''}
              options={countryOptions}
              onChange={(event) =>
                setFormField('legalInfo.countryOfRegistration', event.value)
              }
            />
            <InputText
              className={styles.col6}
              inputId="company-registration-agency"
              label={t('companies.edit.form.legalEntity.registrationAgency')}
              readOnly={!canManage}
              value={formData.legalInfo?.registrationAgency || ''}
              onChange={(event) =>
                setFormField('legalInfo.registrationAgency', event.target.value)
              }
            />
          </FormGridRow>
          <FormGridRow>
            <Calendar
              className={styles.col6}
              inputId="company-registration-date"
              label={t('companies.edit.form.legalEntity.registrationDate')}
              disabled={!canManage}
              value={registrationDate}
              onChange={(event) => {
                if (event.value instanceof Date) {
                  setFormField(
                    'legalInfo.registrationDate',
                    event.value.toISOString()
                  )
                }
              }}
            />
            <InputText
              className={styles.col6}
              inputId="company-registration-id"
              label={t('companies.edit.form.legalEntity.registrationId')}
              readOnly={!canManage}
              value={formData.legalInfo?.registrationId || ''}
              onChange={(event) =>
                setFormField('legalInfo.registrationId', event.target.value)
              }
            />
          </FormGridRow>
          <FormGridRow>
            <Dropdown
              className={styles.col6}
              inputId="company-restriction"
              data-testid="company-restriction"
              label={t('companies.edit.form.details.restriction')}
              required={!hasFullRestrictionAccess}
              disabled={!canManage}
              value={
                formData.restrictions && formData.restrictions.length > 0
                  ? formData.restrictions[0]
                  : ''
              }
              options={restrictionDropdownOptions}
              placeholder={t(
                'companies.edit.form.details.restrictionPlaceholder'
              )}
              onChange={(event) => {
                const value = event.value
                setFormField('restrictions', value ? [value] : null)
              }}
            />
          </FormGridRow>
        </FormGrid>
      </SectionBox>
      <SectionTitle
        className={styles.sectionTitle}
        name={t('companies.edit.form.primaryContacts.title')}
        actions={
          <PrimaryButton
            disabled={isCreate || !canManage || !canManageCustomers}
            onClick={() =>
              companyId && navigate(contactAddPath(companyId, 'primary=true'))
            }
          >
            {t('companies.edit.form.primaryContacts.add')}
          </PrimaryButton>
        }
      />
      {primaryContacts.length > 0 && (
        <SectionBox>
          <PrimaryContacts contacts={primaryContacts} />
        </SectionBox>
      )}
    </>
  )

  const subsidiariesTab = (
    <>
      <SectionTitle
        className={styles.sectionTitle}
        name={t('companies.edit.form.subsidiaries.title')}
        actions={
          <PrimaryButton
            disabled={!canManage}
            onClick={() =>
              navigate(
                companyAddPath(
                  new URLSearchParams({ parentCompany: formData.id ?? '' })
                )
              )
            }
          >
            {t('companies.edit.form.subsidiaries.addNew')}
          </PrimaryButton>
        }
      />
      {formData.id && (
        <Subsidiaries legalEntity={formData} managerPermissions={canManage} />
      )}
    </>
  )

  const locationsTab = (
    <SectionBox
      name={t('companies.edit.form.locations.title')}
      actions={
        <PrimaryButton
          disabled={!canManage}
          onClick={() => companyId && navigate(locationAddPath(companyId))}
        >
          {t('companies.edit.form.locations.addNew')}
        </PrimaryButton>
      }
    >
      <Locations legalEntity={formData} readOnly={!canManage} />
    </SectionBox>
  )

  const policiesTab = (
    <>
      <SectionBox
        className={styles.section}
        name={t('companies.edit.form.policies.purchasingLimits.subtitle')}
      >
        <InputText
          className={styles.field}
          inputId="company-account-limit"
          label={t('companies.edit.form.policies.accountLimit')}
          readOnly={!canManage}
          value={formData.accountLimit?.value ?? ''}
          onChange={(event) =>
            setFormField('accountLimit.value', event.target.value)
          }
        />
        <Dropdown
          inputId="company-account-limit-currency"
          data-testid="company-account-limit-currency"
          label={t('priceLists.settings.form.currency.label')}
          disabled={!canManage}
          options={currencyOptions}
          value={formData.accountLimit?.currency}
          onChange={(event) =>
            setFormField('accountLimit.currency', event.value)
          }
        />
      </SectionBox>
      <ApprovalGroup managerPermissions={canManage} legalEntity={formData} />
    </>
  )

  const customersTab = (
    <>
      <SectionTitle
        className={styles.sectionTitle}
        name={t('companies.edit.form.contacts.title')}
        actions={
          <div className={styles.actions}>
            <PrimaryButton
              disabled={!canManage || !canViewCustomers}
              onClick={() =>
                companyId &&
                navigate(
                  customerAssignmentAddPath(
                    companyId,
                    new URLSearchParams({ backTo: currentPath })
                  )
                )
              }
            >
              {t('companies.edit.form.contacts.assignCustomer')}
            </PrimaryButton>
            <PrimaryButton
              disabled={!canManage || !canManageCustomers}
              onClick={() =>
                companyId &&
                navigate(
                  contactAddPath(
                    companyId,
                    new URLSearchParams({ backTo: currentPath })
                  )
                )
              }
            >
              {t('companies.edit.form.contacts.addNew')}
            </PrimaryButton>
          </div>
        }
      />
      <ContactAssignmentList
        managerPermissions={canManage}
        legalEntity={formData}
      />
    </>
  )

  const customerGroupsTab = (
    <>
      <SectionTitle
        className={styles.sectionTitle}
        name={t('companies.edit.form.customerGroups.title')}
      />
      <CustomerGroupsTable legalEntity={formData} />
    </>
  )

  const tabIds = useMemo(
    () => [
      ...TABS,
      ...mixinsTabs.map((tab) => tab.id),
      ...(canViewAuditLog ? [AUDIT_LOG_TAB] : []),
    ],
    [mixinsTabs, canViewAuditLog]
  )
  const { activeTab, onTabChange } = useTabs(tabIds, true)

  // While mixins (re)load, a `?tab=<mixin>` URL has no matching tab yet:
  // keep the loading placeholder selected instead of jumping to the details.
  const urlTab = searchParams.get('tab')
  const activeTabId =
    isMixinsLoading && urlTab && !tabIds.includes(urlTab)
      ? MIXINS_LOADING_TAB_ID
      : (activeTab ?? TABS[0])

  const tabs: TabItem[] = [
    {
      id: 'company-details',
      label: t('companies.edit.tabs.companyDetails'),
      content: detailsTab,
    },
    {
      id: 'subsidiaries',
      label: t('companies.edit.tabs.subsidiaries'),
      disabled: isCreate,
      content: subsidiariesTab,
    },
    {
      id: 'locations',
      label: t('companies.edit.tabs.locations'),
      disabled: isCreate,
      content: locationsTab,
    },
    {
      id: 'policies',
      label: t('companies.edit.tabs.policies'),
      disabled: isCreate,
      content: policiesTab,
    },
    {
      id: 'customers',
      label: t('companies.edit.tabs.contacts'),
      disabled: isCreate,
      content: customersTab,
    },
    {
      id: 'client-groups',
      label: t('companies.edit.tabs.customerGroups'),
      disabled: isCreate,
      content: customerGroupsTab,
    },
    ...mixinsTabs,
    ...(canViewAuditLog
      ? [
          {
            id: AUDIT_LOG_TAB,
            label: t('auditLog.entityChangelog.tab'),
            disabled: isCreate,
            content: companyId ? (
              <EntityChangelogTab
                entity="company"
                entityId={companyId}
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
        title={header}
        subtitle={companyId && formData.name}
        backTo={backTo}
        moduleActions={
          <div className={styles.actions}>
            <SecondaryButton disabled={!formDirty} onClick={() => resetForm()}>
              {t('global.discard')}
            </SecondaryButton>
            <PrimaryButton
              disabled={!formDirty || !canManage}
              onClick={() => void onSubmit()}
            >
              {t('global.save')}
            </PrimaryButton>
          </div>
        }
      />
      {breadcrumbs.length > 0 && (
        <div className={styles.breadcrumb}>
          <CompanyBreadcrumb items={breadcrumbs} />
        </div>
      )}
      <div className={styles.tabs}>
        <Tabs
          data-testid="company-tabs"
          scrollable
          keepMounted
          tabs={tabs}
          activeTabId={activeTabId}
          onTabChange={onTabChange}
        />
      </div>
    </>
  )
}

/**
 * The key remounts the page per company (and for `add`), so no form state
 * from one company leaks into the next (breadcrumb, new subsidiary,
 * create → edit).
 *
 * A host tenant switch leaves the page for the list (MD `useUpdateEffect` on
 * the tenant): the company belongs to the previous tenant and must not be
 * shown or saved under the new one.
 */
const CompanyAddEditPage = () => {
  const { companyId } = useParams()
  const { tenant } = useDashboardContext()
  const openedForTenant = useRef(tenant)

  if (tenant !== openedForTenant.current) {
    return <Navigate to={companiesListPath()} replace />
  }

  return <CompanyAddEdit key={companyId ?? 'add'} />
}

export default CompanyAddEditPage
