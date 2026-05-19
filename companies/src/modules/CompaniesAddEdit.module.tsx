import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import HeaderSection from '../components/shared/HeaderSection'
import { useParams, useSearchParams } from 'react-router-dom'
import { useCustomerManagementApi } from '../api/customerManagement'
import { CompanyType, ContactAssignment, LegalEntity, Location } from '../models/LegalEntity'
import { Button } from 'primereact/button'
import SectionBox, { SectionTitle } from '../components/SectionBox'
import InputField from '../components/InputField'
import { InputText } from 'primereact/inputtext'
import { TabPanel, TabView } from 'primereact/tabview'
import { Calendar } from 'primereact/calendar'
import { useCountries } from '../hooks/useCountries'
import { Dropdown } from 'primereact/dropdown'
import { Country } from '../models/Country'
import { LabelValueCell } from '../components/companies/LabelValueCell'
import { useLocalizedValue } from '../hooks/useLocalizedValue'
import useUpdateEffect from '../hooks/useUpdateEffect'
import { useUIBlocker } from '../context/UIBlcoker'
import { useTabs } from '../hooks/useTabs'
import { useRefresh } from '../context/RefreshValuesProvider'
import { Subsidiaries } from '../components/companies/Subsidiaries'
import { CustomerGroupsTable } from '../components/companies/CustomerGroupsTable'
import { PrimaryContacts } from '../components/companies/PrimaryContacts'
import { ApprovalGroup } from '../components/companies/ApprovalGroup'
import useForm from '../hooks/useForm'
import useCustomNavigate from '../hooks/useCustomNavigate'
import { useCurrencies } from '../hooks/useCurrencies'
import { formatAddress } from '../helpers/utils'
import { ContactAssignmentList } from '../components/contacts/ContactAssignmentList'
import { MixinsFormMetadata } from '../components/mixins/helpers'
import useMixinsForm from '../components/mixins/useMixinsForm'
import { SchemaType } from '../models/Schema'
import { useToast } from '../context/ToastProvider'
import { Mixins } from '../models/Mixins'
import { BsPencilFill, BsTrashFill } from 'react-icons/bs'
import { usePermissions } from '../context/PermissionsProvider'
import { EmployeeDomains } from '../configs/accessControls'
import { useRestrictions } from '../context/RestrictionsProvider'
import { useTenant } from '../context/TenantProvider'
import ConfirmBox from '../components/ConfirmBox'
import { useConfigurationApi } from '../api/configuration'
import FormGrid from 'components/FormGrid'
import FormGridRow from 'components/FormGridRow'

const LocationRow = (props: {
  location: Location
  companyId: string
  disabled: boolean
  onDelete: () => void
}) => {
  const { location, companyId } = props
  const { navigate } = useCustomNavigate()
  const { t } = useTranslation()

  return (
    <div className="location w-full grid align-items-center mb-2  px-2 py-3 border-bottom-1">
      <div className="type col-1">
        <i className="pi pi-home" />
      </div>
      <LabelValueCell
        className="col-2"
        label={t('companies.locations.list.name')}
        value={location.name}
      />
      <LabelValueCell
        className="col-3"
        label={t('companies.locations.list.locationType')}
        value={location.type}
      />
      <LabelValueCell
        className="col-4"
        label={t('companies.locations.list.address')}
        value={formatAddress(location.contactDetails)}
      />
      <LabelValueCell
        className="col-1"
        label={t('companies.locations.list.tags')}
        value={location.contactDetails?.tags?.join(', ')}
      />
      <div className="flex col-1">
        <Button
          icon="p"
          className="mr-0 ml-auto p-button-text"
          onClick={(event) => {
            event.preventDefault()
            navigate(
              `/apps/management/companies/${companyId}/locations/${location.id}`
            )
          }}
        >
          <BsPencilFill size={16} />
        </Button>
        <Button
          icon="p"
          className="mr-0 ml-auto p-button-text"
          disabled={props.disabled}
          onClick={props.onDelete}
        >
          <BsTrashFill size={16} />
        </Button>
      </div>
    </div>
  )
}

const Locations = (props: {
  legalEntity: Partial<LegalEntity>
  readOnly: boolean
}) => {
  const { legalEntity } = props
  const [locations, setLocations] = useState<Location[]>([])
  const { t } = useTranslation()
  const { deleteLocation } = useCustomerManagementApi()
  const [isDeleteConfirmOpened, setIsDeleteConfirmOpened] = useState(false)
  const [locationIdToDelete, setLocationIdToDelete] = useState<string>()
  const toast = useToast()

  useEffect(() => {
    ;(async () => {
      if (!legalEntity?.entitiesAddresses) return
      setLocations(legalEntity.entitiesAddresses)
    })()
  }, [legalEntity])

  const handleLocationDelete = useCallback(
    async (locationId: any) => {
      if (locationId) {
        try {
          await deleteLocation(locationId)
          const updatedLocations = locations.filter(
            (location) => location.id !== locationId
          )
          setLocations([...updatedLocations])
          toast.showToast(
            t('companies.locations.toast.delete.success.title'),
            '',
            'success'
          )
        } catch (error) {
          toast.showError(t('companies.locations.toast.delete.error'))
          console.error(error)
        } finally {
          setIsDeleteConfirmOpened(false)
        }
      }
    },
    [locations]
  )

  return legalEntity.id ? (
    <div className={'flex flex-column w-full'}>
      {locations.map((location) => {
        return (
          <LocationRow
            key={location.id}
            location={location}
            companyId={legalEntity?.id ? legalEntity.id : ''}
            disabled={props.readOnly}
            onDelete={() => {
              setLocationIdToDelete(location.id)
              setIsDeleteConfirmOpened(true)
            }}
          />
        )
      })}
      <ConfirmBox
        visible={isDeleteConfirmOpened}
        onAccept={() => handleLocationDelete(locationIdToDelete)}
        onReject={() => {
          setIsDeleteConfirmOpened(false)
        }}
        title={`${t('companies.locations.actions.delete')}`}
      />
    </div>
  ) : (
    <></>
  )
}

const TABS = [
  'company-details',
  'subsidiaries',
  'locations',
  'policies',
  'customers',
  'client-groups',
]

export interface CustomerGroupsTableProps {
  legalEntity: Partial<LegalEntity>
}

interface CompanyBreadcrumb {
  id: string
  name: string
}

const CompanyBreadcrumb = ({ items }: { items: CompanyBreadcrumb[] }) => {
  const { navigate } = useCustomNavigate()

  return (
    <div className="flex align-items-center">
      {items.map((item, index) => (
        <div key={item.id}>
          {index > 0 && <span className="separator mx-2">/</span>}
          <span
            className={`font-bold cursor-pointer ${
              index === items.length - 1 ? 'highlight-text' : ''
            }`}
            onClick={() => navigate(`/apps/management/companies/${item.id}`)}
          >
            {item.name}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function CompaniesAddEditModule() {
  const { i18n, t } = useTranslation()
  const { activeIndex, onTabChange } = useTabs(TABS, true)
  const { companyId } = useParams()
  const { tenant } = useTenant()

  const {
    formData,
    setFormData,
    setInitFormData,
    formDirty,
    setFormField,
    resetForm,
  } = useForm<LegalEntity>()
  const { navigate } = useCustomNavigate()
  const { refresh } = useRefresh()
  const { activeCountries } = useCountries()
  const { getLegalEntity, createLegalEntity, updateLegalEntity } =
    useCustomerManagementApi()
  const tabViewRef = useRef<any>(null)
  const { blockPanel } = useUIBlocker()
  const [searchParams] = useSearchParams()
  const [parentId, setParentId] = useState<string | null>()
  const [parent, setParent] = useState<LegalEntity | null>(null)
  const customerId = searchParams.get('customerId')
  const parentCompanyIdParam = searchParams.get('parentCompany')
  const { currencies } = useCurrencies()
  const toast = useToast()
  const { hasPermission } = usePermissions()
  const { companyRestrictions } = useRestrictions()
  const canManage = hasPermission(EmployeeDomains.COMPANIES_MANAGER)
  const canViewCustomers = hasPermission(EmployeeDomains.CUSTOMERS_VIEWER)
  const canManageCustomers = hasPermission(EmployeeDomains.CUSTOMERS_MANAGER)
  const hasFullRestrictionAccess = companyRestrictions === null
  const [breadcrumbs, setBreadcrumbs] = useState<CompanyBreadcrumb[]>([])
  const [restrictionsOptions, setRestrictionsOptions] = useState<
    { label: string; value: string }[]
  >([])
  const { getRestrictions } = useConfigurationApi()

  useEffect(() => {
    ;(async () => {
      blockPanel(true)
      if (companyId) {
        const legalEntity = await reloadData(companyId)
        setInitFormData(legalEntity)
      }
      if (parentCompanyIdParam) {
        setParentId(parentCompanyIdParam)
        setFormField('parentId', parentCompanyIdParam)
        setFormField('type', CompanyType.SUBSIDIARY)
        setParent({ ...(await getLegalEntity(parentCompanyIdParam)) })
      } else {
        setParent(null)
        setParentId(undefined)
      }
      blockPanel(false)
    })()
  }, [companyId, refresh, parentCompanyIdParam])

  const loadData = useCallback(async () => {
    if (companyId) {
      try {
        blockPanel(true)
        const legalEntity = await reloadData(companyId)
        setFormData({
          ...legalEntity,
        })
        setInitFormData(legalEntity)
      } catch (e: any) {
        toast.showError(
          t('companies.toasts.errorLoad'),
          e.response.data.details || e.response.data.message
        )
        console.error(e)
      } finally {
        blockPanel(false)
      }
    }
  }, [i18n.language, formData, companyId, parentId])

  const reloadData = async (companyId: string): Promise<LegalEntity> => {
    const legalEntity = await getLegalEntity(companyId)
    if (legalEntity.mixins === undefined) {
      legalEntity.mixins = {}
    }
    if (legalEntity.metadata === undefined) {
      legalEntity.metadata = {}
    }
    if (legalEntity.metadata.mixins === undefined) {
      legalEntity.metadata.mixins = {}
    }
    loadMixins(legalEntity.metadata.mixins, legalEntity.mixins)
    return legalEntity
  }

  const saveMixin = useCallback(
    async (data: Mixins, mixinMetadata: MixinsFormMetadata) => {
      if (formData) {
        const { key, url } = mixinMetadata
        const mixins = { ...formData.mixins }
        mixins[key] = data
        if (formData.metadata === undefined) {
          formData.metadata = {}
        }
        const mixinMetadatas = formData.metadata
        if (mixinMetadatas.mixins === undefined) {
          mixinMetadatas.mixins = {}
        }
        mixinMetadatas.mixins = { ...formData.metadata.mixins }
        mixinMetadatas.mixins[key] = url
        formData.mixins = mixins
        if (formData.metadata) {
          formData.metadata.mixins = mixinMetadatas.mixins
        }
        try {
          blockPanel(true)
          await updateLegalEntity(formData)
          toast.showToast(t('companies.toast.update.title'), '', 'success')
        } catch (e: any) {
          toast.showError(
            t('companies.toasts.errorSave'),
            e.response?.data?.details || e.response?.data?.message
          )
          console.error(e)
        } finally {
          blockPanel(false)
          loadData()
        }
      }
    },
    [formData, updateLegalEntity, toast, t, blockPanel, loadData]
  )

  const { loadMixins, mixinsTabs } = useMixinsForm({
    type: SchemaType.COMPANY,
    onEdit: saveMixin,
    managerPermissions: canManage,
  })

  useUpdateEffect(() => {
    navigate(`/apps/management/companies`)
  }, [tenant])
  const { getContentLangValue } = useLocalizedValue()

  const onSubmit = useCallback(async () => {
    const companyData = { ...formData }
    if (!companyData.restrictions || companyData.restrictions.length === 0) {
      companyData.restrictions = undefined
    }

    if (companyId) {
      try {
        blockPanel(true)
        await updateLegalEntity(companyData)
        toast.showToast(t('companies.toast.update.title'), '', 'success')
      } catch (e: any) {
        toast.showError(
          t('companies.toasts.errorSave'),
          e.response.data.details || e.response.data.message
        )
        console.error(e)
      } finally {
        blockPanel(false)
        loadData()
      }
    } else {
      try {
        blockPanel(true)
        const createResponse = await createLegalEntity(companyData)
        toast.showToast(t('companies.toast.create.title'), '', 'success')
        navigate(`/apps/management/companies/${createResponse.data.id}`)
      } catch (e: any) {
        toast.showError(
          t('companies.toasts.errorSave'),
          e.response.data.details || e.response.data.message
        )
        console.error(e)
      } finally {
        blockPanel(false)
      }
    }
  }, [i18n.language, formData])

  const getHeader = useCallback(() => {
    if (parent === null) {
      return t('companies.singular')
    } else {
      return t('companies.subsidiary')
    }
  }, [formData, parent])

  const loadCompanyHierarchy = useCallback(
    async (companyId: string) => {
      const hierarchy: CompanyBreadcrumb[] = []
      let currentId = companyId

      while (currentId) {
        try {
          const company = await getLegalEntity(currentId)
          hierarchy.unshift({
            id: company.id,
            name: company.name,
          })
          currentId = company.parentId || ''
        } catch (error) {
          console.error('Error loading company hierarchy:', error)
          break
        }
      }

      setBreadcrumbs(hierarchy)
    },
    [getLegalEntity]
  )

  useEffect(() => {
    if (companyId) {
      loadCompanyHierarchy(companyId)
    }
  }, [companyId, loadCompanyHierarchy])

  const getBackPath = useCallback(() => {
    if (customerId) {
      return `/apps/management/customers/${customerId}`
    }
    return `/apps/management/companies${parent ? `/${parentId}` : ''}`
  }, [customerId, parent, parentId])

  const fetchRestrictions = useCallback(async () => {
    try {
      const config = await getRestrictions()
      if (config && config.value && Array.isArray(config.value)) {
        let options = config.value.map((restriction: string) => ({
          label: restriction,
          value: restriction,
        }))

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
  }, [getRestrictions, companyRestrictions])

  useEffect(() => {
    fetchRestrictions()
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
  }, [
    restrictionsOptions,
    companyRestrictions,
    companyId,
    formData.restrictions,
  ])

  return (
    <div className="module">
      <HeaderSection
        title={getHeader()}
        subtitle={companyId && formData.name}
        backTo={getBackPath()}
        moduleActions={
          <>
            <Button
              disabled={!formDirty}
              className="p-button-secondary"
              onClick={() => resetForm()}
              label={t('global.discard')}
            />
            <Button
              disabled={!formDirty || !canManage}
              className="ml-2"
              label={t('global.save')}
              onClick={onSubmit}
            />
          </>
        }
      />
      {breadcrumbs.length > 0 && (
        <div className="w-full mb-3">
          <CompanyBreadcrumb items={breadcrumbs} />
        </div>
      )}
      <div className="w-full flex flex-column">
        <TabView
          scrollable
          ref={tabViewRef}
          activeIndex={activeIndex}
          onTabChange={onTabChange}
        >
          <TabPanel header={t('companies.edit.tabs.companyDetails')}>
            <SectionBox
              className="mb-5"
              name={t('companies.edit.form.details.title')}
            >
              <FormGrid>
                <FormGridRow>
                  <InputField
                    label={t('companies.edit.form.details.name')}
                    className={'col-6'}
                  >
                    <InputText
                      disabled={!canManage}
                      value={formData.name || ''}
                      onChange={(event) =>
                        setFormField('name', event.target.value)
                      }
                    />
                  </InputField>
                  <InputField
                    label={t('companies.edit.form.details.id')}
                    tooltip={t('companies.edit.form.tooltip.id')}
                    className={'col-6'}
                  >
                    <InputText
                      disabled={!canManage || companyId !== undefined}
                      value={formData.id || ''}
                      onChange={(event) =>
                        setFormField('id', event.target.value)
                      }
                    />
                  </InputField>
                </FormGridRow>
                <FormGridRow>
                  <InputField
                    className={'col-6'}
                    label={t('companies.edit.form.legalEntity.legalName')}
                  >
                    <InputText
                      disabled={!canManage}
                      onChange={(event) =>
                        setFormField('legalInfo.legalName', event.target.value)
                      }
                      value={formData.legalInfo?.legalName || ''}
                    />
                  </InputField>
                  <InputField
                    className={'col-6'}
                    label={t(
                      'companies.edit.form.legalEntity.taxRegistrationNumber'
                    )}
                  >
                    <InputText
                      disabled={!canManage}
                      onChange={(event) =>
                        setFormField(
                          'legalInfo.taxRegistrationNumber',
                          event.target.value
                        )
                      }
                      value={formData.legalInfo?.taxRegistrationNumber || ''}
                    />
                  </InputField>
                </FormGridRow>
                <FormGridRow>
                  <InputField
                    className={'col-6'}
                    label={t(
                      'companies.edit.form.legalEntity.countryOfRegistration'
                    )}
                  >
                    <Dropdown
                      appendTo="self"
                      disabled={!canManage}
                      placeholder={t(
                        'companies.edit.form.legalEntity.countryOfRegistrationPlaceholder'
                      )}
                      onChange={(event) =>
                        setFormField(
                          'legalInfo.countryOfRegistration',
                          event.target.value
                        )
                      }
                      value={formData.legalInfo?.countryOfRegistration || ''}
                      options={activeCountries.map((country: Country) => ({
                        label: getContentLangValue(country.name),
                        value: country.code,
                      }))}
                    />
                  </InputField>
                  <InputField
                    className={'col-6'}
                    label={t(
                      'companies.edit.form.legalEntity.registrationAgency'
                    )}
                  >
                    <InputText
                      disabled={!canManage}
                      onChange={(event) =>
                        setFormField(
                          'legalInfo.registrationAgency',
                          event.target.value
                        )
                      }
                      value={formData.legalInfo?.registrationAgency || ''}
                    />
                  </InputField>
                </FormGridRow>
                <FormGridRow>
                  <InputField
                    className={'col-6'}
                    label={t(
                      'companies.edit.form.legalEntity.registrationDate'
                    )}
                  >
                    <Calendar
                      disabled={!canManage}
                      key={
                        formData.legalInfo?.registrationDate &&
                        'registrationDate'
                      }
                      onChange={(event) => {
                        if (event.target.value) {
                          setFormField(
                            'legalInfo.registrationDate',
                            (event.target.value as Date).toISOString()
                          )
                        }
                      }}
                      value={
                        new Date(formData.legalInfo?.registrationDate || '')
                      }
                    />
                  </InputField>
                  <InputField
                    className={'col-6'}
                    label={t('companies.edit.form.legalEntity.registrationId')}
                  >
                    <InputText
                      disabled={!canManage}
                      value={formData.legalInfo?.registrationId || ''}
                      onChange={(event) =>
                        setFormField(
                          'legalInfo.registrationId',
                          event.target.value
                        )
                      }
                    />
                  </InputField>
                </FormGridRow>
                <FormGridRow>
                  <InputField
                    className={'col-6'}
                    label={t('companies.edit.form.details.restriction')}
                    required={!hasFullRestrictionAccess}
                  >
                    <Dropdown
                      appendTo="self"
                      disabled={!canManage}
                      value={
                        formData.restrictions &&
                        formData.restrictions.length > 0
                          ? formData.restrictions[0]
                          : ''
                      }
                      onChange={(event) => {
                        const value = event.target.value
                        setFormField('restrictions', value ? [value] : null)
                      }}
                      options={restrictionsOptions}
                      placeholder={t(
                        'companies.edit.form.details.restrictionPlaceholder'
                      )}
                      showClear={hasFullRestrictionAccess}
                    />
                  </InputField>
                </FormGridRow>
              </FormGrid>
            </SectionBox>
            <SectionTitle
              className="mb-3"
              name={t('companies.edit.form.primaryContacts.title')}
              actions={
                <Button
                  disabled={
                    companyId === undefined || !canManage || !canManageCustomers
                  }
                  onClick={() =>
                    navigate(
                      `/apps/management/companies/${companyId}/assignments/contact?primary=true`
                    )
                  }
                  label={t('companies.edit.form.primaryContacts.add')}
                />
              }
            />
            {formData.contacts && formData.contacts.length > 0 && (
              <SectionBox>
                <PrimaryContacts
                  contacts={
                    formData.contacts.filter(
                      (contactAssignment: ContactAssignment) =>
                        contactAssignment.primary,
                    ).length > 0
                      ? formData.contacts.filter(
                          (contactAssignment: ContactAssignment) =>
                            contactAssignment.primary,
                        )
                      : [formData.contacts[0]]
                  }
                />
              </SectionBox>
            )}
          </TabPanel>

          <TabPanel
            disabled={companyId === undefined}
            header={t('companies.edit.tabs.subsidiaries')}
          >
            <SectionTitle
              className="mb-3"
              name={t('companies.edit.form.subsidiaries.title')}
              actions={
                <Button
                  disabled={!canManage}
                  onClick={() =>
                    navigate(
                      `/apps/management/companies/add?parentCompany=${formData.id}`
                    )
                  }
                  label={t('companies.edit.form.subsidiaries.addNew')}
                />
              }
            />
            {formData.id && <Subsidiaries legalEntity={formData} />}
          </TabPanel>

          <TabPanel
            disabled={companyId === undefined}
            header={t('companies.edit.tabs.locations')}
          >
            <SectionBox
              name={t('companies.edit.form.locations.title')}
              actions={
                <Button
                  disabled={!canManage}
                  label={t('companies.edit.form.locations.addNew')}
                  onClick={() =>
                    navigate(
                      `/apps/management/companies/${companyId}/locations`
                    )
                  }
                />
              }
            >
              <Locations legalEntity={formData} readOnly={!canManage} />
            </SectionBox>
          </TabPanel>

          <TabPanel
            disabled={companyId === undefined}
            header={t('companies.edit.tabs.policies')}
          >
            <SectionBox
              name={t('companies.edit.form.policies.purchasingLimits.subtitle')}
              className="mb-5"
            >
              <InputField
                label={t('companies.edit.form.policies.accountLimit')}
                className="mb-3"
              >
                <InputText
                  disabled={!canManage}
                  value={formData.accountLimit?.value}
                  onChange={(event) =>
                    setFormField('accountLimit.value', event.target.value)
                  }
                />
              </InputField>
              <InputField label={t('priceLists.settings.form.currency.label')}>
                <Dropdown
                  appendTo="self"
                  disabled={!canManage}
                  options={currencies}
                  optionLabel="code"
                  optionValue="code"
                  value={formData.accountLimit?.currency}
                  onChange={(event) => {
                    setFormField('accountLimit.currency', event.target.value)
                  }}
                />
              </InputField>
            </SectionBox>
            <ApprovalGroup
              managerPermissions={canManage}
              legalEntity={formData}
            />
          </TabPanel>

          <TabPanel
            disabled={companyId === undefined}
            header={t('companies.edit.tabs.contacts')}
          >
            <SectionTitle
              className="mb-3"
              name={t('companies.edit.form.contacts.title')}
              actions={
                <div className="flex align-items-center justify-content-end">
                  <Button
                    disabled={!canManage || !canViewCustomers}
                    className="mr-2"
                    label={t('companies.edit.form.contacts.assignCustomer')}
                    onClick={() => {
                      const currentPath = `${location.pathname}${location.search}`
                      navigate(
                        `/apps/management/companies/${companyId}/assignments/customer`,
                        { query: { backTo: currentPath } }
                      )
                    }}
                  />
                  <Button
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
                </div>
              }
            />
            <ContactAssignmentList
              managerPermissions={canManage}
              legalEntity={formData}
            />
          </TabPanel>

          <TabPanel
            disabled={companyId === undefined}
            header={t('companies.edit.tabs.customerGroups')}
          >
            <SectionTitle
              className="mb-3"
              name={t('companies.edit.form.customerGroups.title')}
            />
            <CustomerGroupsTable legalEntity={formData} />
          </TabPanel>
          {mixinsTabs}
        </TabView>
      </div>
    </div>
  )
}
