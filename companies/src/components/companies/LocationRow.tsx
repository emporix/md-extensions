import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router'
import { BsHouse } from 'react-icons/bs'
import { Chip } from '@emporix/component-library'
import { Location } from '../../models/LegalEntity.model'
import useCustomNavigate from '../../hooks/useCustomNavigate'
import { formatAddress } from '../../helpers/companyFormat.helpers'
import { LocationMixinBadge } from '../../helpers/locationMixins.helpers'
import { locationEditPath } from '../../constants/paths'
import TableActions from '../shared/TableActions'
import { LabelValueCell } from './LabelValueCell'
import LocationMixinsRow from './LocationMixinsRow'
import styles from './Locations.module.scss'

// MD grey Badge pill (palette grey-1 / grey-6).
const TAG_STYLE = { background: '#f2f3f5', color: '#3e4759' }

interface LocationRowProps {
  readonly location: Location
  readonly companyId: string
  readonly disabled: boolean
  readonly mixinBadges: LocationMixinBadge[]
  readonly onDelete: () => void
}

const LocationRow = (props: LocationRowProps) => {
  const { location, companyId, mixinBadges } = props
  const { navigate } = useCustomNavigate()
  const routerLocation = useLocation()
  const { t } = useTranslation()

  const openLocation = (mixinKey?: string) => {
    const query = new URLSearchParams({
      backTo: `${routerLocation.pathname}${routerLocation.search}`,
      ...(mixinKey ? { mixin: mixinKey } : {}),
    })
    navigate(locationEditPath(companyId, location.id ?? '', query))
  }

  return (
    <div className={styles.row} data-testid="location-row">
      <div className={styles.location}>
        <div className={styles.icon}>
          <BsHouse size={18} />
        </div>
        <LabelValueCell
          label={t('companies.locations.list.name')}
          value={location.name}
        />
        <LabelValueCell
          label={t('companies.locations.list.locationType')}
          value={location.type}
        />
        <LabelValueCell
          label={t('companies.locations.list.address')}
          value={formatAddress(location.contactDetails ?? {})}
        />
        <LabelValueCell
          label={t('companies.locations.list.tags')}
          value={
            <div className={styles.tags}>
              {location.contactDetails?.tags?.length
                ? location.contactDetails.tags.map((tag, i) => (
                    <Chip key={i} label={tag} style={TAG_STYLE} />
                  ))
                : '--'}
            </div>
          }
        />
        <div className={styles.actions}>
          <TableActions
            onEdit={() => openLocation()}
            onDelete={props.onDelete}
            // Viewers can open a location read-only but not delete it (Scenario 3).
            managerPermission={!props.disabled}
            deleteConfirm={{
              pluralsPath: 'companies',
              entity: location,
            }}
          />
        </div>
      </div>
      <LocationMixinsRow badges={mixinBadges} onOpen={openLocation} />
    </div>
  )
}

export default LocationRow
