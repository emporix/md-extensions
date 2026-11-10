import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useParams, useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { BsCheckCircleFill } from 'react-icons/bs'
import {
  ConfirmBox,
  DataTable,
  Dropdown,
  FilterMatchMode,
  InputSwitch,
  InputText,
  PrimaryButton,
  RadioButton,
  SecondaryButton,
  SectionBox,
  Tooltip,
  useToast,
  type DataTableColumnProps,
  type DataTablePaginationState,
} from '@emporix/component-library'
import HeaderSection from '../components/shared/HeaderSection'
import InputField from '../components/shared/InputField'
import { useCustomerManagementApi } from '../hooks/api/customerManagement'
import { useCustomerApi } from '../hooks/api/customers'
import useForm from '../hooks/useForm'
import { useNavigationConfirm } from '../context/NavigationConfirmProvider'
import usePagination from '../hooks/usePagination'
import useCustomNavigate from '../hooks/useCustomNavigate'
import { useUIBlocker } from '../context/UIBlocker'
import { usePermissions } from '../context/PermissionsProvider'
import { EmployeeDomains } from '../configs/accessControls'
import {
  ContactAssignment,
  ContactType,
  Customer as LegalEntityCustomer,
  LegalEntity,
} from '../models/LegalEntity.model'
import { Customer } from '../models/Customer.model'
import { getApiErrorDetails } from '../helpers/api'
import useUpdateEffect from '../hooks/useUpdateEffect'
import { useDashboardContext } from '../context/Dashboard.context'
import {
  companiesListPath,
  companyDetailPath,
  contactAddPath,
  customerAssignmentEditPath,
} from '../constants/paths'
import styles from './CustomerAssignmentAddEdit.page.module.scss'
import { formatCustomerName } from '../helpers/companyFormat.helpers'

const mapCustomer = (customer: Customer): LegalEntityCustomer => ({
  id: customer?.id,
  name: customer?.firstName,
  surname: customer?.lastName,
  email: customer?.contactEmail,
  phone: customer?.contactPhone,
  type: customer?.type,
})

const CustomerAssignmentAddEditPage = () => {
  const { contactAssignmentId, companyId } = useParams()
  const { i18n, t } = useTranslation()
  const toast = useToast()
  const location = useLocation()
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
  const { releaseNavigation } = useNavigationConfirm()
  const [searchParams] = useSearchParams()
  const { syncCustomers } = useCustomerApi()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [currentContactAssignment, setCurrentContactAssignment] =
    useState<ContactAssignment>()
  const [selectedCustomer, setSelectedCustomer] = useState<Customer[]>()
  const [isCustomersLoading, setIsCustomersLoading] = useState(false)
  const [existingContactAssignments, setExistingContactAssignments] = useState<
    ContactAssignment[]
  >([])
  const { navigate, simpleNavigate } = useCustomNavigate()

  // A host tenant switch leaves for the list, like the company and location
  // pages, so the previous tenant's record is never shown or saved.
  const { tenant } = useDashboardContext()
  useUpdateEffect(() => {
    releaseNavigation()
    simpleNavigate(companiesListPath())
  }, [tenant])
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
    setFilters,
  } = usePagination({
    rows: 10,
    first: 0,
  })

  // Latest params for `loadData`, which is memoized on the route only.
  const paginationParamsRef = useRef(paginationParams)
  paginationParamsRef.current = paginationParams

  const loadCustomers = async (params = paginationParams) => {
    try {
      setIsCustomersLoading(true)
      const { values, totalRecords } = await syncCustomers(params)
      setCustomers(values)
      setTotalCount(totalRecords)
    } catch (e: unknown) {
      toast.showError(
        t('contacts.toasts.errorLoadCustomers'),
        getApiErrorDetails(e)
      )
      console.error('Error loading customers:', e)
    } finally {
      setIsCustomersLoading(false)
    }
  }

  useEffect(() => {
    ;(async () => {
      await loadCustomers()
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [paginationParams])

  const loadData = useCallback(
    async (newContactAssignmentId?: string) => {
      try {
        if (companyId) {
          setNavigatedFromCompanyId(companyId)
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

        if (contactAssignmentId || newContactAssignmentId) {
          const id = contactAssignmentId || newContactAssignmentId
          const contactAssignment = await getContactAssignment(id as string)
          setCurrentContactAssignment(contactAssignment)
          setInitFormData(contactAssignment)

          // MD parity: narrow the customer list to the assigned customer by
          // mutating the current pagination params in place and reloading.
          // A state update here would also rewrite the URL's page/rows and,
          // right after the create redirect, replace the new route.
          const params = paginationParamsRef.current
          params.filters = {
            ...params.filters,
            id: {
              value: contactAssignment.customer.id,
              matchMode: 'equals',
            },
          }

          await loadCustomers(params)

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
      } catch (e: unknown) {
        toast.showError(t('contacts.toasts.errorLoad'), getApiErrorDetails(e))
        console.error('Error loading contact assignment data:', e)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
    [i18n.language, contactAssignmentId, companyId]
  )

  useEffect(() => {
    if (formData?.customer?.id) {
      customers
        .filter((customer) => customer.id === formData?.customer?.id)
        .forEach((customer) => setSelectedCustomer([customer]))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [customers])

  useEffect(() => {
    ;(async () => {
      await loadData()
    })()
    // Reload when the route switches to another assignment or company.
  }, [loadData])

  // Derived from the query on every render (MD: any non-empty `approval`), so
  // leaving `?approval=true` on the same mounted page turns it off again.
  const approvalParam = searchParams.get('approval')
  const isApproval = Boolean(approvalParam)

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
      } catch (e: unknown) {
        toast.showError(t('contacts.toasts.errorSave'), getApiErrorDetails(e))
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
        const newContactAssignmentId =
          await createContactWithAssignment(createModel)
        toast.showToast(t('contacts.toast.add.success.title'), '', 'success')
        // Saved: the pages below are not "leaving unsaved changes".
        releaseNavigation()

        if (singleLegalEntity && isApproval && newContactAssignmentId) {
          await addApprovalGroupContact(singleLegalEntity, [
            { id: newContactAssignmentId },
          ])
          simpleNavigate(
            companyDetailPath(singleLegalEntity.id, 'tab=policies')
          )
        } else if (newContactAssignmentId && !isApproval) {
          simpleNavigate(
            customerAssignmentEditPath(
              singleLegalEntity?.id ?? companyId ?? '',
              newContactAssignmentId
            )
          )
          await loadData(newContactAssignmentId)
        } else {
          simpleNavigate(
            customerAssignmentEditPath(
              singleLegalEntity?.id ?? companyId ?? '',
              newContactAssignmentId
            )
          )
        }
      } catch (e: unknown) {
        toast.showError(t('contacts.toasts.errorSave'), getApiErrorDetails(e))
        console.error(e)
      } finally {
        blockPanel(false)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [
    i18n.language,
    formData,
    contactAssignmentId,
    singleLegalEntity,
    isApproval,
  ])

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

  const saveLabel = isApproval
    ? t('contacts.saveAndAddAsApproval')
    : t('global.save')

  const unassignCustomerCall = useCallback(async () => {
    if (contactAssignmentId && companyId) {
      await deleteContactAssignment(contactAssignmentId)
      setCustomerUnassignDialogVisible(false)
      releaseNavigation()
      navigate(companyDetailPath(companyId, 'tab=customers'))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [contactAssignmentId])

  const selectionTemplate = (rowData: Customer) => {
    const isAssigned = isCustomerAlreadyAssigned(rowData.id || '')
    const isSelected =
      selectedCustomer?.some((c) => c.id === rowData.id) || false

    if (isAssigned) {
      return (
        <Tooltip content={t('contacts.tooltip.alreadyAssigned')} position="top">
          <BsCheckCircleFill
            data-testid={`customer-assigned-${rowData.id}`}
            className={styles.customerCheckIcon}
          />
        </Tooltip>
      )
    }
    return (
      <RadioButton
        inputId={`customer-${rowData.id}`}
        data-testid={`customer-select-${rowData.id}`}
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

  const columns: DataTableColumnProps[] = [
    {
      columnKey: 'selection',
      headerStyle: { width: '3em' },
      body: selectionTemplate,
    },
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

  // Register a filter slot per filterable column (MdDataTable did this).
  useEffect(() => {
    setFilters(columns)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- slots are static
  }, [])

  const pagination: DataTablePaginationState = {
    first: paginationParams.first,
    rows: paginationParams.rows,
    totalRecords: totalCount,
    filters: paginationParams.filters,
    rowsPerPageOptions: paginationParams.rowsPerPageOptions,
  }

  return (
    <div className={styles.page}>
      <HeaderSection
        title={t('contacts.singular')}
        backTo={companyDetailPath(
          navigatedFromCompanyId ?? companyId ?? '',
          'tab=customers'
        )}
        moduleActions={
          <div className={styles.actions}>
            <SecondaryButton
              data-testid="assignment-discard"
              disabled={!formDirty}
              onClick={() => resetForm()}
            >
              {t('global.discard')}
            </SecondaryButton>
            <PrimaryButton
              data-testid="assignment-save"
              disabled={
                !formDirty || selectedCustomer === undefined || !canManage
              }
              onClick={submit}
            >
              {saveLabel}
            </PrimaryButton>
          </div>
        }
      />
      <div className={styles.toolbar}>
        <SecondaryButton
          data-testid="assignment-add-contact"
          disabled={!canManage || !canManageCustomers}
          onClick={() => {
            const currentPath = `${location.pathname}${location.search}`
            navigate(contactAddPath(companyId ?? ''), {
              query: { backTo: currentPath },
            })
          }}
        >
          {t('companies.edit.form.contacts.addNew')}
        </SecondaryButton>
        {contactAssignmentId && (
          <SecondaryButton
            data-testid="assignment-delete"
            disabled={!canManage}
            // MD parity: unassigns directly; the confirm box below is never opened.
            onClick={unassignCustomerCall}
          >
            {t('global.delete')}
          </SecondaryButton>
        )}
      </div>

      <SectionBox>
        <div className={styles.fields}>
          <InputField
            label={t('contacts.legalEntity')}
            className={styles.quarter}
          >
            <span data-testid="legalEntity">{singleLegalEntity?.name}</span>
          </InputField>
          <InputText
            inputId="assignment-id"
            data-testid="id"
            className={styles.quarter}
            label={t('contacts.id')}
            tooltip={t('contacts.tooltip.id')}
            readOnly={!canManage || contactAssignmentId !== undefined}
            value={formData.id || ''}
            onChange={(event) => setFormField('id', event.target.value)}
          />
          <Dropdown
            inputId="assignment-type"
            data-testid="type"
            className={styles.quarter}
            label={t('contacts.contactType')}
            disabled={!canManage}
            options={contactTypeOptions}
            value={formData.type || ''}
            onChange={(event) => setFormField('type', event.value)}
          />
          <InputField
            name="assignment-primary"
            label={t('contacts.primary')}
            className={styles.primary}
          >
            <InputSwitch
              inputId="assignment-primary"
              data-testid="primary"
              disabled={!canManage}
              checked={!!formData.primary}
              onChange={() => setFormField('primary', !formData.primary)}
            />
          </InputField>
        </div>
        <DataTable
          className={styles.table}
          data-testid="customers-table"
          dataKey="id"
          lazy
          value={customers}
          columns={columns}
          pagination={pagination}
          sortField={paginationParams.sortField}
          sortOrder={paginationParams.sortOrder}
          onPage={onPageCallback}
          onFilter={onFilterCallback}
          onSort={onSortCallback}
          loading={isCustomersLoading}
          emptyMessage={
            canViewCustomers ? undefined : t('global.noPermissions')
          }
        />
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

export default CustomerAssignmentAddEditPage
