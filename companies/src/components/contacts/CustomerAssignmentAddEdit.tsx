import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ContactAssignment,
  ContactType,
  Customer as LegalEntityCustomer,
  LegalEntity,
} from '../../models/LegalEntity'
import HeaderSection from '../shared/HeaderSection'
import { Button } from 'primereact/button'
import { useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import InputField from '../InputField'
import SectionBox from '../SectionBox'
import { Dropdown } from 'primereact/dropdown'
import { useCustomerManagementApi } from '../../api/customerManagement'
import { useToast } from '../../context/ToastProvider'
import { useUIBlocker } from '../../context/UIBlcoker'
import useForm from '../../hooks/useForm'
import { Column } from 'primereact/column'
import { Customer } from '../../models/Customer'
import usePagination from '../../hooks/usePagination'
import { useCustomerApi } from '../../api/customers'
import { FilterMatchMode } from 'primereact/api'
import useCustomNavigate from '../../hooks/useCustomNavigate'
import { InputSwitch } from 'primereact/inputswitch'
import { RadioButton } from 'primereact/radiobutton'
import ConfirmBox from '../../components/ConfirmBox'
import { formatCustomerName } from '../../helpers/utils'
import { usePermissions } from '../../context/PermissionsProvider'
import MdDataTable from '../../components/MdDataTable'
import { InputText } from 'primereact/inputtext'
import { BsCheckCircleFill } from 'react-icons/bs'
import { Tooltip } from 'primereact/tooltip'
import './CustomerAssignmentAddEdit.scss'
import { EmployeeDomains } from '../../configs/accessControls'

export const CustomerAssignmentAddEdit = () => {
  const { contactAssignmentId, companyId } = useParams()
  const { i18n, t } = useTranslation()
  const toast = useToast()
  const [customerUnassignDialogVisible, setCustomerUnassignDialogVisible] =
    useState(false)
  const [navigatedFromCompanyId, setNavigatedFromCompanyId] = useState<
    string | null
  >(null)
  const [singleLegalEntity, setSingleLegalEntity] = useState<LegalEntity>()
  const { blockPanel } = useUIBlocker()
  const {
    getContactAssignment,
    getLegalEntity,
    updateContactWithAssignment,
    createContactWithAssignment,
    addApprovalGroupContact,
    deleteContactAssignment,
    getContactsForEntity,
  } = useCustomerManagementApi()

  const { formData, setInitFormData, formDirty, setFormField, resetForm } =
    useForm<ContactAssignment>()
  const [searchParams] = useSearchParams()
  const [isApproval, setIsApproval] = useState(false)
  const { syncCustomers } = useCustomerApi()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [currentContactAssignment, setCurrentContactAssignment] =
    useState<ContactAssignment>()
  const [selectedCustomer, setSelectedCustomer] = useState<Customer[]>()
  const [isCustomersLoading, setIsCustomersLoading] = useState(false)
  const [existingContactAssignments, setExistingContactAssignments] = useState<
    ContactAssignment[]
  >([])
  const { navigate } = useCustomNavigate()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.COMPANIES_MANAGER)
  const canViewCustomers = hasPermission(EmployeeDomains.CUSTOMERS_VIEWER)
  const canManageCustomers = hasPermission(EmployeeDomains.CUSTOMERS_MANAGER)

  const {
    paginationParams,
    onPageCallback,
    setTotalCount,
    totalCount,
    onSortCallback,
    onFilterCallback,
  } = usePagination({
    rows: 10,
    first: 0,
  })

  const columnsModal = [
    {
      header: t('customers.table.columns.id'),
      field: 'id',
      filter: true,
      sortable: true,
      showFilterMenu: false,
    },
    {
      header: t('customers.table.columns.firstName'),
      field: 'firstName',
      filterField: 'firstName',
      filter: true,
      sortable: true,
      showFilterMenu: false,
    },
    {
      header: t('customers.table.columns.lastName'),
      filterField: 'lastName',
      field: 'lastName',
      filter: true,
      sortable: true,
      showFilterMenu: false,
    },
    {
      header: t('customers.table.columns.emailAddress'),
      filterField: 'contactEmail',
      filterMatchMode: FilterMatchMode.CONTAINS,
      field: 'contactEmail',
      filter: true,
      sortable: true,
      showFilterMenu: false,
    },
  ]

  useEffect(() => {
    ;(async () => {
      await loadCustomers()
    })()
  }, [paginationParams])

  const loadData = useCallback(
    async (newContactAssignmentId?: string) => {
      try {
        if (companyId) {
          setNavigatedFromCompanyId(companyId)
          if (companyId) {
            const company = await getLegalEntity(companyId)
            setSingleLegalEntity(company)
            setInitFormData({
              legalEntity: {
                id: companyId,
              },
              type: ContactType.CONTACT,
            } as ContactAssignment)

            const existingContacts = await getContactsForEntity(companyId)
            setExistingContactAssignments(existingContacts)
          }
        }

        if (contactAssignmentId || newContactAssignmentId) {
          const id = contactAssignmentId || newContactAssignmentId
          const contactAssignment = await getContactAssignment(id as string)
          setCurrentContactAssignment(contactAssignment)
          setInitFormData(contactAssignment)

          if (!paginationParams.filters) {
            paginationParams.filters = {}
          }
          paginationParams.filters.id = {
            value: contactAssignment.customer.id,
            matchMode: 'equals',
          }

          await loadCustomers()

          if (companyId) {
            const existingContacts = await getContactsForEntity(companyId)
            setExistingContactAssignments(existingContacts)
          }
        } else {
          const isPrimary = searchParams.get('primary')
          if (isPrimary === 'true') {
            setFormField('primary', JSON.parse(isPrimary))
          }
        }
      } catch (e: any) {
        toast.showError(
          t('contacts.toasts.errorLoad'),
          e.response.data.details || e.response.data.message
        )
        console.error('Error loading contact assignment data:', e)
      }
    },
    [i18n.language, contactAssignmentId, companyId]
  )

  const loadCustomers = async () => {
    try {
      setIsCustomersLoading(true)
      const { values, totalRecords } = await syncCustomers(paginationParams)
      setCustomers(values)
      setTotalCount(totalRecords)
    } catch (e: any) {
      toast.showError(
        t('contacts.toasts.errorLoadCustomers'),
        e.response.data.details || e.response.data.message
      )
      console.error('Error loading customers:', e)
    } finally {
      setIsCustomersLoading(false)
    }
  }

  useEffect(() => {
    ;(async () => {
      if (formData?.customer?.id) {
        customers
          .filter((customer) => customer.id === formData?.customer?.id)
          .forEach((customer) => setSelectedCustomer([customer]))
      }
    })()
  }, [customers])

  useEffect(() => {
    ;(async () => {
      await loadData()
    })()
  }, [])

  useEffect(() => {
    const approvalFromSearch = searchParams.get('approval')
    if (approvalFromSearch) {
      setIsApproval(Boolean(approvalFromSearch))
    }
  }, [searchParams.get('approval')])

  const isCustomerAlreadyAssigned = useCallback(
    (customerId: string) => {
      if (!customerId || !existingContactAssignments.length) {
        return false
      }

      return existingContactAssignments.some((assignment) => {
        const assignmentCustomerId = assignment.customer?.id
        const isDifferentAssignment = assignment.id !== contactAssignmentId

        return assignmentCustomerId === customerId && isDifferentAssignment
      })
    },
    [existingContactAssignments, contactAssignmentId]
  )

  const { simpleNavigate } = useCustomNavigate()

  const submit = useCallback(async () => {
    if (contactAssignmentId && formData.customer) {
      try {
        blockPanel(true)
        const updatedModel: Partial<ContactAssignment> = {
          ...formData,
        }
        await updateContactWithAssignment(updatedModel)
        await loadData()
        toast.showToast(t('contacts.toast.edit.success.title'), '', 'success')
      } catch (e: any) {
        toast.showError(
          t('contacts.toasts.errorSave'),
          e.response.data.details || e.response.data.message
        )
        console.error(e)
      } finally {
        blockPanel(false)
      }
    } else if (formData.customer) {
      blockPanel(true)
      const createModel: Partial<ContactAssignment> = {
        ...formData,
      }
      try {
        const newContactAssignmentId = await createContactWithAssignment(
          createModel
        )
        toast.showToast(t('contacts.toast.add.success.title'), '', 'success')

        if (singleLegalEntity && isApproval && newContactAssignmentId) {
          await addApprovalGroupContact(singleLegalEntity, [
            { id: newContactAssignmentId },
          ])
          simpleNavigate(
            `/apps/management/companies/${singleLegalEntity.id}?tab=policies`
          )
        } else if (newContactAssignmentId && !isApproval) {
          simpleNavigate(
            `/apps/management/companies/${singleLegalEntity?.id}/assignments/customer/${newContactAssignmentId}`
          )
          await loadData(newContactAssignmentId)
        } else {
          simpleNavigate(
            `/apps/management/companies/${singleLegalEntity?.id}/assignments/customer/${newContactAssignmentId}`
          )
        }
      } catch (e: any) {
        toast.showError(
          t('contacts.toasts.errorSave'),
          e.response.data.details || e.response.data.message
        )
        console.error(e)
      } finally {
        blockPanel(false)
      }
    }
  }, [
    i18n.language,
    formData,
    contactAssignmentId,
    singleLegalEntity,
    isApproval,
  ])

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

  const mapCustomer = (customer: any): LegalEntityCustomer => {
    return {
      id: customer?.id,
      name: customer?.firstName,
      surname: customer?.lastName,
      email: customer?.contactEmail,
      phone: customer?.contactPhone,
      type: customer?.type,
    }
  }

  const saveLabel = useMemo(() => {
    return isApproval ? t('contacts.saveAndAddAsApproval') : t('global.save')
  }, [isApproval])

  const unassignCustomerCall = useCallback(async () => {
    if (contactAssignmentId) {
      await deleteContactAssignment(contactAssignmentId)
      setCustomerUnassignDialogVisible(false)
      navigate(`/apps/management/companies/${companyId}?tab=customers`)
    }
  }, [contactAssignmentId])

  return (
    <div className="module customer-assignment-add-edit">
      <HeaderSection
        title={t('contacts.singular')}
        backTo={`/apps/management/companies/${navigatedFromCompanyId}?tab=customers`}
        moduleActions={
          <>
            <Button
              disabled={!formDirty}
              className="p-button-secondary"
              onClick={() => resetForm()}
              label={t('global.discard')}
            />
            <Button
              disabled={
                !formDirty || selectedCustomer === undefined || !canManage
              }
              className="ml-2"
              label={saveLabel}
              onClick={submit}
            />
          </>
        }
      />
      <div className="flex align-items-center gap-2 mb-2">
        <Button
          className="p-button-secondary"
          disabled={!canManage || !canManageCustomers}
          label={t('companies.edit.form.contacts.addNew')}
          onClick={() => {
            const currentPath = `${location.pathname}${location.search}`
            navigate(
              `/apps/management/companies/${companyId}/assignments/contact`,
              { query: { backTo: currentPath } }
            )
          }}
        />
        {contactAssignmentId && (
          <Button
            disabled={!canManage}
            className="p-button-secondary"
            label={t('global.delete')}
            onClick={unassignCustomerCall}
          />
        )}
      </div>

      <SectionBox>
        <div className="grid mb-4">
          <InputField label={t('contacts.legalEntity')} className={'col-3'}>
            <span>{singleLegalEntity?.name}</span>
          </InputField>
          <InputField
            label={t('contacts.id')}
            tooltip={t('contacts.tooltip.id')}
            className={'col-3'}
          >
            <InputText
              disabled={!canManage || contactAssignmentId !== undefined}
              value={formData.id || ''}
              onChange={(event) => setFormField('id', event.target.value)}
            />
          </InputField>
          <InputField label={t('contacts.contactType')} className={'col-3'}>
            <Dropdown
              appendTo="self"
              disabled={!canManage}
              options={contactTypeOptions}
              value={formData.type || ''}
              onChange={(event) => setFormField('type', event.value)}
            />
          </InputField>
          <InputField label={t('contacts.primary')} className="col-1 ml-auto">
            <InputSwitch
              disabled={!canManage}
              checked={formData.primary}
              onChange={() => setFormField('primary', !formData.primary)}
            ></InputSwitch>
          </InputField>
        </div>
        <MdDataTable
          lazy={true}
          paginationOptions={{
            first: paginationParams.first,
            rows: paginationParams.rows,
            totalRecords: totalCount,
            filters: paginationParams.filters,
          }}
          selection={selectedCustomer}
          value={customers}
          sortField="created"
          sortOrder={-1}
          onPage={onPageCallback}
          onFilter={onFilterCallback}
          onSort={onSortCallback}
          isLoading={isCustomersLoading}
          emptyMessage={canViewCustomers ? '' : t('global.noPermissions')}
          className="custom-row-height"
        >
          <Column
            headerStyle={{ width: '3em' }}
            body={(rowData: Customer) => {
              const isAssigned = isCustomerAlreadyAssigned(rowData.id || '')
              const isSelected =
                selectedCustomer?.some((c) => c.id === rowData.id) || false

              if (isAssigned) {
                return (
                  <div>
                    <BsCheckCircleFill
                      className={`customer-check-icon customer-assigned-${rowData.id}`}
                    />
                    <Tooltip
                      target={`.customer-assigned-${rowData.id}`}
                      content={t('contacts.tooltip.alreadyAssigned')}
                      position="top"
                    />
                  </div>
                )
              } else {
                return (
                  <RadioButton
                    inputId={`customer-${rowData.id}`}
                    name="customerSelection"
                    value={rowData.id}
                    checked={isSelected}
                    onChange={() => {
                      setSelectedCustomer([rowData])
                      setFormField('customer', mapCustomer(rowData))
                    }}
                  />
                )
              }
            }}
          />
          {columnsModal.map((column: any) => {
            return <Column key="columnKey" {...column} />
          })}
        </MdDataTable>
      </SectionBox>

      <ConfirmBox
        key="unassign-customer-confirm-box"
        message={t('contacts.toast.delete.customer.message', {
          name: `${formatCustomerName(currentContactAssignment?.customer)}`,
        })}
        title={t('contacts.toast.delete.customer.title')}
        onReject={() => setCustomerUnassignDialogVisible(false)}
        visible={customerUnassignDialogVisible}
        onAccept={unassignCustomerCall}
      />
    </div>
  )
}
