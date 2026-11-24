import { useCallback, useEffect, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
  Checkbox,
  Dropdown,
  FilterMatchMode,
  InputText,
  PrimaryButton,
  RadioButton,
  SecondaryButton,
  SectionBox,
  useToast,
} from '@emporix/component-library'
import { useSites } from '../../context/SitesProvider'
import { useUIBlocker } from '../../context/UIBlocker'
import { usePermissions } from '../../context/PermissionsProvider'
import { useQuoteData } from '../../context/Quote.provider'
import { useCustomerManagementApi } from '../../hooks/api/customerManagement'
import { useQuotesApi } from '../../hooks/api/quotes'
import { useCustomerApi } from '../../hooks/api/customers'
import { useConfigurationApi } from '../../hooks/api/configuration'
import useCustomNavigate from '../../hooks/useCustomNavigate'
import { useQuoteRestrictions } from '../../hooks/useQuoteRestrictions'
import { PaginationProps } from '../../hooks/usePagination'
import {
  ContactAssignment,
  ContactDetails,
  LegalEntity,
  Location,
} from '../../models/LegalEntity.model'
import { CustomerBusinessModel, QuoteCustomer } from '../../models/Quotes.model'
import { compareObjects } from '../mixins/mixins.utils'
import { EmployeeDomains } from '../../configs/accessControls'
import { StylableProps } from '../../helpers/props'
import { assignHostLocation, HOST_COMPANY_PATH } from '../../helpers/hostUrls'
import { getApiErrorDetails } from '../../helpers/api'
import {
  HOST_CART_PATH,
  HOST_CUSTOMER_PATH,
  quoteDetailPath,
} from '../../constants/paths'
import {
  buildQuoteCreateRequest,
  buildQuoteGeneralEditOperations,
  QuoteGeneralForm,
} from '../../helpers/quoteGeneralForm.helpers'
import InputField from '../shared/InputField'
import EmptyContent from '../shared/EmptyContent'
import LinkWithIcon from '../shared/LinkWithIcon'
import CompaniesSelector from '../shared/CompaniesSelector'
import QuotesTabGeneralAddresses from './QuotesTabGeneralAddresses'
import QuoteChooseCustomerDialog from './QuoteChooseCustomerDialog'
import { hasSameAddresses } from '../../helpers/quotePricing.helpers'
import styles from './QuotesTabGeneral.module.scss'

type ContactOption = {
  label: string
  value: string
  contact: ContactAssignment
}

const CustomerTemplate = (props: {
  contact: ContactAssignment | undefined
}) => {
  const customer = props.contact?.customer
  return customer ? (
    <div>{`${customer.name} ${customer.surname}`}</div>
  ) : (
    <span>--</span>
  )
}

/**
 * MD `QuotesTabGeneral`: business model, company and contact (B2B) or
 * customer (B2C), restriction, cart link and the shipping / billing address.
 * Creates the draft (then opens it) or saves the changed fields.
 */
const QuotesTabGeneral = (props: StylableProps) => {
  const { className = '' } = props
  const { t } = useTranslation()
  const { currentSite } = useSites()
  const { blockPanel } = useUIBlocker()
  const { getLegalEntities, getLegalEntity } = useCustomerManagementApi()
  const { createQuote, updateQuote } = useQuotesApi()
  const { navigate } = useCustomNavigate()
  const { quote, isQuoteCompleted, refreshData, customer } = useQuoteData()
  const toast = useToast()
  const { hasPermission } = usePermissions()
  const quoteRestrictions = useQuoteRestrictions()
  const canManage = hasPermission(EmployeeDomains.QUOTES_MANAGER)
  const canViewCompanies = hasPermission(EmployeeDomains.COMPANIES_VIEWER)
  const { getRestrictions, getSyncBetweenRestrictionsAndSiteCodes } =
    useConfigurationApi()
  const [restrictionsOptions, setRestrictionsOptions] = useState<
    { label: string; value: string }[]
  >([])
  const [enableSync, setEnableSync] = useState<boolean>(false)
  const previousSiteCodeRef = useRef<string | undefined>(currentSite?.code)
  const hasFullRestrictionAccess = quoteRestrictions === null
  const {
    reset,
    control,
    formState,
    handleSubmit,
    getValues,
    setValue,
    watch,
    resetField,
  } = useForm<QuoteGeneralForm>({
    mode: 'onChange',
    defaultValues: {
      businessModel: CustomerBusinessModel.B2B,
      customer: undefined,
      company: undefined,
      contactPerson: undefined,
      shippingAddressId: '',
      billingAddressId: '',
      sameAddresses: true,
      restriction: currentSite?.code ?? null,
    },
  })
  const [isB2B, setIsB2B] = useState(true)
  const [noAddresses, setNoAddresses] = useState(true)
  const [isMembersDialogOpened, setIsMembersDialogOpened] = useState(false)
  const { syncCustomer } = useCustomerApi()

  const handleCustomerSync = useCallback(
    async (customerId: string) => {
      if (!customerId) {
        console.error('Cannot sync customer: customerId is required')
        return
      }

      try {
        const fetchedCustomer = await syncCustomer(customerId)
        const mappedCustomer: QuoteCustomer = {
          customerId: fetchedCustomer.id || '',
          firstName: fetchedCustomer.firstName,
          lastName: fetchedCustomer.lastName,
          contactEmail: fetchedCustomer.contactEmail,
          addresses: fetchedCustomer.addresses,
        }
        setValue('customer', mappedCustomer, {
          shouldValidate: true,
          shouldDirty: true,
        })
      } catch (e) {
        console.error('Error syncing customer:', e)
        toast.showError(
          t('quotes.toasts.errorFetchCustomers'),
          getApiErrorDetails(e)
        )
      }
    },
    [syncCustomer, setValue, toast, t]
  )

  useEffect(() => {
    if (!quote) return
    void setInitFormValues()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [quote])

  useEffect(() => {
    fetchRestrictions()
    fetchEnableSync()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [quoteRestrictions])

  useEffect(() => {
    if (
      !quote &&
      enableSync &&
      currentSite?.code &&
      previousSiteCodeRef.current !== undefined &&
      currentSite.code !== previousSiteCodeRef.current
    ) {
      setValue('restriction', currentSite.code)
    }
    previousSiteCodeRef.current = currentSite?.code
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [currentSite?.code, enableSync, quote])

  const fetchEnableSync = async () => {
    try {
      const config = await getSyncBetweenRestrictionsAndSiteCodes()
      if (config && typeof config.value === 'boolean') {
        setEnableSync(config.value)
      }
    } catch (error) {
      console.error('Error fetching enableSync configuration:', error)
    }
  }

  const fetchRestrictions = async () => {
    try {
      const config = await getRestrictions()
      if (config && config.value && Array.isArray(config.value)) {
        let options = (config.value as string[]).map((restriction) => ({
          label: restriction,
          value: restriction,
        }))

        if (quoteRestrictions !== null) {
          options = options.filter((option) =>
            quoteRestrictions.includes(option.value)
          )
        }

        setRestrictionsOptions(options)
      }
    } catch (error) {
      console.error('Error fetching restrictions:', error)
    }
  }

  useEffect(() => {
    const sameAddresses = getValues('sameAddresses')
    const shippingAddressId = getValues('shippingAddressId')

    if (sameAddresses) {
      setValue('billingAddressId', shippingAddressId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [watch('shippingAddressId'), watch('sameAddresses')])

  useEffect(() => {
    if (watch('businessModel') === 'B2B') {
      setNoAddresses(!watch('company'))
    } else {
      setNoAddresses(!watch('customer'))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [watch('company'), watch('customer'), watch('businessModel')])

  const resolveCompanyById = useCallback(
    async (legalEntityId: string): Promise<LegalEntity | undefined> => {
      try {
        return (await getLegalEntity(legalEntityId)) as unknown as LegalEntity
      } catch (e) {
        console.error(e)
        toast.showError(
          t('quotes.toasts.errorLegalEntities'),
          getApiErrorDetails(e)
        )
        return undefined
      }
    },
    [getLegalEntity, toast, t]
  )

  const resolveCompanyByName = useCallback(
    async (name: string): Promise<LegalEntity | undefined> => {
      try {
        const { values } = await getLegalEntities(
          {
            currentPage: 1,
            rows: 20,
            filters: {
              name: { value: name, matchMode: FilterMatchMode.CONTAINS },
            },
          } as Partial<PaginationProps>,
          false
        )
        const match = (values as LegalEntity[]).find(
          (company) => company.name === name
        )
        if (!match) return undefined
        return (await getLegalEntity(match.id)) as unknown as LegalEntity
      } catch (e) {
        console.error(e)
        return undefined
      }
    },
    [getLegalEntities, getLegalEntity]
  )

  const setInitFormValues = async () => {
    if (!quote) return
    setIsB2B(quote.businessModel !== 'B2C')

    let company: LegalEntity | undefined
    if (
      quote.businessModel !== 'B2C' &&
      (quote.legalEntityId || quote.company?.name)
    ) {
      blockPanel(true)
      if (quote.legalEntityId) {
        company = await resolveCompanyById(quote.legalEntityId)
      } else if (quote.company?.name) {
        company = await resolveCompanyByName(quote.company.name)
      }
      blockPanel(false)
    }

    reset({
      company,
      contactPerson: company?.contacts?.find(
        (contact) => contact?.customer?.id === quote.customer?.customerId
      ),
      billingAddressId: quote.billingAddress?.id,
      shippingAddressId: quote.shippingAddress?.id,
      // Ticked only when both addresses exist and are the same (COP-7125: a
      // quote may have none).
      sameAddresses: hasSameAddresses(
        quote.shippingAddress,
        quote.billingAddress
      ),
      customer: customer as unknown as QuoteCustomer | undefined,
      businessModel: quote.businessModel,
      restriction: quote.restriction ?? null,
    })

    if (quote.businessModel === 'B2C' && quote.customer?.customerId) {
      handleCustomerSync(quote.customer.customerId)
    }
  }

  const filterAddresses = useCallback(
    (type: string): Location[] => {
      if (watch('businessModel') === 'B2B') {
        return (
          watch('company')?.entitiesAddresses?.filter((address) =>
            address.contactDetails?.tags?.find(
              (tag) => tag.toLowerCase() === type
            )
          ) ?? []
        )
      } else {
        return (
          watch('customer')
            ?.addresses?.filter((address) =>
              address.tags?.find((tag) => tag.toLowerCase() === type)
            )
            .map(
              (address) =>
                ({
                  id: address.id,
                  // The address card shows `name`; MD set only
                  // `contactDetails.name`, so B2C addresses showed no name.
                  name: address.contactName,
                  contactDetails: {
                    id: address.id,
                    name: address.contactName,
                    addressLine1: address.street,
                    addressLine2: address.streetNumber,
                    city: address.city,
                    postCode: address.zipCode,
                    state: address.state,
                    countryCode: address.country,
                  } as unknown as ContactDetails,
                }) as Location
            ) ?? []
        )
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
    [watch('company'), watch('customer'), watch('businessModel')]
  )

  const onSubmitCreate = useCallback(
    async (data: QuoteGeneralForm) => {
      if (quote) return
      const quoteDraft = buildQuoteCreateRequest(data, {
        isB2B,
        siteCode: currentSite?.code,
        currency: currentSite?.currency,
      })

      try {
        blockPanel(true)
        const id = await createQuote(quoteDraft)
        toast.showToast(t('quotes.toasts.successDraftCreate'), '', 'success')
        navigate(quoteDetailPath(id), { replace: true })
      } catch (e: unknown) {
        console.error(e)
        toast.showError(t('quotes.toasts.errorCreate'), getApiErrorDetails(e))
      } finally {
        blockPanel(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
    [formState]
  )

  const onSubmitEdit = useCallback(
    async (data: QuoteGeneralForm) => {
      if (!quote || !formState.defaultValues) return
      const dirtyFields = compareObjects(
        formState.defaultValues as QuoteGeneralForm,
        data
      )
      const updateOperations = buildQuoteGeneralEditOperations(
        data,
        dirtyFields,
        { isB2B, hasLegalEntityId: !!quote.legalEntityId }
      )

      blockPanel(true)
      try {
        await updateQuote(quote.id, updateOperations)
        toast.showToast(t('quotes.toasts.successUpdate'), '', 'success')
        refreshData()
      } catch (e: unknown) {
        console.error(e)
        toast.showError(t('quotes.toasts.errorUpdate'), getApiErrorDetails(e))
      } finally {
        blockPanel(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
    [formState]
  )

  // COP-7125: a company without any location can get a quote; its addresses
  // are added later, before the customer can accept.
  const hasNoLocations = !watch('company')?.entitiesAddresses?.length
  const addressesRequired = !(isB2B && hasNoLocations)

  // Companies is a federated remote of the host: leave for its hash route.
  const NoCompanyAddresses = ({ companyId }: { companyId: string }) => (
    <EmptyContent
      text={t(
        hasNoLocations
          ? 'quotes.tabs.general.noLocationsYet'
          : 'quotes.tabs.general.noLocations'
      )}
      buttonLabel={t('quotes.tabs.general.noLocationsButton')}
      action={() => assignHostLocation(HOST_COMPANY_PATH(companyId))}
    />
  )

  const NoCustomerAddresses = ({ customerId }: { customerId: string }) => (
    <EmptyContent
      text={t('quotes.tabs.general.noAddresses')}
      buttonLabel={t('quotes.tabs.general.noAddressesButton')}
      action={() => assignHostLocation(HOST_CUSTOMER_PATH(customerId))}
    />
  )

  const NoAddressesContent = ({ isModelB2B }: { isModelB2B: boolean }) => (
    <EmptyContent
      text={
        isModelB2B
          ? t('quotes.tabs.general.noCompanySelected')
          : t('quotes.tabs.general.noCustomerSelected')
      }
    />
  )

  const contactOptions = (
    watch('company')?.contacts?.filter((c) => c.customer) ?? []
  ).map(
    (contact): ContactOption => ({
      // MD's `optionLabel` names no field, so the label stays empty.
      label: '',
      value: contact.id,
      contact,
    })
  )

  return (
    <>
      <div className={className}>
        {/* The status box (MD showed it here) is above the tabs now, see
            `QuotesAddEdit.page.tsx`. */}
        <SectionBox
          className={styles.detailsSection}
          name={t('quotes.tabs.general.details')}
          actions={
            <div className={styles.actions}>
              <SecondaryButton
                disabled={!formState.isDirty || !canManage}
                onClick={() => setInitFormValues()}
              >
                {t('global.discard')}
              </SecondaryButton>
              <PrimaryButton
                disabled={
                  !formState.isValid ||
                  !formState.isDirty ||
                  // The address pickers only exist when there are addresses;
                  // the Quote Service needs both ids (MD saved without them),
                  // except for a company without locations (COP-7125).
                  (addressesRequired &&
                    (!watch('shippingAddressId') ||
                      !watch('billingAddressId'))) ||
                  // A new quote takes its site and currency from the selected
                  // site (MD let a draft go out before one was selected).
                  (!quote && !currentSite?.code) ||
                  isQuoteCompleted ||
                  !canManage
                }
                onClick={handleSubmit(quote ? onSubmitEdit : onSubmitCreate)}
              >
                {t('global.save')}
              </PrimaryButton>
            </div>
          }
        >
          <div className={styles.details}>
            <div className={styles.fields}>
              <InputField
                label={t('quotes.tabs.general.businessModel')}
                className={styles.field}
                required={true}
              >
                <Controller
                  name="businessModel"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <div>
                      <div className={styles.radioRow}>
                        <RadioButton
                          inputId="b2b"
                          name="businessModel"
                          value="B2B"
                          label="B2B"
                          onChange={() => {
                            setValue('businessModel', CustomerBusinessModel.B2B)
                            resetField('customer')
                            resetField('shippingAddressId')
                            resetField('billingAddressId')
                            setIsB2B(true)
                            field.onChange('B2B')
                          }}
                          checked={field.value === 'B2B'}
                        />
                      </div>
                      <div>
                        <RadioButton
                          inputId="b2c"
                          name="businessModel"
                          value="B2C"
                          label="B2C"
                          onChange={() => {
                            setValue('businessModel', CustomerBusinessModel.B2C)
                            resetField('company')
                            resetField('contactPerson')
                            resetField('customer')
                            resetField('shippingAddressId')
                            resetField('billingAddressId')
                            setIsB2B(false)
                            field.onChange('B2C')
                          }}
                          checked={field.value === 'B2C'}
                        />
                      </div>
                    </div>
                  )}
                />
              </InputField>

              {isB2B ? (
                <div className={styles.companyRow}>
                  <InputField
                    label={t('quotes.tabs.general.company')}
                    className={styles.field}
                    required={true}
                  >
                    <Controller
                      name="company"
                      control={control}
                      rules={{ required: true }}
                      render={({ field }) => (
                        <CompaniesSelector
                          className={styles.fullWidth}
                          value={field.value?.id}
                          disabled={isQuoteCompleted || !canManage}
                          canView={canViewCompanies}
                          onChange={async (value) => {
                            const id = Array.isArray(value) ? value[0] : value
                            setValue('contactPerson', undefined)
                            setValue('shippingAddressId', '')
                            setValue('billingAddressId', '')
                            if (!id) {
                              field.onChange(undefined)
                              return
                            }
                            const company = await resolveCompanyById(id)
                            field.onChange(company)
                          }}
                        />
                      )}
                    />
                  </InputField>
                  <InputField
                    label={t('quotes.tabs.general.contactPerson')}
                    className={styles.field}
                    required={true}
                  >
                    <Controller
                      name="contactPerson"
                      control={control}
                      rules={{ required: true }}
                      render={({ field }) => (
                        <div className={styles.contactRow}>
                          <Dropdown<ContactOption>
                            className={styles.contactDropdown}
                            disabled={
                              isQuoteCompleted ||
                              !canManage ||
                              !canViewCompanies
                            }
                            placeholder={
                              !canViewCompanies ? t('global.noPermissions') : ''
                            }
                            options={contactOptions}
                            value={field.value?.id ?? null}
                            itemTemplate={(option) => (
                              <CustomerTemplate contact={option.contact} />
                            )}
                            valueTemplate={
                              canViewCompanies
                                ? (option) => (
                                    <CustomerTemplate
                                      contact={option?.contact}
                                    />
                                  )
                                : undefined
                            }
                            onChange={(e) => {
                              field.onChange(
                                contactOptions.find(
                                  (option) => option.value === e.value
                                )?.contact
                              )
                            }}
                            data-testid="quote-contact-person"
                          />
                          <div className={styles.contactEmail}>
                            {field.value?.customer?.email}
                          </div>
                        </div>
                      )}
                    />
                  </InputField>
                </div>
              ) : (
                <InputField
                  label={t('quotes.tabs.general.customer')}
                  name="quote-customer-name-input"
                  className={styles.field}
                  required={true}
                >
                  <Controller
                    name="customer"
                    rules={{ required: true }}
                    control={control}
                    render={({ field }) => (
                      <div>
                        <InputText
                          inputId="quote-customer-name-input"
                          readOnly={true}
                          className={styles.customerInput}
                          value={
                            (field.value?.firstName ?? '') +
                            ' ' +
                            (field.value?.lastName ?? '')
                          }
                          data-testid="quote-customer-name"
                        />
                        <PrimaryButton
                          disabled={!canManage}
                          className={styles.customerButton}
                          onClick={() => setIsMembersDialogOpened(true)}
                        >
                          {t('quotes.tabs.general.chooseCustomer')}
                        </PrimaryButton>
                      </div>
                    )}
                  />
                </InputField>
              )}

              <InputField
                label={t('quotes.tabs.general.restriction')}
                required={!hasFullRestrictionAccess}
              >
                <Controller
                  name="restriction"
                  control={control}
                  rules={
                    hasFullRestrictionAccess
                      ? undefined
                      : {
                          validate: (value) =>
                            value !== null &&
                            value !== undefined &&
                            value !== '',
                        }
                  }
                  render={({ field }) => {
                    const isDisabled =
                      !canManage ||
                      isQuoteCompleted ||
                      (!hasFullRestrictionAccess && enableSync)

                    return (
                      <Dropdown
                        disabled={isDisabled}
                        filter
                        showClear={hasFullRestrictionAccess}
                        clearAriaLabel={t('global.clear')}
                        placeholder=""
                        options={restrictionsOptions}
                        value={field.value ?? null}
                        onChange={(e) => field.onChange(e.value ?? null)}
                        data-testid="quote-restriction"
                      />
                    )
                  }}
                />
              </InputField>
            </div>

            <div className={styles.side}>
              {quote?.cartId && (
                <div className={styles.cart}>
                  <div className={styles.cartLabel}>
                    {t('quotes.tabs.general.cartNumber')}
                  </div>
                  {/* Carts live in the host; a `backTo` cannot cross back. */}
                  <LinkWithIcon
                    label={quote.cartId}
                    hostHref={HOST_CART_PATH(quote.cartId)}
                  />
                </div>
              )}
            </div>
          </div>
        </SectionBox>

        <SectionBox
          name={t(`quotes.tabs.general.${isB2B ? 'locations' : 'addresses'}`)}
        >
          {noAddresses ? (
            <NoAddressesContent isModelB2B={isB2B} />
          ) : filterAddresses('shipping')?.length !== 0 ? (
            <>
              <InputField
                label={t('quotes.tabs.general.shippingAddress')}
                className={styles.shippingField}
                required={true}
              >
                <QuotesTabGeneralAddresses
                  addresses={filterAddresses('shipping')}
                  control={control}
                  disabled={isQuoteCompleted || !canManage}
                  name="shippingAddressId"
                />
              </InputField>
              <InputField
                label={t('quotes.tabs.general.billingAddress')}
                className={styles.fullWidth}
                required={true}
              >
                <Controller
                  name="sameAddresses"
                  control={control}
                  render={({ field }) => (
                    <div className={styles.checkboxRow}>
                      <Checkbox
                        checked={field.value}
                        onChange={(e) => field.onChange(e.checked)}
                        inputId="sameAddresses"
                        disabled={isQuoteCompleted || !canManage}
                      />
                      <label
                        htmlFor="sameAddresses"
                        className={styles.checkboxLabel}
                      >
                        {t('quotes.tabs.general.sameAddresses')}
                      </label>
                    </div>
                  )}
                />
                {!watch('sameAddresses') && (
                  <QuotesTabGeneralAddresses
                    addresses={filterAddresses('billing')}
                    control={control}
                    disabled={isQuoteCompleted || !canManage}
                    name="billingAddressId"
                  />
                )}
              </InputField>
            </>
          ) : (
            <>
              {isB2B && watch('company') && (
                <NoCompanyAddresses
                  companyId={getValues('company')?.id ?? ''}
                />
              )}
              {!isB2B && watch('customer') && (
                <NoCustomerAddresses
                  customerId={getValues('customer')?.customerId ?? ''}
                />
              )}
            </>
          )}
        </SectionBox>
      </div>
      {isMembersDialogOpened && (
        <QuoteChooseCustomerDialog
          onHide={() => setIsMembersDialogOpened(false)}
          onCustomerSelect={(selectedCustomer) => {
            if (selectedCustomer?.id) {
              handleCustomerSync(selectedCustomer.id)
            }
          }}
        />
      )}
    </>
  )
}

export default QuotesTabGeneral
