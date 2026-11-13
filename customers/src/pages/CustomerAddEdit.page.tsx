import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useParams, useSearchParams } from 'react-router'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import {
  Calendar,
  ConfirmBox,
  Dropdown,
  FieldLabel,
  InputSwitch,
  InputText,
  PrimaryButton,
  ProgressSpinner,
  SecondaryButton,
  SectionBox,
  SelectButton,
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
import Address from '../components/customers/Address'
import AssistedBuying from '../components/customers/AssistedBuying'
import LinkChips from '../components/customers/LinkChips'
import MarketingInformation from '../components/customers/MarketingInformation'
import { useCustomerApi } from '../hooks/api/customers'
import { useCouponsApi } from '../hooks/api/coupons'
import { useIamApi } from '../hooks/api/iam'
import { useSegmentsApi } from '../hooks/api/segments'
import { useConfigurationApi } from '../hooks/api/configuration'
import { useCurrencies } from '../hooks/useCurrencies'
import { useLocalizedValue } from '../hooks/useLocalizedValue'
import { useTabs } from '../hooks/useTabs'
import useCustomNavigate from '../hooks/useCustomNavigate'
import { useUIBlocker } from '../context/UIBlocker'
import { useSites } from '../context/SitesProvider'
import { usePermissions } from '../context/PermissionsProvider'
import { useDashboardContext } from '../context/Dashboard.context'
import { EmployeeDomains } from '../configs/accessControls'
import { parseRestrictions } from '../helpers/restrictions'
import { HOST_SEGMENT_PATH } from '../helpers/hostUrls'
import {
  createRequestTracker,
  getApiErrorMessage,
  loadLatest,
} from '../helpers/api'
import {
  CUSTOMER_RESTRICTION_SCOPES,
  DEFAULT_CUSTOMER,
  PASSWORD_MIN_LENGTH,
  TITLE_OPTIONS,
  generateRandomPassword,
  getRestrictionOptions,
  getSiteOptions,
  toCustomerPayload,
  withMixinContainers,
} from '../helpers/customerForm.helpers'
import {
  DEFAULT_ADDRESS,
  type Customer,
  type CustomerAddress,
} from '../models/Customer.model'
import type { Group } from '../models/Groups.model'
import type { Segment } from '../models/Segment.model'
import type { Mixins } from '../models/Mixins.model'
import { SchemaType } from '../models/Schema.model'
import {
  HOST_COMPANY_PATH,
  HOST_CUSTOMER_GROUP_PATH,
  customerDetailPath,
  customersListPath,
} from '../constants/paths'
import styles from './CustomerAddEdit.module.scss'

const TABS = ['details', 'addresses']
const AUDIT_LOG_TAB = 'audit-log'

/** The host URL of this page, for "back" links from host screens. */
const currentHostUrl = () =>
  `${window.location.pathname}${window.location.search}${window.location.hash}`

/** Port of MD `modules/CustomersAddEdit.module.tsx`. */
const CustomerAddEdit = () => {
  const { t, i18n } = useTranslation()
  const { customerId } = useParams()
  const [searchParams] = useSearchParams()
  const { navigate } = useCustomNavigate()
  const { showSuccess, showError } = useToast()
  const { blockPanel } = useUIBlocker()
  const { currency } = useDashboardContext()
  const { hasPermission, userScopes } = usePermissions()
  const customerRestrictions = useMemo(
    () => parseRestrictions(CUSTOMER_RESTRICTION_SCOPES, userScopes),
    [userScopes]
  )
  const canManage = hasPermission(EmployeeDomains.CUSTOMERS_MANAGER)
  const canViewAuditLog = hasPermission(EmployeeDomains.AUDIT_LOG_VIEWER)
  const hasFullRestrictionAccess = customerRestrictions === null

  const {
    syncCustomer,
    editCustomer,
    patchCustomer,
    createCustomer,
    deleteCustomer,
    createCustomerAddress,
    editCustomerAddress,
    partiallyEditCustomerAddress,
    deleteCustomerAddress,
  } = useCustomerApi()
  const { getReferralCoupon } = useCouponsApi()
  const { getAllGroupsForUser } = useIamApi()
  const { getAllSegments } = useSegmentsApi()
  const { getRestrictions, getSyncBetweenRestrictionsAndSiteCodes } =
    useConfigurationApi()
  const { currenciesDropdownOptions } = useCurrencies()
  const { sites } = useSites()
  const { getUiLangValue, getContentLangValue } = useLocalizedValue()

  const [customer, setCustomer] = useState<Customer>()
  const [isLoading, setIsLoading] = useState(Boolean(customerId))
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleteConfirmOpened, setIsDeleteConfirmOpened] = useState(false)
  const [referralCouponCode, setReferralCouponCode] = useState('')
  const [isAutogeneratePassword, setIsAutogeneratePassword] = useState(false)
  const [userGroups, setUserGroups] = useState<Group[]>([])
  const [assignedSegments, setAssignedSegments] = useState<Segment[]>([])
  const [restrictionsOptions, setRestrictionsOptions] = useState<
    { label: string; value: string }[]
  >([])
  const [enableSync, setEnableSync] = useState(false)
  const trackRequest = useRef(createRequestTracker()).current

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { isValid, isDirty },
  } = useForm<Customer>({
    mode: 'onChange',
    defaultValues: {
      ...DEFAULT_CUSTOMER,
      preferredCurrency: currency?.id || '',
    },
  })
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: 'addresses',
    keyName: 'customArrayKey',
  })

  const saveMixinRef = useRef<
    (data: Mixins, mixinMetadata: MixinsFormMetadata) => Promise<void>
  >(async () => undefined)
  const { loadMixins, mixinsTabs, isMixinsLoading } = useMixinsForm({
    type: SchemaType.CUSTOMER,
    onEdit: (data, mixinMetadata) => saveMixinRef.current(data, mixinMetadata),
    managerPermissions: canManage,
  })

  /** MD `reloadData`: loads the customer and its mixin forms. */
  const reloadData = useCallback(async () => {
    if (!customerId) return undefined
    const loaded = withMixinContainers(await syncCustomer(customerId))
    void loadMixins(
      loaded.metadata.mixins as Record<string, string>,
      loaded.mixins ?? {}
    )
    return loaded
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadMixins follows the language
  }, [customerId, syncCustomer, i18n.language])

  const applyCustomer = useCallback(
    (loaded: Customer | undefined) => {
      setCustomer(loaded)
      if (loaded) reset(loaded)
    },
    [reset]
  )

  useEffect(() => {
    if (!customerId) return
    setIsLoading(true)
    void loadLatest(
      trackRequest,
      reloadData,
      (loaded) => {
        applyCustomer(loaded)
        setIsLoading(false)
      },
      (e) => {
        console.error(e)
        showError(t('customers.toasts.errorSave'), getApiErrorMessage(e))
        navigate(customersListPath())
      }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once per customer
  }, [customerId])

  useEffect(() => {
    if (!customerId) return
    let current = true
    getReferralCoupon(customerId)
      .then((coupon) => current && setReferralCouponCode(coupon?.code || ''))
      .catch((e) => console.error(e))
    return () => {
      current = false
    }
  }, [customerId, getReferralCoupon])

  useEffect(() => {
    const id = customer?.id
    if (!id) return
    let current = true
    getAllGroupsForUser(id)
      .then((groups) => current && setUserGroups(groups as Group[]))
      .catch((error) => {
        console.error('Error fetching user groups:', error)
        showError(t('customers.toasts.errorSave'))
      })
    getAllSegments(undefined, undefined, { customerId: id })
      .then((segments) => current && setAssignedSegments(segments))
      .catch((e) => console.error('Error fetching segments:', e))
    return () => {
      current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per customer
  }, [customer?.id])

  useEffect(() => {
    let current = true
    getRestrictions()
      .then((config) => {
        if (current && config) {
          setRestrictionsOptions(
            getRestrictionOptions(config.value, customerRestrictions)
          )
        }
      })
      .catch((error) => console.error('Error fetching restrictions:', error))
    getSyncBetweenRestrictionsAndSiteCodes()
      .then((config) => {
        if (current && config && typeof config.value === 'boolean') {
          setEnableSync(config.value)
        }
      })
      .catch((error) =>
        console.error('Error fetching enableSync configuration:', error)
      )
    return () => {
      current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [customerRestrictions])

  const handleDelete = useCallback(async () => {
    if (!customerId) return
    try {
      blockPanel(true)
      setIsDeleting(true)
      await deleteCustomer(customerId)
      showSuccess(t('customers.toasts.successDelete'))
      navigate(customersListPath())
    } catch (e) {
      console.error(e)
      showError(t('customers.toasts.errorDelete'), getApiErrorMessage(e))
    } finally {
      setIsDeleting(false)
      setIsDeleteConfirmOpened(false)
      blockPanel(false)
    }
  }, [
    blockPanel,
    customerId,
    deleteCustomer,
    navigate,
    showError,
    showSuccess,
    t,
  ])

  const onSubmit = useCallback(
    async (formValues: Customer) => {
      const payload = toCustomerPayload(formValues)
      try {
        blockPanel(true)
        if (customerId) {
          await editCustomer(payload)
          applyCustomer(await reloadData())
          showSuccess(t('customers.toasts.successUpdate'))
        } else {
          const response = await createCustomer(payload)
          if (response.id) {
            showSuccess(t('customers.toasts.successCreate'))
            navigate(customerDetailPath(response.id))
          }
        }
      } catch (e) {
        showError(t('customers.toasts.errorSave'), getApiErrorMessage(e))
        console.error(e)
      } finally {
        blockPanel(false)
      }
    },
    [
      applyCustomer,
      blockPanel,
      createCustomer,
      customerId,
      editCustomer,
      navigate,
      reloadData,
      showError,
      showSuccess,
      t,
    ]
  )

  saveMixinRef.current = async (data, mixinMetadata) => {
    if (!customer?.id) return
    const { key, url } = mixinMetadata
    try {
      blockPanel(true)
      await patchCustomer({
        id: customer.id,
        mixins: { ...customer.mixins, [key]: data },
        metadata: {
          mixins: {
            ...((customer.metadata?.mixins as Record<string, string>) ?? {}),
            [key]: url,
          },
        },
      })
      applyCustomer(await reloadData())
      showSuccess(t('customers.toasts.successUpdate'))
    } catch (e) {
      showError(t('customers.toasts.errorSave'), getApiErrorMessage(e))
      console.error(e)
    } finally {
      blockPanel(false)
    }
  }

  const handleDeleteAddress = useCallback(
    async (idx: number, addressId: string | undefined) => {
      if (!customerId) return
      // A new, never saved address only lives in the form.
      if (!addressId) {
        remove(idx)
        return
      }
      try {
        blockPanel(true)
        await deleteCustomerAddress(customerId, addressId)
        setCustomer(withMixinContainers(await syncCustomer(customerId)))
        remove(idx)
      } catch (e) {
        showError(t('customers.toasts.errorSave'), getApiErrorMessage(e))
        console.error(e)
      } finally {
        blockPanel(false)
      }
    },
    [
      blockPanel,
      customerId,
      deleteCustomerAddress,
      remove,
      showError,
      syncCustomer,
      t,
    ]
  )

  const handleUpdateAddress = useCallback(
    async (
      idx: number,
      address: CustomerAddress,
      addressId: string | undefined
    ) => {
      if (!customerId) return
      try {
        blockPanel(true)
        const saved = { ...address }
        if (addressId !== undefined) {
          await editCustomerAddress(customerId, saved)
        } else {
          const created = await createCustomerAddress(customerId, saved)
          saved.id = created.id
        }
        setCustomer(withMixinContainers(await syncCustomer(customerId)))
        update(idx, saved)
        showSuccess(t('customers.toasts.successUpdate'))
      } catch (e) {
        showError(t('customers.toasts.errorSave'), getApiErrorMessage(e))
        console.error(e)
      } finally {
        blockPanel(false)
      }
    },
    [
      blockPanel,
      createCustomerAddress,
      customerId,
      editCustomerAddress,
      showError,
      showSuccess,
      syncCustomer,
      t,
      update,
    ]
  )

  const handleUpdateAddressMixins = useCallback(
    async (
      idx: number,
      address: CustomerAddress,
      data: Mixins,
      mixinMetadata: MixinsFormMetadata
    ) => {
      if (!customerId || !address.id) return
      const { key, url } = mixinMetadata
      const mixins = { ...(address.mixins ?? {}), [key]: data }
      try {
        blockPanel(true)
        await partiallyEditCustomerAddress(customerId, {
          id: address.id,
          mixins,
          metadata: { mixins: { [key]: url } },
        })
        setCustomer(withMixinContainers(await syncCustomer(customerId)))
        update(idx, { ...address, mixins })
        showSuccess(t('customers.toasts.successUpdate'))
      } catch (e) {
        showError(t('customers.toasts.errorSave'), getApiErrorMessage(e))
        console.error(e)
      } finally {
        blockPanel(false)
      }
    },
    [
      blockPanel,
      customerId,
      partiallyEditCustomerAddress,
      showError,
      showSuccess,
      syncCustomer,
      t,
      update,
    ]
  )

  const siteOptions = useMemo(
    () => getSiteOptions(sites ?? [], enableSync, customerRestrictions),
    [sites, enableSync, customerRestrictions]
  )
  const isSiteRequired = enableSync && !hasFullRestrictionAccess

  const handleAutogenerateChange = (checked: boolean) => {
    setIsAutogeneratePassword(checked)
    setValue('password', checked ? generateRandomPassword() : '', {
      shouldValidate: true,
      shouldDirty: true,
    })
  }

  const booleanOptions = [
    { label: t('global.yes'), value: 'true' },
    { label: t('global.no'), value: 'false' },
  ]

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

  if (isLoading) {
    return <ProgressSpinner />
  }

  const segmentItems = assignedSegments.map((segment) => ({
    id: segment.id,
    label: getUiLangValue(segment.name),
    href: `${HOST_SEGMENT_PATH(segment.id)}?backTo=${encodeURIComponent(
      currentHostUrl()
    )}`,
  }))
  const companyItems = (customer?.b2b?.legalEntities ?? []).map((entity) => ({
    id: entity.id,
    label: getContentLangValue(entity.name),
    href: HOST_COMPANY_PATH(entity.id, customerId),
  }))
  const groupItems = userGroups.map((group) => ({
    id: group.id,
    label: getContentLangValue(group.name),
    href: HOST_CUSTOMER_GROUP_PATH(group.id),
  }))

  const detailsTab = (
    <>
      <SectionBox
        className={styles.section}
        name={t('customers.details.subtitle')}
        actions={
          <div className={styles.actions}>
            {customerId && <AssistedBuying customerNumber={customerId} />}
            <SecondaryButton
              disabled={!isDirty || !canManage}
              onClick={() => {
                reset()
                setIsAutogeneratePassword(false)
              }}
            >
              {t('global.discard')}
            </SecondaryButton>
            <PrimaryButton
              data-testid="customer-save"
              disabled={!isDirty || !isValid || !canManage}
              onClick={() => void handleSubmit(onSubmit)()}
            >
              {t('global.save')}
            </PrimaryButton>
          </div>
        }
      >
        <form
          className={styles.grid}
          onSubmit={(event) => event.preventDefault()}
        >
          <Controller
            control={control}
            name="id"
            render={({ field }) => (
              <InputText
                className={customerId ? styles.span3 : styles.span12}
                inputId="customer-id"
                label={t('customers.details.id')}
                tooltip={t('customers.details.tooltip.id')}
                disabled={!canManage || customerId !== undefined}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value)}
              />
            )}
          />
          {customer?.customerNumber && (
            <InputText
              className={styles.span4}
              inputId="customer-number"
              label={t('customers.details.customerNumber')}
              disabled
              value={customer.customerNumber}
            />
          )}
          {customer?.metadataCreatedAt && (
            <Calendar
              key={`creation-date-${i18n.language}`}
              className={styles.span3}
              inputId="customer-creation-date"
              label={t('customers.details.creationDate')}
              disabled
              showTime
              hourFormat="24"
              value={new Date(customer.metadataCreatedAt)}
            />
          )}
          {customer?.lastLogin && (
            <Calendar
              key={`last-login-${i18n.language}`}
              className={styles.span2}
              inputId="customer-last-login"
              label={t('customers.details.lastLogin')}
              disabled
              showTime
              hourFormat="24"
              value={new Date(customer.lastLogin)}
            />
          )}

          <Controller
            control={control}
            name="title"
            render={({ field }) => (
              <div className={`${styles.span3} ${styles.rowStart}`}>
                <FieldLabel>{t('customers.details.title')}</FieldLabel>
                <SelectButton
                  data-testid="customer-title"
                  disabled={!canManage}
                  options={TITLE_OPTIONS}
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                />
              </div>
            )}
          />
          <Controller
            control={control}
            name="firstName"
            render={({ field }) => (
              <InputText
                className={styles.span3}
                inputId="customer-first-name"
                label={t('customers.details.firstName')}
                readOnly={!canManage}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value)}
              />
            )}
          />
          <Controller
            control={control}
            name="lastName"
            render={({ field }) => (
              <InputText
                className={styles.span4}
                inputId="customer-last-name"
                label={t('customers.details.lastName')}
                readOnly={!canManage}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value)}
              />
            )}
          />
          <Controller
            control={control}
            name="restriction"
            render={({ field }) => (
              <Dropdown
                className={styles.span2}
                inputId="customer-restriction"
                data-testid="customer-restriction"
                label={t('customers.details.restriction')}
                disabled={
                  !canManage || (!hasFullRestrictionAccess && enableSync)
                }
                filter
                showClear={hasFullRestrictionAccess}
                clearAriaLabel={t('global.clear')}
                options={restrictionsOptions}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.value ?? null)}
              />
            )}
          />

          <LinkChips
            className={`${styles.span4} ${styles.rowStart}`}
            data-testid="customer-segments"
            label={t('customers.details.assignedSegments')}
            emptyText={t('customers.details.noSegments')}
            items={segmentItems}
          />
          <LinkChips
            className={styles.span4}
            data-testid="customer-companies"
            label={t('customers.details.assignedCompanies')}
            emptyText={t('customers.details.noCompanies')}
            items={companyItems}
          />
          <LinkChips
            className={styles.span4}
            data-testid="customer-groups"
            label={t('customers.details.groups')}
            emptyText={t('customers.details.noGroups')}
            items={groupItems}
          />
          {!customerId && (
            <Controller
              control={control}
              name="password"
              rules={{ minLength: PASSWORD_MIN_LENGTH }}
              render={({ field }) => (
                <InputText
                  className={`${styles.span4} ${styles.rowStart}`}
                  inputId="customer-password"
                  data-testid="customer-password"
                  type="password"
                  autoComplete="new-password"
                  label={t('customers.details.password')}
                  tooltip={t('customers.details.tooltip.password')}
                  toggleMaskLabels={{
                    show: t('customers.details.passwordToggle.show'),
                    hide: t('customers.details.passwordToggle.hide'),
                  }}
                  disabled={!canManage || isAutogeneratePassword}
                  value={field.value || ''}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              )}
            />
          )}
          {!customerId && (
            <div className={styles.span2}>
              <FieldLabel
                htmlFor="customer-autogenerate"
                tooltip={t('customers.details.tooltip.autogenerate')}
              >
                {t('customers.details.autogenerate')}
              </FieldLabel>
              <InputSwitch
                inputId="customer-autogenerate"
                disabled={!canManage}
                checked={isAutogeneratePassword}
                onChange={(e) => handleAutogenerateChange(e.value)}
              />
            </div>
          )}

          <Controller
            control={control}
            name="preferredSite"
            rules={{ required: isSiteRequired }}
            render={({ field }) => (
              <Dropdown
                className={`${styles.span6} ${styles.rowStart}`}
                inputId="customer-site"
                data-testid="customer-site"
                label={t('customers.details.preferredSite')}
                required={isSiteRequired}
                disabled={!canManage}
                filter
                options={siteOptions}
                value={field.value ?? ''}
                onChange={(e) => {
                  field.onChange(e.value)
                  // MD: with restrictions synced to site codes, the site
                  // picks the restriction.
                  if (enableSync) {
                    setValue('restriction', (e.value as string) || null)
                  }
                }}
              />
            )}
          />
          <Controller
            control={control}
            name="preferredCurrency"
            rules={{ required: true }}
            render={({ field }) => (
              <Dropdown
                className={styles.span6}
                inputId="customer-currency"
                data-testid="customer-currency"
                label={t('customers.details.preferredCurrency')}
                required
                disabled={!canManage}
                filter
                options={currenciesDropdownOptions}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.value)}
              />
            )}
          />

          <Controller
            control={control}
            name="contactEmail"
            rules={{ required: true }}
            render={({ field }) => (
              <InputText
                className={`${styles.span6} ${styles.rowStart}`}
                inputId="customer-email"
                label={t('customers.details.contactEmail')}
                required
                readOnly={!canManage}
                value={field.value || ''}
                onChange={(e) => field.onChange(e.target.value)}
              />
            )}
          />
          <Controller
            control={control}
            name="contactPhone"
            render={({ field }) => (
              <InputText
                className={styles.span6}
                inputId="customer-phone"
                label={t('customers.details.contactPhone')}
                readOnly={!canManage}
                value={field.value || ''}
                onChange={(e) => field.onChange(e.target.value)}
              />
            )}
          />

          {customerId && (
            <>
              <Controller
                control={control}
                name="onHold"
                render={({ field }) => (
                  <div className={`${styles.span2} ${styles.rowStart}`}>
                    <FieldLabel>{t('customers.details.onHold')}</FieldLabel>
                    <SelectButton
                      data-testid="customer-on-hold"
                      disabled={!canManage}
                      options={booleanOptions}
                      value={String(Boolean(field.value))}
                      onChange={(e) => field.onChange(e.value === 'true')}
                    />
                  </div>
                )}
              />
              <Controller
                control={control}
                name="active"
                render={({ field }) => (
                  <div className={styles.span2}>
                    <FieldLabel>{t('customers.details.active')}</FieldLabel>
                    <SelectButton
                      data-testid="customer-active"
                      disabled={!canManage}
                      options={booleanOptions}
                      value={String(Boolean(field.value))}
                      onChange={(e) => field.onChange(e.value === 'true')}
                    />
                  </div>
                )}
              />
            </>
          )}
        </form>
      </SectionBox>
      {customerId && customer && (
        <MarketingInformation
          customer={customer}
          referralCouponCode={referralCouponCode}
        />
      )}
    </>
  )

  const addressesTab = (
    <>
      {fields.map((address, idx) => (
        <SectionBox key={address.customArrayKey} className={styles.address}>
          <Address
            idx={idx}
            address={address}
            onDelete={handleDeleteAddress}
            onUpdate={handleUpdateAddress}
            onUpdateMixins={handleUpdateAddressMixins}
          />
        </SectionBox>
      ))}
      <PrimaryButton
        className={styles.addAddress}
        disabled={!canManage}
        onClick={() => append({ ...DEFAULT_ADDRESS })}
      >
        {t('customers.addAddress')}
      </PrimaryButton>
    </>
  )

  const tabs: TabItem[] = [
    { id: 'details', label: t('customers.tabs.first'), content: detailsTab },
    {
      id: 'addresses',
      label: t('customers.tabs.second'),
      disabled: !customerId,
      content: addressesTab,
    },
    ...mixinsTabs,
    ...(canViewAuditLog
      ? [
          {
            id: AUDIT_LOG_TAB,
            label: t('auditLog.entityChangelog.tab'),
            disabled: !customerId,
            content: customerId ? (
              <EntityChangelogTab
                entity="customer"
                entityId={customerId}
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
        title={t('customers.singular')}
        subtitle={customerId}
        backTo={customersListPath()}
        moduleActions={
          customerId && (
            <SecondaryButton
              disabled={!canManage}
              onClick={() => setIsDeleteConfirmOpened(true)}
            >
              {t('global.delete')}
            </SecondaryButton>
          )
        }
      />
      <div className={styles.tabs}>
        <Tabs
          data-testid="customer-tabs"
          scrollable
          keepMounted
          tabs={tabs}
          activeTabId={activeTabId}
          onTabChange={onTabChange}
        />
      </div>
      <ConfirmBox
        visible={isDeleteConfirmOpened}
        onAccept={() => void handleDelete()}
        onReject={() => setIsDeleteConfirmOpened(false)}
        loading={isDeleting}
        title={`${t('global.delete')} ${t('customers.singular')}`}
        message={t('customers.actions.deleteMessage')}
        acceptLabel={t('global.delete')}
      />
    </>
  )
}

/**
 * The key remounts the page per customer (and for `add`), so no form state
 * leaks from one customer into the next (create → edit).
 *
 * A host tenant switch leaves the page for the list (MD `useUpdateEffect` on
 * the tenant): the customer belongs to the previous tenant.
 */
const CustomerAddEditPage = () => {
  const { customerId } = useParams()
  const { tenant } = useDashboardContext()
  const openedForTenant = useRef(tenant)

  if (tenant !== openedForTenant.current) {
    return <Navigate to={customersListPath()} replace />
  }

  return <CustomerAddEdit key={customerId ?? 'add'} />
}

export default CustomerAddEditPage
