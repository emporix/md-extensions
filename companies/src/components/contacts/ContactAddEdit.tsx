import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from 'react'
import {
  ContactAssignment,
  ContactType,
  LegalEntity,
} from '../../models/LegalEntity'
import HeaderSection from '../shared/HeaderSection'
import { Button } from 'primereact/button'
import { useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import InputField from '../InputField'
import SectionBox from '../SectionBox'
import { Dropdown, type DropdownChangeParams } from 'primereact/dropdown'
import { useCustomerManagementApi } from '../../api/customerManagement'
import { useToast } from '../../context/ToastProvider'
import { InputSwitch, type InputSwitchChangeParams } from 'primereact/inputswitch'
import { InputText } from 'primereact/inputtext'
import { SelectButton } from 'primereact/selectbutton'
import { Controller, useForm } from 'react-hook-form'
import {
  Customer,
  CustomerAddress,
  CustomerBusinessModel,
  DEFAULT_ADDRESS,
} from '../../models/Customer'
import { useCountries } from '../../hooks/useCountries'
import { useCustomerApi } from '../../api/customers'
import { Metadata } from '../../models/Webhooks'
import useCustomNavigate from '../../hooks/useCustomNavigate'
import { usePermissions } from '../../context/PermissionsProvider'
import { EmployeeDomains } from '../../configs/accessControls'

export interface ContactAssignmentForm {
  id: string
  legalEntity: LegalEntity
  type: ContactType
  primary: boolean
  customer: Customer
  address: CustomerAddress
  metadata?: Metadata
}

export const ContactAddEdit = () => {
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

  const TOGGLE_TITLE = [
    { name: 'MRS', value: 'MRS' },
    { name: 'MS', value: 'MS' },
    { name: 'MR', value: 'MR' },
  ]

  const DEFAULT_CONTACT: Customer = {
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
  }

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
      customer: DEFAULT_CONTACT,
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
  }, [contactAssignmentId])

  const contactTypeOptions = useMemo(() => {
    return [
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
    ]
  }, [i18n.language])

  const formToDto = (form: ContactAssignmentForm): ContactAssignment => {
    return {
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
    }
  }

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
            simpleNavigate(
              `/apps/management/companies/${legalEntity.id}/assignments/contact/${assignmentId}`
            )
          }
          toast.showToast(t('contacts.toast.save.success.title'), '', 'success')
        }
      } catch (ex: any) {
        toast.showError(
          t('contacts.toast.save.error.title'),
          ex.response.data.message
        )
      }
    },
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
        simpleNavigate(`/apps/management/customers/${data.customer.id}`)
        toast.showToast(
          t('contacts.toast.convert.success.title'),
          '',
          'success'
        )
      } catch (e: any) {
        toast.showError(
          t('contacts.toasts.errorConvert'),
          e.response.data.details || e.response.data.message
        )
        console.error('Error converting contact to customer:', e)
      }
    },
    [i18n.language, legalEntity, currentAssignment]
  )

  return (
    <div className="module grid-nogutter">
      <HeaderSection
        title={t('contacts.singular')}
        subtitle={contactAssignmentId}
        backTo={`/apps/management/companies/${legalEntity?.id}`}
        moduleActions={
          <>
            <Button
              disabled={!isDirty || !isValid}
              className="p-button-secondary"
              onClick={() => reset()}
              label={t('global.discard')}
            />
            <Button
              disabled={
                !isDirty || !isValid || !canManage || !canManageCustomers
              }
              className="ml-2"
              label={t('global.save')}
              onClick={handleSubmit(submit)}
            />
            {contactAssignmentId && (
              <Button
                disabled={!canManage || !canManageCustomers}
                className="ml-2"
                label={t('contacts.changeTypeToCustomer')}
                onClick={handleSubmit(handleConvertContactToCustomer)}
              />
            )}
          </>
        }
      />
      <div className="lg:col-8 md:col-12 w-12">
        <SectionBox className={'grid mx-0 my-0'}>
          <div className="flex w-12 mb-4">
            <InputField label={t('contacts.legalEntity')} className={'col-4'}>
              <span>{legalEntity?.name}</span>
            </InputField>
            <Controller
              control={control}
              name="id"
              render={({ field }) => {
                return (
                  <InputField
                    label={t('contacts.id')}
                    tooltip={t('contacts.tooltip.id')}
                    className={'col-4'}
                  >
                    <InputText
                      disabled={
                        !canManage ||
                        !canManageCustomers ||
                        contactAssignmentId !== undefined
                      }
                      value={field.value || ''}
                      onChange={(event: ChangeEvent<HTMLInputElement>) => field.onChange(event.target.value)}
                    />
                  </InputField>
                )
              }}
            />
            <Controller
              control={control}
              rules={{ required: true }}
              name="type"
              render={({ field }) => {
                return (
                  <InputField
                    label={t('contacts.contactType')}
                    required={true}
                    className={'col-3'}
                  >
                    <Dropdown
                      appendTo="self"
                      disabled={!canManage || !canManageCustomers}
                      options={contactTypeOptions}
                      data-test-id="type"
                      value={field.value || ''}
                      onChange={(e: DropdownChangeParams) => field.onChange(e.value)}
                    />
                  </InputField>
                )
              }}
            />
            <Controller
              control={control}
              name="primary"
              render={({ field }) => {
                return (
                  <InputField label={t('contacts.primary')} className="col-2">
                    <InputSwitch
                      disabled={!canManage || !canManageCustomers}
                      data-test-id="primary"
                      checked={field.value === true}
                      onChange={(e: InputSwitchChangeParams) => field.onChange(e.value)}
                    ></InputSwitch>
                  </InputField>
                )
              }}
            />
          </div>
        </SectionBox>
        <SectionBox className={'grid mx-0 my-0'}>
          <div className="flex w-12 mb-4">
            <Controller
              control={control}
              name="customer.title"
              render={({ field }) => (
                <InputField
                  label={t('customers.details.title')}
                  className="col-4"
                >
                  <SelectButton
                    disabled={!canManage || !canManageCustomers}
                    optionLabel="name"
                    data-test-id="title"
                    value={field.value}
                    options={TOGGLE_TITLE}
                    onChange={(e: DropdownChangeParams) => field.onChange(e.value)}
                  />
                </InputField>
              )}
            />
            <Controller
              control={control}
              rules={{ required: true }}
              name="customer.firstName"
              render={({ field }) => (
                <InputField
                  label={t('customers.details.firstName')}
                  required={true}
                  className="col-4"
                >
                  <InputText
                    disabled={!canManage || !canManageCustomers}
                    value={field.value}
                    data-test-id="firstName"
                    onChange={(e: ChangeEvent<HTMLInputElement>) => field.onChange(e.target.value)}
                  />
                </InputField>
              )}
            />
            <Controller
              control={control}
              name="customer.lastName"
              rules={{ required: true }}
              render={({ field }) => (
                <InputField
                  required={true}
                  label={t('customers.details.lastName')}
                  className="col-4"
                >
                  <InputText
                    disabled={!canManage || !canManageCustomers}
                    value={field.value}
                    data-test-id="lastName"
                    onChange={(e: ChangeEvent<HTMLInputElement>) => field.onChange(e.target.value)}
                  />
                </InputField>
              )}
            />
          </div>
          <div className="flex w-12 mb-4">
            <Controller
              control={control}
              name="customer.contactEmail"
              rules={{ required: true }}
              render={({ field }) => (
                <InputField
                  label={t('customers.details.contactEmail')}
                  required={true}
                  className="col-6"
                >
                  <InputText
                    disabled={!canManage || !canManageCustomers}
                    value={field.value}
                    data-test-id="contactEmail"
                    required={true}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => field.onChange(e.target.value)}
                  />
                </InputField>
              )}
            />
            <Controller
              control={control}
              name="customer.contactPhone"
              render={({ field }) => (
                <InputField
                  label={t('customers.details.contactPhone')}
                  className="col-6"
                >
                  <InputText
                    disabled={!canManage || !canManageCustomers}
                    value={field.value}
                    data-test-id="contactPhone"
                    onChange={(e: ChangeEvent<HTMLInputElement>) => field.onChange(e.target.value)}
                  />
                </InputField>
              )}
            />
          </div>
          <div className="flex w-12 mb-4">
            <Controller
              control={control}
              name="address.street"
              render={({ field }) => (
                <InputField
                  label={t('customers.address.street')}
                  className="col-4"
                >
                  <InputText
                    disabled={!canManage || !canManageCustomers}
                    data-test-id="street"
                    value={field.value}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => field.onChange(e.target.value)}
                  />
                </InputField>
              )}
            />
            <Controller
              control={control}
              name="address.streetAppendix"
              render={({ field }) => (
                <InputField
                  label={t('customers.address.streetAppendix')}
                  className="col-4"
                >
                  <InputText
                    disabled={!canManage || !canManageCustomers}
                    data-test-id="streetAppendix"
                    value={field.value}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => field.onChange(e.target.value)}
                  />
                </InputField>
              )}
            />
            <Controller
              control={control}
              name="address.streetNumber"
              render={({ field }) => (
                <InputField
                  label={t('customers.address.streetNumber')}
                  className="col-4"
                >
                  <InputText
                    disabled={!canManage || !canManageCustomers}
                    value={field.value}
                    data-test-id="streetNumber"
                    onChange={(e: ChangeEvent<HTMLInputElement>) => field.onChange(e.target.value)}
                  />
                </InputField>
              )}
            />
          </div>
          <div className="flex w-12 mb-4">
            <Controller
              control={control}
              name="address.city"
              render={({ field }) => (
                <InputField
                  label={t('customers.address.city')}
                  className="col-4"
                >
                  <InputText
                    disabled={!canManage || !canManageCustomers}
                    data-test-id="city"
                    value={field.value}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => field.onChange(e.target.value)}
                  />
                </InputField>
              )}
            />
            <Controller
              control={control}
              name="address.zipCode"
              render={({ field }) => (
                <InputField
                  label={t('customers.address.zipCode')}
                  className="col-4"
                >
                  <InputText
                    disabled={!canManage || !canManageCustomers}
                    value={field.value}
                    data-test-id="zipCode"
                    onChange={(e: ChangeEvent<HTMLInputElement>) => field.onChange(e.target.value)}
                  />
                </InputField>
              )}
            />
            <Controller
              control={control}
              name="address.country"
              rules={{ required: true }}
              render={({ field }) => (
                <InputField
                  label={t('customers.address.country')}
                  required={true}
                  className="col-4"
                >
                  <Dropdown
                    appendTo="self"
                    disabled={!canManage || !canManageCustomers}
                    options={activeCountriesDropdownOptions}
                    data-test-id="country"
                    value={field.value || ''}
                    onChange={(e: DropdownChangeParams) => field.onChange(e.value)}
                  />
                </InputField>
              )}
            />
          </div>
        </SectionBox>
      </div>
    </div>
  )
}
