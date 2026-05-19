import React, { useCallback, useEffect, useMemo } from 'react'
import { Location, LocationType } from '../../models/LegalEntity'
import HeaderSection from '../shared/HeaderSection'
import { Button } from 'primereact/button'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import InputField from '../InputField'
import SectionBox from '../SectionBox'
import { Dropdown } from 'primereact/dropdown'
import { useCountries } from '../../hooks/useCountries'
import { Country } from '../../models/Country'
import { InputText } from 'primereact/inputtext'
import { useCustomerManagementApi } from '../../api/customerManagement'
import { useToast } from '../../context/ToastProvider'
import { useUIBlocker } from '../../context/UIBlcoker'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import useUpdateEffect from '../../hooks/useUpdateEffect'
import useForm from '../../hooks/useForm'
import useCustomNavigate from '../../hooks/useCustomNavigate'
import { Chips, ChipsChangeParams } from "primereact/chips";
import { usePermissions } from '../../context/PermissionsProvider'
import { useTenant } from '../../context/TenantProvider'
import { EmployeeDomains } from '../../configs/accessControls'

export const LocationAddEdit = () => {
  const { locationId, companyId } = useParams()
  const { i18n, t } = useTranslation()
  const { tenant } = useTenant()

  const toast = useToast()
  const { navigate, simpleNavigate } = useCustomNavigate()
  const { blockPanel } = useUIBlocker()
  const { getLocation, updateLocation, createLocation, deleteLocation } =
    useCustomerManagementApi()
  const { activeCountries } = useCountries()
  const { formData, setInitFormData, formDirty, setFormField, resetForm } =
    useForm<Location>()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.COMPANIES_MANAGER)

  useEffect(() => {
    ;(async () => {
      try {
        if (locationId) {
          setInitFormData(await getLocation(locationId))
        } else {
          setInitFormData({
            type: LocationType.HEADQUARTER,
          })
        }
      } catch (e: any) {
        toast.showError(
          t('companies.toasts.errorLoad'),
          e.response.data.details || e.response.data.message
        )
        console.error('Error loading location:', e)
      }
    })()
  }, [locationId, t])

  useUpdateEffect(() => {
    navigate(`/apps/management/companies`)
  }, [tenant])

  const handleDelete = useCallback(async () => {
    if (locationId) {
      try {
        await deleteLocation(locationId)
        toast.showToast(
          t('companies.locations.toast.delete.success.title'),
          '',
          'success'
        )
        navigate(`/apps/management/companies/${companyId}`)
      } catch (e: any) {
        toast.showError(
          t('companies.toasts.errorDelete'),
          e.response.data.details || e.response.data.message
        )
        console.error('Error deleting location:', e)
      }
    }
  }, [locationId, companyId, t])

  const onSubmit = useCallback(async () => {
    if (locationId) {
      try {
        blockPanel(true)
        await updateLocation(formData)
        setInitFormData(await getLocation(locationId))
        toast.showToast(
          t('companies.locations.toast.success.title'),
          '',
          'success'
        )
      } catch (e: any) {
        toast.showError(
          t('companies.toasts.errorSave'),
          e.response?.data?.message || e.message
        )
        console.error('Error updating location:', e)
      } finally {
        blockPanel(false)
      }
    } else if (companyId && !locationId) {
      try {
        blockPanel(true)
        const newLocationId = await createLocation(companyId, formData)
        setInitFormData(await getLocation(newLocationId))
        toast.showToast(
          t('companies.locations.toast.success.title'),
          '',
          'success'
        )
        simpleNavigate(
          `/apps/management/companies/${companyId}/locations/${newLocationId}`
        )
      } catch (e: any) {
        toast.showError(
          t('companies.toasts.errorSave'),
          e.response?.data?.message || e.message
        )
        console.error('Error creating location:', e)
      } finally {
        blockPanel(false)
      }
    }
  }, [formData, locationId, companyId, toast])

  const locationTypesOptions = useMemo(() => {
    return [
      {
        value: LocationType.WAREHOUSE,
        label: t('companies.locations.locationType.warehouse'),
      },
      {
        value: LocationType.OFFICE,
        label: t('companies.locations.locationType.office'),
      },
      {
        value: LocationType.HEADQUARTER,
        label: t('companies.locations.locationType.headquarter'),
      },
    ]
  }, [i18n.language])

  const { getContentLangValue } = useLocalizedValue()

  return (
    <div className="module grid-nogutter ">
      <HeaderSection
        title={t('companies.singular')}
        subtitle={locationId && formData.name}
        backTo={`/apps/management/companies/${companyId}?tab=locations`}
        moduleActions={
          <>
            <Button
              disabled={!formDirty}
              className="p-button-secondary"
              onClick={resetForm}
              label={t('global.discard')}
            />
            <Button
              disabled={
                !formDirty ||
                !canManage ||
                !formData.contactDetails?.countryCode
              }
              className="ml-2"
              label={t('global.save')}
              onClick={onSubmit}
            />
          </>
        }
      />

      {locationId && (
        <div className="col-12 mb-2">
          <Button
            disabled={!canManage}
            loading={false}
            className="ml-2 p-button-secondary"
            label={t('global.delete')}
            onClick={handleDelete}
          />
        </div>
      )}
      <div className="xl:col-6 md:col-12">
        <SectionBox className={'grid mx-0 my-0'}>
          <InputField
            label={t('companies.locations.form.id')}
            tooltip={t('companies.locations.form.tooltip.id')}
            className={'col-12'}
          >
            <InputText
              disabled={!canManage || locationId !== undefined}
              value={formData.id || ''}
              onChange={(event) => setFormField('id', event.target.value)}
            />
          </InputField>
          <InputField
            label={t('companies.locations.form.locationType')}
            className={'col-12'}
          >
            <Dropdown
              appendTo="self"
              disabled={!canManage}
              options={locationTypesOptions}
              value={formData.type}
              onChange={(event) => setFormField('type', event.value)}
            />
          </InputField>
          <InputField
            className={'col-12'}
            label={t('companies.locations.form.country')}
            required={true}
          >
            <Dropdown
              appendTo="self"
              disabled={!canManage}
              options={activeCountries.map((country: Country) => ({
                label: getContentLangValue(country.name),
                value: country.code,
              }))}
              onChange={(event) =>
                setFormField('contactDetails.countryCode', event.value)
              }
              value={formData.contactDetails?.countryCode}
            />
          </InputField>
          <InputField
            className={'col-12'}
            label={t('companies.locations.form.name')}
          >
            <InputText
              disabled={!canManage}
              value={formData.name || ''}
              onChange={(event) => setFormField('name', event.target.value)}
            />
          </InputField>
          <InputField
            className={'col-12'}
            label={t('companies.locations.form.address1')}
          >
            <InputText
              disabled={!canManage}
              value={formData.contactDetails?.addressLine1 || ''}
              onChange={(event) =>
                setFormField('contactDetails.addressLine1', event.target.value)
              }
            />
          </InputField>
          <InputField
            className={'col-12'}
            label={t('companies.locations.form.address2')}
          >
            <InputText
              disabled={!canManage}
              value={formData.contactDetails?.addressLine2 || ''}
              onChange={(event) =>
                setFormField('contactDetails.addressLine2', event.target.value)
              }
            />
          </InputField>
          <InputField
            className={'col-4'}
            label={t('companies.locations.form.city')}
          >
            <InputText
              disabled={!canManage}
              value={formData.contactDetails?.city || ''}
              onChange={(event) =>
                setFormField('contactDetails.city', event.target.value)
              }
            />
          </InputField>
          <InputField
            className={'col-4'}
            label={t('companies.locations.form.state')}
          >
            <InputText
              disabled={!canManage}
              value={formData.contactDetails?.state || ''}
              onChange={(event) =>
                setFormField('contactDetails.state', event.target.value)
              }
            />
          </InputField>
          <InputField
            label={t('companies.locations.form.postcode')}
            className={'col-4'}
          >
            <InputText
              disabled={!canManage}
              value={formData.contactDetails?.postcode || ''}
              onChange={(event) =>
                setFormField('contactDetails.postcode', event.target.value)
              }
            />
          </InputField>
          <InputField
            label={t('companies.locations.form.tags')}
            className={'col-12'}
          >
            <Chips
              disabled={!canManage}
              value={formData.contactDetails?.tags}
              onChange={(event: ChipsChangeParams) =>
                setFormField('contactDetails.tags', event.value)
              }
              separator=", "
              addOnBlur
            />
          </InputField>
        </SectionBox>
      </div>
    </div>
  )
}
