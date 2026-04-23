import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { ProgressSpinner } from 'primereact/progressspinner'
import { SelectButton } from 'primereact/selectbutton'
import { useTranslation } from 'react-i18next'
import { useLocation, useParams } from 'react-router-dom'
import { useCustomerApi } from '../api/customers'
import InputField from '../components/InputField'
import {
  Customer,
  CustomerAddress,
  CustomerBusinessModel,
  DEFAULT_ADDRESS,
} from '../models/Customer'
import { useUIBlocker } from '../context/UIBlcoker'
import ConfirmBox from '../components/ConfirmBox'
import { TabPanel, TabView } from 'primereact/tabview'
import Address from '../components/customers/Address'
import SectionBox from '../components/SectionBox'
import { useTabs } from '../hooks/useTabs'
import HeaderSection from '../components/shared/HeaderSection'
import useUpdateEffect from '../hooks/useUpdateEffect'
import { useCurrencies } from '../hooks/useCurrencies'
import { Dropdown } from 'primereact/dropdown'
import { useSites } from '../context/SitesProvider'
import { useToast } from '../context/ToastProvider'
import useCustomNavigate from '../hooks/useCustomNavigate'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { useCurrencyContext } from '../context/CurrencyProvider'
import AssistedBuying from '../components/customers/AssistedBuying'
import { deepClone } from '../helpers/utils'
import { MixinsFormMetadata } from '../components/mixins/helpers'
import useMixinsForm from '../components/mixins/useMixinsForm'
import { SchemaType } from '../models/Schema'
import { Mixins } from '../models/Mixins'
import { usePermissions } from '../context/PermissionsProvider'
import { useRestrictions } from '../context/RestrictionsProvider'
import { useTenant } from '../context/TenantProvider'
import { Calendar } from 'primereact/calendar'
import { useCouponsApi } from '../api/coupons'
import FormGrid from '../components/FormGrid'
import DateValue from '../components/DateValue'
import FormGridRow from '../components/FormGridRow'
import { InputSwitch } from 'primereact/inputswitch'
import { Password } from 'primereact/password'
import { useIamApi } from '../api/iam'
import { Group } from '../models/Groups'
import { useLocalizedValue } from '../hooks/useLocalizedValue'
import { Chips } from 'primereact/chips'
import { LegalEntity } from '../models/LegalEntity'
import { useSegmentsApi } from '../api/segments'
import { Segment } from '../models/Segment'
import { SEGMENTS_BASE_PATH } from '../router/Segments.routes'
import { useConfigurationApi } from '../api/configuration'

export const TOGGLE = [
  { name: 'Yes', value: true },
  { name: 'No', value: false },
]

const TOGGLE_TITLE = [
  { name: 'MRS', value: 'MRS' },
  { name: 'MS', value: 'MS' },
  { name: 'MR', value: 'MR' },
]

const DEFAULT_CUSTOMER: Customer = {
  customerNumber: '',
  firstName: '',
  lastName: '',
  businessModel: CustomerBusinessModel.B2B,
  b2b: {
    legalEntities: [],
    companyRegistrationId: null,
  },
  active: false,
  contactEmail: '',
  contactPhone: '',
  onHold: false,
  preferredCurrency: '',
  preferredLanguage: '',
  preferredSite: '',
  title: 'MR',
  metadata: {
    mixins: {},
    version: 1,
  },
  addresses: [],
}

const TABS = ['details', 'addresses']

const CustomersAddEdit = () => {
  const { customerId } = useParams()
  const location = useLocation()
  const { navigate } = useCustomNavigate()
  const { getReferralCoupon } = useCouponsApi()
  const [customer, setCustomer] = useState<Customer>()
  const { t, i18n } = useTranslation()
  const [isDeletingProducts, setIsDeletingProducts] = useState(false)
  const [isDeleteConfirmOpened, setIsDeleteConfirmOpened] = useState(false)
  const [referralCouponCode, setReferralCouponCode] = useState('')
  const [isAutogeneratePassword, setIsAutogeneratePassword] = useState(false)
  const [userGroups, setUserGroups] = useState<Group[]>([])
  const [assignedSegments, setAssignedSegments] = useState<Segment[]>([])
  const [restrictionsOptions, setRestrictionsOptions] = useState<
    { label: string; value: string }[]
  >([])
  const [enableSync, setEnableSync] = useState<boolean>(false)

  const { permissions } = usePermissions()
  const { customerRestrictions } = useRestrictions()
  const canBeManaged = permissions?.customers?.manager
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

  const { selectedCurrency } = useCurrencyContext()
  const { getAllGroups4User } = useIamApi()
  const { getContentLangValue } = useLocalizedValue()
  const { getAllSegments } = useSegmentsApi()
  const { getRestrictions, getSyncBetweenRestrictionsAndSiteCodes } =
    useConfigurationApi()

  /** Leave federated routes and open a path in the host Management Dashboard shell. */
  const openHostRoute = (path: string) => {
    const normalized = path.startsWith('/') ? path : `/${path}`
    window.location.hash = `#${normalized}`
  }

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isValid, isDirty },
  } = useForm<Customer>({
    defaultValues: useMemo(() => {
      if (customer) {
        return {
          ...customer,
        }
      }
      return {
        ...DEFAULT_CUSTOMER,
        preferredCurrency: selectedCurrency?.code || '',
      }
    }, [selectedCurrency, customer]),
  })

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: 'addresses',
    keyName: 'customArrayKey',
  })

  const [isLoading, setIsLoading] = useState(false)

  const { activeIndex, onTabChange } = useTabs(TABS, true)
  const { blockPanel } = useUIBlocker()
  const toast = useToast()
  const { tenant } = useTenant()
  const { getUiLangValue } = useLocalizedValue()

  const { currenciesDropdownOptions } = useCurrencies()
  const { sites } = useSites()

  useEffect(() => {
    if (customerId) {
      ;(async () => {
        try {
          setIsLoading(true)
          const newCustomer = await reloadData()
          setCustomer(newCustomer)
          reset(newCustomer)
        } finally {
          setIsLoading(false)
        }
      })()
    }
  }, [customerId])

  const reloadData = async (): Promise<Customer | undefined> => {
    if (!customerId) return
    const newCustomer = await syncCustomer(customerId)
    if (newCustomer.mixins === undefined) {
      newCustomer.mixins = {}
    }
    if (newCustomer.metadata === undefined) {
      newCustomer.metadata = {}
    }
    if (newCustomer.metadata.mixins === undefined) {
      newCustomer.metadata.mixins = {}
    }
    loadMixins(newCustomer.metadata.mixins, newCustomer.mixins)
    return newCustomer
  }

  const fetchReferralCoupon = async () => {
    if (!customerId) return
    const resp = await getReferralCoupon(customerId)
    setReferralCouponCode(resp?.code || '')
  }

  useEffect(() => {
    ;(async () => {
      await fetchReferralCoupon()
    })()
  }, [customerId])

  useUpdateEffect(() => {
    navigate(`/customers`)
  }, [tenant])

  const handleDelete = useCallback(async () => {
    try {
      blockPanel(true)
      setIsDeletingProducts(true)
      if (customerId) {
        await deleteCustomer(customerId)
        toast.showToast(t('customers.toasts.successDelete'), '', 'success')
        navigate('/customers')
      }
    } finally {
      setIsDeletingProducts(false)
      blockPanel(false)
    }
  }, [customerId])

  const onSubmit = useCallback(
    async (customer: Customer) => {
      try {
        blockPanel(true)

        const customerData = { ...customer }
        customerData.restriction = (customerData.restriction || null) as
          | string
          | null
          | undefined
        if (customerData.password === '') {
          customerData.password = undefined
        }

        if (customerId) {
          await editCustomer(customerData)
          const newCustomer = await reloadData()

          toast.showToast(t('customers.toasts.successUpdate'), '', 'success')
          setCustomer(newCustomer)
          reset(newCustomer)
        } else {
          const responseData = await createCustomer(customerData)
          if (responseData.id) {
            toast.showToast(t('customers.toasts.successCreate'), '', 'success')
            navigate(`/customers/${responseData.id}`)
          }
        }
      } catch (e: any) {
        toast.showError(
          t('customers.toasts.errorSave'),
          e.response.data.message
        )
        console.error(e)
      } finally {
        blockPanel(false)
      }
    },
    [customerId]
  )

  const addNewAddress = useCallback(() => {
    append(DEFAULT_ADDRESS)
  }, [customer])

  const handleDeleteAddress = useCallback(
    async (idx: number, addressId: string) => {
      try {
        blockPanel(true)
        if (!customerId) {
          return
        }
        await deleteCustomerAddress(customerId, addressId)
        const newCustomer = await syncCustomer(customerId)
        setCustomer(newCustomer)
        remove(idx)
      } finally {
        blockPanel(false)
      }
    },
    [customerId]
  )

  const handleUpdateAddress = useCallback(
    async (
      idx: number,
      newAddress: CustomerAddress,
      addressId: string | undefined
    ) => {
      try {
        blockPanel(true)
        if (!customerId) {
          return
        }
        if (addressId !== undefined) {
          await editCustomerAddress(customerId, newAddress)
        } else {
          const creationResponse = await createCustomerAddress(
            customerId,
            newAddress
          )
          newAddress.id = creationResponse.id
        }
        const newCustomer = await syncCustomer(customerId)
        setCustomer(newCustomer)
        update(idx, newAddress)
        toast.showToast(t('customers.toasts.successUpdate'), '', 'success')
      } finally {
        blockPanel(false)
      }
    },
    [customer]
  )

  const handleUpdateAddressMixins = useCallback(
    async (
      idx: number,
      address: CustomerAddress,
      data: Mixins,
      mixinMetadata: MixinsFormMetadata
    ) => {
      if (!customer || !customerId) {
        return
      }
      const { key, url } = mixinMetadata
      if (address.mixins !== undefined) {
        address.mixins[key] = data
      }

      blockPanel(true)
      try {
        await partiallyEditCustomerAddress(customerId as string, {
          id: customer.addresses[idx].id,
          mixins: { ...address.mixins },
          metadata: { mixins: { [key]: url } },
        })
        const newCustomer = await syncCustomer(customerId)
        setCustomer(newCustomer)
        update(idx, address)
        toast.showToast(t('customers.toasts.successUpdate'), '', 'success')
      } catch (e) {
        console.error(e)
      } finally {
        blockPanel(false)
      }
    },
    [customer]
  )

  const saveMixin = async (data: Mixins, mixinMetadata: MixinsFormMetadata) => {
    if (!customer) return
    const { key, url } = mixinMetadata
    const value = deepClone(data)
    const mixins = { ...customer.mixins }
    mixins[key] = value
    const metadataMixins = { ...customer.metadata.mixins }
    if (metadataMixins.mixins === undefined) {
      metadataMixins.mixins = {}
    }
    metadataMixins.mixins[key] = url

    try {
      setIsLoading(true)
      await patchCustomer({
        id: customer.id as string,
        mixins: { ...mixins },
        metadata: { ...metadataMixins },
      })
      await reloadData()
      toast.showToast(t('customers.toasts.successUpdate'), '', 'success')
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const { loadMixins, mixinsTabs } = useMixinsForm({
    type: SchemaType.CUSTOMER,
    onEdit: saveMixin,
    managerPermissions: canBeManaged,
  })

  const sitesDropdownOptions = useMemo(() => {
    let filteredSites = sites || []

    if (enableSync && customerRestrictions !== null) {
      filteredSites = filteredSites.filter((site) =>
        customerRestrictions.includes(site.code)
      )
    }

    return filteredSites.map((site) => ({
      label: `${site.name} - ${site.code}`,
      value: site.code,
    }))
  }, [sites, enableSync, customerRestrictions])

  const marketingMixin = useMemo(() => {
    return customer?.mixins?.marketing
  }, [customer])

  const generalAttributesMixin = useMemo(() => {
    return customer?.mixins?.generalAttributes
  }, [customer])

  const customerNewsletterMixin = useMemo(() => {
    return customer?.mixins?.customerNewsletter
  }, [customer])

  const generateRandomPassword = useCallback(() => {
    const length = 12
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    return password
  }, [])

  const handleAutogenerateChange = useCallback(
    (checked: boolean) => {
      setIsAutogeneratePassword(checked)
      if (checked) {
        const randomPassword = generateRandomPassword()
        setValue('password', randomPassword, {
          shouldValidate: true,
          shouldDirty: true,
        })
      } else {
        setValue('password', '', { shouldValidate: true, shouldDirty: true })
      }
    },
    [generateRandomPassword, setValue]
  )

  const fetchUserGroups = useCallback(async () => {
    if (!customer?.id) return

    try {
      const groups = await getAllGroups4User(customer.id)
      setUserGroups(groups)
    } catch (error) {
      console.error('Error fetching user groups:', error)
      toast.showToast(t('customers.toasts.errorSave'), '', 'error')
    }
  }, [customer?.id, getAllGroups4User])

  useEffect(() => {
    if (customer?.id) {
      fetchUserGroups()
    }
  }, [customer?.id, fetchUserGroups])

  const fetchSegments = useCallback(async () => {
    if (!customer?.id) return
    try {
      const segments = await getAllSegments(undefined, undefined, {
        customerId: customer.id,
      })
      setAssignedSegments(segments)
    } catch (e) {
      console.error('Error fetching segments:', e)
    }
  }, [customer?.id])

  useEffect(() => {
    if (customer?.id) {
      fetchSegments()
    }
  }, [customer?.id])

  const fetchEnableSync = useCallback(async () => {
    try {
      const config = await getSyncBetweenRestrictionsAndSiteCodes()
      if (config && typeof config.value === 'boolean') {
        setEnableSync(config.value)
      }
    } catch (error) {
      console.error('Error fetching enableSync configuration:', error)
    }
  }, [getSyncBetweenRestrictionsAndSiteCodes])

  const fetchRestrictions = useCallback(async () => {
    try {
      const config = await getRestrictions()
      if (config && config.value && Array.isArray(config.value)) {
        let options = config.value.map((restriction: string) => ({
          label: restriction,
          value: restriction,
        }))

        if (customerRestrictions !== null) {
          options = options.filter((option) =>
            customerRestrictions.includes(option.value)
          )
        }
        setRestrictionsOptions(options)
      }
    } catch (error) {
      console.error('Error fetching restrictions:', error)
    }
  }, [getRestrictions, customerRestrictions])

  useEffect(() => {
    fetchRestrictions()
    fetchEnableSync()
  }, [customerRestrictions])

  useEffect(() => {
    const subscription = watch((value: any, { name }: any) => {
      if (name === 'preferredSite' && enableSync) {
        setValue('restriction', value.preferredSite || null)
      }
    })
    return () => subscription.unsubscribe()
  }, [watch, enableSync, setValue])

  const getGroupLink = useCallback(
    (groupId: string) => {
      return customer?.id
        ? `/administration/customer-groups/groups/${groupId}?customerId=${customer.id}`
        : `/administration/customer-groups/groups/${groupId}`
    },
    [navigate, customer?.id]
  )

  const getCompanyLink = useCallback(
    (companyId: string) => {
      return customer?.id
        ? `/apps/management/companies/${companyId}?customerId=${customer.id}`
        : `/apps/management/companies/${companyId}`
    },
    [navigate, customer?.id]
  )

  if (isLoading) {
    return <ProgressSpinner />
  }
  return (
    <div className="module">
      <HeaderSection
        title={t('customers.singular')}
        subtitle={customerId}
        backTo={'/customers'}
        moduleActions={
          <>
            {customerId && (
              <Button
                disabled={!canBeManaged}
                className="ml-2 p-button-secondary"
                label={t('global.delete')}
                onClick={() => {
                  setIsDeleteConfirmOpened(true)
                }}
              />
            )}
          </>
        }
      />
      <TabView scrollable activeIndex={activeIndex} onTabChange={onTabChange}>
        <TabPanel header={t('customers.tabs.first')}>
          <div className="flex gap-2 align-items-center justify-content-end">
            {customerId && <AssistedBuying customerNumber={customerId} />}
            <Button
              className="p-button-secondary"
              label={t('global.discard')}
              disabled={!isDirty || !canBeManaged}
              onClick={() => {
                reset()
              }}
            />
            {activeIndex === 0 && (
              <Button
                disabled={!isDirty || !isValid || !canBeManaged}
                label={t('global.save')}
                onClick={handleSubmit(onSubmit)}
              />
            )}
          </div>
          <SectionBox className="mb-6" name={t('customers.details.subtitle')}>
            <form className="grid">
              <div className="grid col-12">
                <Controller
                  control={control}
                  name="id"
                  render={({ field }) => (
                    <InputField
                      label={t('customers.details.id')}
                      tooltip={t('customers.details.tooltip.id')}
                      className={customerId !== undefined ? 'col-3' : 'col-12'}
                    >
                      <InputText
                        disabled={!canBeManaged || customerId !== undefined}
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </InputField>
                  )}
                />
                {customer?.customerNumber && (
                  <InputField
                    label={t('customers.details.customerNumber')}
                    className="col-4"
                  >
                    <InputText
                      value={customer.customerNumber}
                      disabled={true}
                    />
                  </InputField>
                )}
                {customer?.metadataCreatedAt && (
                  <InputField
                    className={'col-3'}
                    label={t('customers.details.creationDate')}
                  >
                    <Calendar
                      key={`creation-date-${i18n.language}`}
                      disabled={true}
                      showTime
                      hourFormat="24"
                      value={new Date(customer.metadataCreatedAt)}
                      locale={i18n.language}
                    />
                  </InputField>
                )}
                {customer?.lastLogin && (
                  <InputField
                    className={'col-2'}
                    label={t('customers.details.lastLogin')}
                  >
                    <Calendar
                      key={`last-login-${i18n.language}`}
                      disabled={true}
                      showTime
                      hourFormat="24"
                      value={new Date(customer.lastLogin)}
                      locale={i18n.language}
                    />
                  </InputField>
                )}
              </div>
              <div className="col-12 grid">
                <Controller
                  control={control}
                  name="title"
                  render={({ field }) => (
                    <InputField
                      label={t('customers.details.title')}
                      className="col-3"
                    >
                      <SelectButton
                        disabled={!canBeManaged}
                        optionLabel="name"
                        value={field.value}
                        options={TOGGLE_TITLE}
                        onChange={(e) => field.onChange(e.value)}
                      />
                    </InputField>
                  )}
                />
                <Controller
                  control={control}
                  name="firstName"
                  render={({ field }) => (
                    <InputField
                      label={t('customers.details.firstName')}
                      className="col-3"
                    >
                      <InputText
                        disabled={!canBeManaged}
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </InputField>
                  )}
                />
                <Controller
                  control={control}
                  name="lastName"
                  render={({ field }) => {
                    return (
                      <InputField
                        label={t('customers.details.lastName')}
                        className="col-4"
                      >
                        <InputText
                          disabled={!canBeManaged}
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </InputField>
                    )
                  }}
                />
                <Controller
                  control={control}
                  name="restriction"
                  render={({ field }) => {
                    const isDisabled =
                      !canBeManaged || (!hasFullRestrictionAccess && enableSync)

                    return (
                      <InputField
                        label={t('customers.details.restriction')}
                        className="col-2"
                      >
                        <Dropdown
                          appendTo="self"
                          disabled={isDisabled}
                          filter
                          showClear={hasFullRestrictionAccess}
                          options={restrictionsOptions}
                          value={field.value}
                          onChange={(e) => field.onChange(e.value ?? null)}
                        />
                      </InputField>
                    )
                  }}
                />
              </div>
              <div className="grid col-12">
                <InputField
                  label={t('customers.details.assignedSegments')}
                  className="col-4"
                >
                  <Chips
                    readOnly
                    className="p-0"
                    value={assignedSegments}
                    removable={false}
                    placeholder={
                      assignedSegments.length > 0
                        ? ''
                        : t('customers.details.noSegments')
                    }
                    itemTemplate={(s: Segment) => (
                      <span
                        className="cursor-pointer text-primary"
                        role="link"
                        tabIndex={0}
                        onKeyDown={(ev) => {
                          if (ev.key === 'Enter')
                            openHostRoute(
                              `${SEGMENTS_BASE_PATH}/${s.id}?backTo=${encodeURIComponent(location.pathname + location.search)}`
                            )
                        }}
                        onClick={() =>
                          openHostRoute(
                            `${SEGMENTS_BASE_PATH}/${s.id}?backTo=${encodeURIComponent(location.pathname + location.search)}`
                          )
                        }
                      >
                        {getUiLangValue(s.name)}
                      </span>
                    )}
                  />
                </InputField>

                <Controller
                  control={control}
                  name="b2b.legalEntities"
                  render={({ field }) => (
                    <InputField
                      label={t('customers.details.assignedCompanies')}
                      className="col-4"
                    >
                      <Chips
                        readOnly
                        className="p-0"
                        value={field.value}
                        removable={false}
                        placeholder={
                          field?.value?.length > 0
                            ? ''
                            : t('customers.details.noCompanies')
                        }
                        itemTemplate={(e: LegalEntity) => (
                          <span
                            className="cursor-pointer text-primary"
                            role="link"
                            tabIndex={0}
                            onKeyDown={(ev) => {
                              if (ev.key === 'Enter')
                                openHostRoute(getCompanyLink(e.id))
                            }}
                            onClick={() => openHostRoute(getCompanyLink(e.id))}
                          >
                            {e.name}
                          </span>
                        )}
                      />
                    </InputField>
                  )}
                />
                <InputField
                  label={t('customers.details.groups')}
                  className="col-4"
                >
                  <Chips
                    readOnly
                    value={userGroups}
                    removable={false}
                    placeholder={
                      userGroups?.length < 1
                        ? t('customers.details.noGroups')
                        : ''
                    }
                    itemTemplate={(g: Group) => (
                      <span
                        className="cursor-pointer text-primary"
                        role="link"
                        tabIndex={0}
                        onKeyDown={(ev) => {
                          if (ev.key === 'Enter')
                            openHostRoute(getGroupLink(g.id))
                        }}
                        onClick={() => openHostRoute(getGroupLink(g.id))}
                      >
                        {getContentLangValue(g.name)}
                      </span>
                    )}
                  />
                </InputField>
                {!customerId && (
                  <Controller
                    control={control}
                    name="password"
                    rules={{
                      minLength: 6,
                    }}
                    render={({ field }) => (
                      <InputField
                        label={t('customers.details.password')}
                        tooltip={t('customers.details.tooltip.password')}
                        className="col-4"
                      >
                        <Password
                          disabled={!canBeManaged || isAutogeneratePassword}
                          value={field.value || ''}
                          feedback={false}
                          toggleMask={true}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </InputField>
                    )}
                  />
                )}
                {!customerId && (
                  <InputField
                    label={t('customers.details.autogenerate')}
                    tooltip={t('customers.details.tooltip.autogenerate')}
                    className="col-2"
                  >
                    <InputSwitch
                      disabled={!canBeManaged}
                      checked={isAutogeneratePassword}
                      onChange={(e) => handleAutogenerateChange(e.value)}
                    />
                  </InputField>
                )}
              </div>
              <div className="grid col-12">
                <Controller
                  control={control}
                  name="preferredSite"
                  rules={{
                    required: enableSync && !hasFullRestrictionAccess,
                  }}
                  render={({ field }) => (
                    <InputField
                      label={t('customers.details.preferredSite')}
                      className="col-6"
                      required={enableSync && !hasFullRestrictionAccess}
                    >
                      <Dropdown
                        appendTo="self"
                        disabled={!canBeManaged}
                        filter
                        options={sitesDropdownOptions}
                        value={field.value}
                        onChange={(e) => field.onChange(e.value)}
                      />
                    </InputField>
                  )}
                />
                <Controller
                  name="preferredCurrency"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => {
                    return (
                      <InputField
                        required
                        label={t('customers.details.preferredCurrency')}
                        className="col-6"
                      >
                        <Dropdown
                          appendTo="self"
                          disabled={!canBeManaged}
                          filter
                          options={currenciesDropdownOptions}
                          value={field.value}
                          onChange={(e) => field.onChange(e.value)}
                        />
                      </InputField>
                    )
                  }}
                />
              </div>
              <div className="grid col-12">
                <Controller
                  name="contactEmail"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <InputField
                      label={t('customers.details.contactEmail')}
                      className="col-6"
                      required={true}
                      error={errors.contactEmail?.message}
                    >
                      <InputText
                        disabled={!canBeManaged}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </InputField>
                  )}
                />
                <Controller
                  control={control}
                  name="contactPhone"
                  render={({ field }) => (
                    <InputField
                      label={t('customers.details.contactPhone')}
                      className="col-6"
                    >
                      <InputText
                        disabled={!canBeManaged}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </InputField>
                  )}
                />
              </div>
              {customerId && (
                <div className="grid col-12">
                  <Controller
                    control={control}
                    name="onHold"
                    render={({ field }) => (
                      <InputField
                        label={t('customers.details.onHold')}
                        className="col-2"
                      >
                        <SelectButton
                          disabled={!canBeManaged}
                          optionLabel="name"
                          value={field.value}
                          options={TOGGLE}
                          onChange={(e) => field.onChange(e.value)}
                        />
                      </InputField>
                    )}
                  />
                  <Controller
                    control={control}
                    name="active"
                    render={({ field }) => (
                      <InputField
                        label={t('customers.details.active')}
                        className="col-2"
                      >
                        <SelectButton
                          disabled={!canBeManaged}
                          optionLabel="name"
                          value={field.value}
                          options={TOGGLE}
                          onChange={(e) => field.onChange(e.value)}
                        />
                      </InputField>
                    )}
                  />
                </div>
              )}
            </form>
          </SectionBox>
          {customerId && (
            <>
              <SectionBox name={t('customers.marketing.subtitle')}>
                <FormGrid>
                  <FormGridRow>
                    <InputField label={t('customers.details.bonusPoints')}>
                      {marketingMixin?.bonusPoints || 0}
                    </InputField>
                    <InputField
                      label={t('customers.details.referralCouponCode')}
                    >
                      {referralCouponCode || '--'}
                    </InputField>
                    <InputField label={t('customers.details.registered')}>
                      <DateValue date={customerNewsletterMixin?.signOnDate} />
                    </InputField>
                  </FormGridRow>
                  <FormGridRow>
                    <InputField label={t('customers.details.unregistered')}>
                      <DateValue date={customerNewsletterMixin?.signOffDate} />
                    </InputField>
                    <InputField label={t('customers.details.lastDeliveryDate')}>
                      <DateValue
                        date={generalAttributesMixin?.lastDeliveryDate}
                      />
                    </InputField>
                    <InputField label={t('customers.details.lastOrderDate')}>
                      <DateValue date={generalAttributesMixin?.lastOrderDate} />
                    </InputField>
                  </FormGridRow>
                </FormGrid>
              </SectionBox>
            </>
          )}
        </TabPanel>
        <TabPanel disabled={!customerId} header={t('customers.tabs.second')}>
          {fields.map((address, idx) => {
            return (
              <SectionBox key={address.customArrayKey} className={'mb-2'}>
                <div className="grid">
                  <Address
                    idx={idx}
                    address={address}
                    onDelete={handleDeleteAddress}
                    onUpdate={handleUpdateAddress}
                    onUpdateMixins={handleUpdateAddressMixins}
                  />
                </div>
              </SectionBox>
            )
          })}
          <Button
            disabled={!canBeManaged}
            className="my-2"
            label={t('customers.addAddress')}
            onClick={addNewAddress}
          />
        </TabPanel>
        {mixinsTabs}
      </TabView>
      <ConfirmBox
        visible={isDeleteConfirmOpened}
        onAccept={handleDelete}
        onReject={() => {
          setIsDeleteConfirmOpened(false)
        }}
        loading={isDeletingProducts}
        title="customers.actions.deleteTitle"
        message="customers.actions.deleteDescription"
      />
    </div>
  )
}
export default CustomersAddEdit
