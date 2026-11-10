import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmBox, useToast } from '@emporix/component-library'
import { LegalEntity, Location } from '../../models/LegalEntity.model'
import { SchemaType } from '../../models/Schema.model'
import { useCustomerManagementApi } from '../../hooks/api/customerManagement'
import { useSchemaApi } from '../../hooks/api/schema'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import {
  mapSchemasToMixinBadges,
  MixinSchemaSource,
} from '../../helpers/locationMixins.helpers'
import LocationRow from './LocationRow'
import styles from './Locations.module.scss'

interface LocationsProps {
  readonly legalEntity: Partial<LegalEntity>
  readonly readOnly: boolean
}

const Locations = (props: LocationsProps) => {
  const { legalEntity } = props
  const [locations, setLocations] = useState<Location[]>([])
  const { t } = useTranslation()
  const { deleteLocation } = useCustomerManagementApi()
  const { getSchemas } = useSchemaApi()
  const { getUiLangValue } = useLocalizedValue()
  const [isDeleteConfirmOpened, setIsDeleteConfirmOpened] = useState(false)
  const [locationIdToDelete, setLocationIdToDelete] = useState<string>()
  const [locationSchemas, setLocationSchemas] = useState<MixinSchemaSource[]>(
    []
  )
  const { showSuccess, showError } = useToast()

  useEffect(() => {
    if (!legalEntity?.entitiesAddresses) return
    setLocations(legalEntity.entitiesAddresses)
  }, [legalEntity])

  // Location mixin schemas are assigned at the type level, so fetch them once
  // and show the same badges on every location card.
  useEffect(() => {
    ;(async () => {
      try {
        setLocationSchemas(await getSchemas(SchemaType.LOCATION))
      } catch (error) {
        console.error(error)
        setLocationSchemas([])
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity: once per mount
  }, [])

  const mixinBadges = useMemo(
    () => mapSchemasToMixinBadges(locationSchemas, getUiLangValue),
    [locationSchemas, getUiLangValue]
  )

  const handleLocationDelete = useCallback(
    async (locationId?: string) => {
      if (locationId) {
        try {
          await deleteLocation(locationId)
          setLocations((current) =>
            current.filter((location) => location.id !== locationId)
          )
          showSuccess(t('companies.locations.toast.delete.success.title'))
        } catch (error) {
          showError(t('companies.locations.toast.delete.error'))
          console.error(error)
        } finally {
          setIsDeleteConfirmOpened(false)
        }
      }
    },
    [deleteLocation, showSuccess, showError, t]
  )

  return legalEntity.id ? (
    <div className={styles.list}>
      {locations.map((location) => {
        return (
          <LocationRow
            key={location.id}
            location={location}
            companyId={legalEntity?.id ? legalEntity.id : ''}
            disabled={props.readOnly}
            mixinBadges={mixinBadges}
            onDelete={() => {
              setLocationIdToDelete(location.id)
              setIsDeleteConfirmOpened(true)
            }}
          />
        )
      })}
      <ConfirmBox
        data-testid="location-delete-confirm"
        visible={isDeleteConfirmOpened}
        onAccept={() => handleLocationDelete(locationIdToDelete)}
        onReject={() => {
          setIsDeleteConfirmOpened(false)
        }}
        title={`${t('companies.locations.actions.delete')}`}
        message={t('confirmBox.message')}
        acceptLabel={t('global.yes')}
        rejectLabel={t('global.cancel')}
      />
    </div>
  ) : (
    <></>
  )
}

export default Locations
