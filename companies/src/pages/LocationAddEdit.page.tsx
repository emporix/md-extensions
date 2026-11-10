import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { FormProvider, useForm } from 'react-hook-form'
import {
  PrimaryButton,
  SecondaryButton,
  Tabs,
  useToast,
  type TabItem,
} from '@emporix/component-library'
import HeaderSection from '../components/shared/HeaderSection'
import LocationDetails from '../components/companies/LocationDetails'
import useMixinsForm from '../components/mixins/useMixinsForm'
import type { MixinsFormMetadata } from '../components/mixins/helpers'
import { useCustomerManagementApi } from '../hooks/api/customerManagement'
import useCustomNavigate from '../hooks/useCustomNavigate'
import useUpdateEffect from '../hooks/useUpdateEffect'
import { useUIBlocker } from '../context/UIBlocker'
import { usePermissions } from '../context/PermissionsProvider'
import { useDashboardContext } from '../context/Dashboard.context'
import { EmployeeDomains } from '../configs/accessControls'
import { Location } from '../models/LegalEntity.model'
import { Mixins } from '../models/Mixins.model'
import { SchemaType } from '../models/Schema.model'
import { getApiErrorDetails, getApiErrorMessage } from '../helpers/api'
import {
  createLocationForm,
  LocationForm,
  mapLocationFormToPayload,
  mapLocationToLocationForm,
} from '../helpers/locationForm.helpers'
import {
  companiesListPath,
  companyDetailPath,
  locationEditPath,
} from '../constants/paths'
import styles from './LocationAddEdit.page.module.scss'

const GENERAL_TAB = 'general'

const saveErrorMessage = (e: unknown) =>
  getApiErrorMessage(e) ?? (e instanceof Error ? e.message : undefined)

const LocationAddEditPage = () => {
  const { locationId, companyId } = useParams()
  const [searchParams] = useSearchParams()
  const mixinParam = searchParams.get('mixin')
  const { t } = useTranslation()
  const { tenant } = useDashboardContext()
  const toast = useToast()
  const { navigate, simpleNavigate } = useCustomNavigate()
  const { blockPanel } = useUIBlocker()
  const { getLocation, updateLocation, createLocation, deleteLocation } =
    useCustomerManagementApi()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.COMPANIES_MANAGER)

  const [location, setLocation] = useState<Location>()
  const [activeTabId, setActiveTabId] = useState(GENERAL_TAB)

  const methods = useForm<LocationForm>({ defaultValues: createLocationForm() })
  const { handleSubmit, reset, watch, formState } = methods
  const country = watch('country')

  const saveMixin = useCallback(
    async (data: Mixins, { key, url }: MixinsFormMetadata) => {
      if (!location?.id) return
      try {
        blockPanel(true)
        await updateLocation({
          ...location,
          mixins: { ...location.mixins, [key]: data },
          metadata: {
            ...location.metadata,
            mixins: {
              ...(location.metadata?.mixins as Record<string, string>),
              [key]: url,
            },
          },
        })
        setLocation(await getLocation(location.id))
        toast.showToast(
          t('companies.locations.toast.success.title'),
          '',
          'success'
        )
      } catch (e: unknown) {
        toast.showError(t('companies.toasts.errorSave'), saveErrorMessage(e))
        console.error('Error saving location mixin:', e)
      } finally {
        blockPanel(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
    [location, t]
  )

  const { loadMixins, mixinsTabs, mixinsForms } = useMixinsForm({
    type: SchemaType.LOCATION,
    onEdit: saveMixin,
    managerPermissions: canManage,
  })

  // Initial load (once per location id): fetch, seed the General form + local state.
  useEffect(() => {
    ;(async () => {
      try {
        if (locationId) {
          const loc = await getLocation(locationId)
          setLocation(loc)
          reset(mapLocationToLocationForm(loc))
        } else {
          setLocation(undefined)
          reset(createLocationForm())
        }
      } catch (e: unknown) {
        toast.showError(t('companies.toasts.errorLoad'), getApiErrorDetails(e))
        console.error('Error loading location:', e)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [locationId, t])

  // Reload mixin forms whenever the underlying location changes (initial load or
  // after a mixin/General save) so persisted values are reflected.
  useEffect(() => {
    if (location) {
      void loadMixins(
        (location.metadata?.mixins ?? {}) as Record<string, string>,
        (location.mixins ?? {}) as Mixins
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [location])

  // Deep-link: `?mixin=<schemaId>` selects the matching mixin tab.
  // `mixinsForms[].id` is the schema id and the CL tab id, so match directly —
  // this works even when the record has no saved values for that mixin yet.
  useEffect(() => {
    if (!mixinParam) return
    if (mixinsForms.some((form) => form.id === mixinParam)) {
      setActiveTabId(mixinParam)
    }
  }, [mixinParam, mixinsForms])

  useUpdateEffect(() => {
    navigate(companiesListPath())
  }, [tenant])

  const onSubmit = useCallback(
    async (data: LocationForm) => {
      try {
        blockPanel(true)
        if (locationId) {
          await updateLocation(mapLocationFormToPayload(data, location))
          const fresh = await getLocation(locationId)
          setLocation(fresh)
          reset(mapLocationToLocationForm(fresh))
        } else if (companyId) {
          const newLocationId = await createLocation(
            companyId,
            mapLocationFormToPayload(data)
          )
          simpleNavigate(locationEditPath(companyId, newLocationId))
        }
        toast.showToast(
          t('companies.locations.toast.success.title'),
          '',
          'success'
        )
      } catch (e: unknown) {
        toast.showError(t('companies.toasts.errorSave'), saveErrorMessage(e))
        console.error('Error saving location:', e)
      } finally {
        blockPanel(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
    [locationId, companyId, location, t]
  )

  const handleDelete = useCallback(async () => {
    if (!locationId || !companyId) return
    try {
      await deleteLocation(locationId)
      toast.showToast(
        t('companies.locations.toast.delete.success.title'),
        '',
        'success'
      )
      navigate(companyDetailPath(companyId))
    } catch (e: unknown) {
      toast.showError(t('companies.toasts.errorDelete'), getApiErrorDetails(e))
      console.error('Error deleting location:', e)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [locationId, companyId, t])

  const hasMixins =
    mixinsForms.length > 0 ||
    Object.keys(location?.metadata?.mixins ?? {}).some(
      (key) => !key.startsWith('class_')
    )

  const isExistingLocation = locationId !== undefined

  const tabs: TabItem[] = useMemo(
    () => [
      {
        id: GENERAL_TAB,
        label: t('companies.locations.tabs.general'),
        content: <LocationDetails isExistingLocation={isExistingLocation} />,
      },
      ...mixinsTabs,
    ],
    [t, isExistingLocation, mixinsTabs]
  )

  return (
    <FormProvider {...methods}>
      <HeaderSection
        title={t('companies.locations.singular')}
        subtitle={locationId && location?.name}
        backTo={
          companyId ? companyDetailPath(companyId, 'tab=locations') : undefined
        }
        moduleActions={
          <div className={styles.actions}>
            {locationId && (
              <SecondaryButton
                data-testid="location-delete"
                disabled={!canManage}
                onClick={handleDelete}
              >
                {t('global.delete')}
              </SecondaryButton>
            )}
            <SecondaryButton
              data-testid="location-discard"
              disabled={!formState.isDirty}
              onClick={() => reset()}
            >
              {t('global.discard')}
            </SecondaryButton>
            <PrimaryButton
              data-testid="location-save"
              disabled={!formState.isDirty || !canManage || !country}
              onClick={handleSubmit(onSubmit)}
            >
              {t('global.save')}
            </PrimaryButton>
          </div>
        }
      />

      <div className={styles.content}>
        {hasMixins ? (
          <Tabs
            data-testid="location-tabs"
            scrollable
            keepMounted
            tabs={tabs}
            activeTabId={
              tabs.some((tab) => tab.id === activeTabId)
                ? activeTabId
                : GENERAL_TAB
            }
            onTabChange={setActiveTabId}
          />
        ) : (
          <LocationDetails isExistingLocation={isExistingLocation} />
        )}
      </div>
    </FormProvider>
  )
}

export default LocationAddEditPage
