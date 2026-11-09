import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Controller, useForm } from 'react-hook-form'
import {
  Dropdown,
  InputSwitch,
  InputText,
  PrimaryButton,
  SecondaryButton,
  SectionBox,
  SelectButton,
  useToast,
} from '@emporix/component-library'
import HeaderSection from '../components/shared/HeaderSection'
import InputField from '../components/shared/InputField'
import { useCustomerManagementApi } from '../hooks/api/customerManagement'
import { useCustomerApi } from '../hooks/api/customers'
import { useCountries } from '../hooks/useCountries'
import useCustomNavigate from '../hooks/useCustomNavigate'
import { usePermissions } from '../context/PermissionsProvider'
import { EmployeeDomains } from '../configs/accessControls'
import {
  ContactAssignment,
  ContactType,
  LegalEntity,
} from '../models/LegalEntity.model'
import {
  Customer,
  CustomerAddress,
  CustomerBusinessModel,
  DEFAULT_ADDRESS,
} from '../models/Customer.model'
import { Metadata } from '../models/Metadata.model'
import { getApiErrorDetails, getApiErrorMessage } from '../helpers/api'
import {
  companyDetailPath,
  contactEditPath,
  HOST_CUSTOMER_PATH,
} from '../constants/paths'
import styles from './ContactAddEdit.page.module.scss'

export interface ContactAssignmentForm {
  id: string
  legalEntity: LegalEntity
  type: ContactType
  primary: boolean
  customer: Customer
  address: CustomerAddress
  metadata?: Metadata
}

const TOGGLE_TITLE = [
  { name: 'MRS', value: 'MRS' },
  { name: 'MS', value: 'MS' },
  { name: 'MR', value: 'MR' },
]

const createDefaultContact = (): Customer => ({
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
  title: 'MR',
  type: 'CONTACT',
  metadata: {
    mixins: {},
    version: 1,
  },
  addresses: [],
})

const formToDto = (form: ContactAssignmentForm): ContactAssignment => ({
  id: form.id,
  type: form.type,
  primary: form.primary,
  metadata: form.metadata,
  legalEntity: form.legalEntity,
  customer: {
    id: form.customer?.id,
    name: form.customer?.firstName,
    surname: form.customer?.lastName,
    email: form.customer?.contactEmail,
    phone: form.customer?.contactPhone,
  },
})

const ContactAddEditPage = () => {
  const { companyId, contactAssignmentId } = useParams()
  const [searchParams] = useSearchParams()
  const { i18n, t } = useTranslation()
  const toast = useToast()
  const [legalEntity, setLegalEntity] = useState<LegalEntity>()
  const [currentAssignment, setCurrentAssignment] =
    useState<ContactAssignment>()
  const { activeCountriesDropdownOptions } = useCountries()
  const {
    getLegalEntity,
    createContactWithAssignment,
    addApprovalGroupContact,
    getContactAssignment,
    updateContactWithAssignment,
  } = useCustomerManagementApi()
  const {
    editCustomer,
    createCustomer,
    patchCustomer,
    createCustomerAddress,
    editCustomerAddress,
    syncCustomer,
  } = useCustomerApi()
  const { simpleNavigate } = useCustomNavigate()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.COMPANIES_MANAGER)
  const canManageCustomers = hasPermission(EmployeeDomains.CUSTOMERS_MANAGER)
  const readOnly = !canManage || !canManageCustomers

  const {
    control,
    reset,
    setValue,
    handleSubmit,
    formState: { isValid, isDirty },
  } = useForm<ContactAssignmentForm>({
    defaultValues: {
      type: ContactType.CONTACT,
      primary: searchParams.get('primary') === 'true',
      customer: createDefaultContact(),
      address: DEFAULT_ADDRESS,
    },
  })

  useEffect(() => {
    ;(async () => {
      if (companyId) {
        const company = await getLegalEntity(companyId)
        setLegalEntity(company)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [companyId])

  // Auto-populate customer restriction from company's first restriction when creating a new contact
  useEffect(() => {
    if (
      !contactAssignmentId &&
      legalEntity?.restrictions &&
      legalEntity.restrictions.length > 0
    ) {
      setValue('customer.restriction', legalEntity.restrictions[0])
    }
  }, [legalEntity, contactAssignmentId, setValue])

  const loadData = async () => {
    if (contactAssignmentId) {
      const assignment = await getContactAssignment(contactAssignmentId)
      if (assignment.customer.id) {
        const customer = await syncCustomer(assignment.customer.id)
        setCurrentAssignment(assignment)
        reset({
          id: assignment.id,
          primary: assignment.primary,
          type: assignment.type,
          legalEntity: assignment.legalEntity,
          customer: customer,
          address: customer.addresses[0],
          metadata: assignment.metadata,
        })
      }
    }
  }

  useEffect(() => {
    ;(async () => {
      await loadData()
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [contactAssignmentId])

  const contactTypeOptions = useMemo(
    () => [
      {
        value: ContactType.CONTACT,
        label: t('contacts.type.contact'),
      },
      {
        value: ContactType.LOGISTICS,
        label: t('contacts.type.logistics'),
      },
      {
        value: ContactType.BILLING,
        label: t('contacts.type.billing'),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rebuilt per language
    [i18n.language]
  )

  const submit = useCallback(
    async (data: ContactAssignmentForm) => {
      try {
        if (legalEntity) {
          if (currentAssignment?.customer?.id) {
            await updateContactWithAssignment(formToDto(data))
            const freshCustomer = await syncCustomer(
              currentAssignment.customer.id
            )
            const updatedData = { ...data, customer: freshCustomer }
            await editCustomer(updatedData.customer)
            await editCustomerAddress(
              currentAssignment.customer.id,
              updatedData.address
            )
            await loadData()
          } else {
            const customerResponse = await createCustomer(data.customer)
            data.address.contactName = `${data.customer.firstName} ${data.customer.lastName}`
            await createCustomerAddress(customerResponse.id, data.address)
            data.legalEntity = legalEntity
            data.customer.id = customerResponse.id
            const assignmentId = await createContactWithAssignment(
              formToDto(data)
            )
            if (searchParams.get('approval') === 'true') {
              await addApprovalGroupContact(legalEntity, [{ id: assignmentId }])
            }
            simpleNavigate(contactEditPath(legalEntity.id, assignmentId))
          }
          toast.showToast(t('contacts.toast.save.success.title'), '', 'success')
        }
      } catch (ex: unknown) {
        toast.showError(
          t('contacts.toast.save.error.title'),
          getApiErrorMessage(ex)
        )
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
    [legalEntity, currentAssignment]
  )

  const handleConvertContactToCustomer = useCallback(
    async (data: ContactAssignmentForm) => {
      try {
        await patchCustomer({
          id: currentAssignment?.customer?.id,
          type: 'CUSTOMER',
        })
        await loadData()
        await updateContactWithAssignment(formToDto(data))
        // Customers is a host-owned route: leave the remote.
        window.location.assign(HOST_CUSTOMER_PATH(data.customer.id ?? ''))
        toast.showToast(
          t('contacts.toast.convert.success.title'),
          '',
          'success'
        )
      } catch (e: unknown) {
        toast.showError(
          t('contacts.toasts.errorConvert'),
          getApiErrorDetails(e)
        )
        console.error('Error converting contact to customer:', e)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
    [i18n.language, legalEntity, currentAssignment]
  )

  return (
    <div className={styles.page}>
      <HeaderSection
        title={t('contacts.singular')}
        subtitle={contactAssignmentId}
        backTo={companyId ? companyDetailPath(companyId) : undefined}
        moduleActions={
          <div className={styles.actions}>
            <SecondaryButton
              data-testid="contact-discard"
              disabled={!isDirty || !isValid}
              onClick={() => reset()}
            >
              {t('global.discard')}
            </SecondaryButton>
            <PrimaryButton
              data-testid="contact-save"
              disabled={!isDirty || !isValid || readOnly}
              onClick={handleSubmit(submit)}
            >
              {t('global.save')}
            </PrimaryButton>
            {contactAssignmentId && (
              <PrimaryButton
                data-testid="contact-convert"
                disabled={readOnly}
                onClick={handleSubmit(handleConvertContactToCustomer)}
              >
                {t('contacts.changeTypeToCustomer')}
              </PrimaryButton>
            )}
          </div>
        }
      />
      <SectionBox className={styles.section}>
        <div className={styles.row}>
          <InputField
            label={t('contacts.legalEntity')}
            className={styles.third}
          >
            <span data-testid="legalEntity">{legalEntity?.name}</span>
          </InputField>
          <Controller
            control={control}
            name="id"
            render={({ field }) => (
              <InputText
                inputId="contact-id"
                data-testid="id"
                className={styles.third}
                label={t('contacts.id')}
                tooltip={t('contacts.tooltip.id')}
                readOnly={readOnly || contactAssignmentId !== undefined}
                value={field.value || ''}
                onChange={(event) => field.onChange(event.target.value)}
              />
            )}
          />
          <Controller
            control={control}
            rules={{ required: true }}
            name="type"
            render={({ field }) => (
              <Dropdown
                inputId="contact-type"
                data-testid="type"
                className={styles.third}
                label={t('contacts.contactType')}
                required
                disabled={readOnly}
                options={contactTypeOptions}
                value={field.value || ''}
                onChange={(event) => field.onChange(event.value)}
              />
            )}
          />
          <Controller
            control={control}
            name="primary"
            render={({ field }) => (
              <InputField
                name="contact-primary"
                label={t('contacts.primary')}
                className={styles.narrow}
              >
                <InputSwitch
                  inputId="contact-primary"
                  data-testid="primary"
                  disabled={readOnly}
                  checked={field.value === true}
                  onChange={(event) => field.onChange(event.value)}
                />
              </InputField>
            )}
          />
        </div>
      </SectionBox>
      <SectionBox className={styles.section}>
        <div className={styles.row}>
          <Controller
            control={control}
            name="customer.title"
            render={({ field }) => (
              <InputField
                label={t('customers.details.title')}
                className={styles.third}
              >
                <SelectButton
                  data-testid="title"
                  disabled={readOnly}
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
            rules={{ required: true }}
            name="customer.firstName"
            render={({ field }) => (
              <InputText
                inputId="contact-firstName"
                data-testid="firstName"
                className={styles.third}
                label={t('customers.details.firstName')}
                required
                readOnly={readOnly}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
              />
            )}
          />
          <Controller
            control={control}
            name="customer.lastName"
            rules={{ required: true }}
            render={({ field }) => (
              <InputText
                inputId="contact-lastName"
                data-testid="lastName"
                className={styles.third}
                label={t('customers.details.lastName')}
                required
                readOnly={readOnly}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
              />
            )}
          />
        </div>
        <div className={styles.row}>
          <Controller
            control={control}
            name="customer.contactEmail"
            rules={{ required: true }}
            render={({ field }) => (
              <InputText
                inputId="contact-contactEmail"
                data-testid="contactEmail"
                className={styles.half}
                label={t('customers.details.contactEmail')}
                required
                readOnly={readOnly}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
              />
            )}
          />
          <Controller
            control={control}
            name="customer.contactPhone"
            render={({ field }) => (
              <InputText
                inputId="contact-contactPhone"
                data-testid="contactPhone"
                className={styles.half}
                label={t('customers.details.contactPhone')}
                readOnly={readOnly}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
              />
            )}
          />
        </div>
        <div className={styles.row}>
          <Controller
            control={control}
            name="address.street"
            render={({ field }) => (
              <InputText
                inputId="contact-street"
                data-testid="street"
                className={styles.third}
                label={t('customers.address.street')}
                readOnly={readOnly}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
              />
            )}
          />
          <Controller
            control={control}
            name="address.streetAppendix"
            render={({ field }) => (
              <InputText
                inputId="contact-streetAppendix"
                data-testid="streetAppendix"
                className={styles.third}
                label={t('customers.address.streetAppendix')}
                readOnly={readOnly}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
              />
            )}
          />
          <Controller
            control={control}
            name="address.streetNumber"
            render={({ field }) => (
              <InputText
                inputId="contact-streetNumber"
                data-testid="streetNumber"
                className={styles.third}
                label={t('customers.address.streetNumber')}
                readOnly={readOnly}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
              />
            )}
          />
        </div>
        <div className={styles.row}>
          <Controller
            control={control}
            name="address.city"
            render={({ field }) => (
              <InputText
                inputId="contact-city"
                data-testid="city"
                className={styles.third}
                label={t('customers.address.city')}
                readOnly={readOnly}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
              />
            )}
          />
          <Controller
            control={control}
            name="address.zipCode"
            render={({ field }) => (
              <InputText
                inputId="contact-zipCode"
                data-testid="zipCode"
                className={styles.third}
                label={t('customers.address.zipCode')}
                readOnly={readOnly}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
              />
            )}
          />
          <Controller
            control={control}
            name="address.country"
            rules={{ required: true }}
            render={({ field }) => (
              <Dropdown
                inputId="contact-country"
                data-testid="country"
                className={styles.third}
                label={t('customers.address.country')}
                required
                disabled={readOnly}
                options={activeCountriesDropdownOptions}
                value={field.value || ''}
                onChange={(event) => field.onChange(event.value)}
              />
            )}
          />
        </div>
      </SectionBox>
    </div>
  )
}

export default ContactAddEditPage
