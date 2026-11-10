import { useTranslation } from 'react-i18next'
import { Controller, useFormContext } from 'react-hook-form'
import {
  Chips,
  Dropdown,
  InputText,
  SectionBox,
} from '@emporix/component-library'
import { usePermissions } from '../../context/PermissionsProvider'
import { useCountries } from '../../hooks/useCountries'
import { EmployeeDomains } from '../../configs/accessControls'
import { LocationType } from '../../models/LegalEntity.model'
import { LocationForm } from '../../helpers/locationForm.helpers'
import styles from './LocationDetails.module.scss'

const FORM_PATH = 'companies.locations.form'

type LocationDetailsProps = {
  readonly isExistingLocation: boolean
}

const LocationDetails = ({ isExistingLocation }: LocationDetailsProps) => {
  const { t } = useTranslation()
  const { control } = useFormContext<LocationForm>()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.COMPANIES_MANAGER)
  const { activeCountriesDropdownOptions } = useCountries()

  const locationTypeOptions = [
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

  const textField = (
    name: 'name' | 'addressLine1' | 'addressLine2' | 'city' | 'state',
    labelKey: string,
    className: string
  ) => (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <InputText
          inputId={`location-${name}`}
          data-testid={name}
          className={className}
          label={t(`${FORM_PATH}.${labelKey}`)}
          value={field.value}
          readOnly={!canManage}
          onChange={field.onChange}
        />
      )}
    />
  )

  return (
    <SectionBox className={styles.section} sectionClassName={styles.grid}>
      <Controller
        name="id"
        control={control}
        render={({ field }) => (
          <InputText
            inputId="location-id"
            data-testid="id"
            className={styles.half}
            label={t(`${FORM_PATH}.id`)}
            tooltip={t(`${FORM_PATH}.tooltip.id`)}
            value={field.value}
            readOnly={!canManage || isExistingLocation}
            onChange={field.onChange}
          />
        )}
      />
      {textField('name', 'name', styles.half)}

      <Controller
        name="type"
        control={control}
        render={({ field }) => (
          <Dropdown
            inputId="location-type"
            data-testid="type"
            className={styles.half}
            label={t(`${FORM_PATH}.locationType`)}
            value={field.value}
            options={locationTypeOptions}
            disabled={!canManage}
            onChange={(e) => field.onChange(e.value)}
          />
        )}
      />
      <Controller
        name="country"
        control={control}
        rules={{ required: true }}
        render={({ field }) => (
          <Dropdown
            inputId="location-country"
            data-testid="country"
            className={styles.half}
            label={t(`${FORM_PATH}.country`)}
            disabled={!canManage}
            options={activeCountriesDropdownOptions}
            value={field.value}
            onChange={(e) => field.onChange(e.value)}
          />
        )}
      />

      {textField('addressLine1', 'address1', styles.half)}
      {textField('addressLine2', 'address2', styles.half)}

      {textField('city', 'city', styles.third)}
      {textField('state', 'state', styles.third)}
      <Controller
        name="postcode"
        control={control}
        render={({ field }) => (
          <InputText
            inputId="location-postcode"
            data-testid="postcode"
            className={styles.third}
            label={t(`${FORM_PATH}.postcode`)}
            value={field.value}
            readOnly={!canManage}
            onChange={field.onChange}
          />
        )}
      />

      <Controller
        name="tags"
        control={control}
        render={({ field }) => (
          <Chips
            inputId="location-tags"
            data-testid="tags"
            className={styles.tags}
            label={t(`${FORM_PATH}.tags`)}
            value={field.value}
            disabled={!canManage}
            onChange={(e) => field.onChange(e.value)}
            separator=", "
            addOnBlur
          />
        )}
      />
    </SectionBox>
  )
}

export default LocationDetails
