import { useTranslation } from 'react-i18next'
import { BsArrowRight } from 'react-icons/bs'
import { LocationMixinBadge } from '../../helpers/locationMixins.helpers'
import styles from './LocationMixinsRow.module.scss'

interface LocationMixinsRowProps {
  readonly badges: LocationMixinBadge[]
  readonly onOpen: (mixinKey: string) => void
}

const LocationMixinsRow = ({ badges, onOpen }: LocationMixinsRowProps) => {
  const { t } = useTranslation()

  if (badges.length === 0) {
    return null
  }

  return (
    <div className={styles.wrapper}>
      <span className={styles.label}>
        {t('companies.locations.list.mixins')}
      </span>
      <div className={styles.badges}>
        {badges.map((badge) => (
          <button
            key={badge.key}
            type="button"
            className={styles.badge}
            onClick={() => onOpen(badge.key)}
            aria-label={t('companies.locations.list.openMixin', {
              name: badge.name,
            })}
          >
            <span className={styles.name}>{badge.name}</span>
            {badge.fields.length > 0 && (
              <span className={styles.fields}>
                {badge.fields.join(' · ')}
                {badge.hasMore ? ' …' : ''}
              </span>
            )}
            <BsArrowRight className={styles.arrow} size={14} />
          </button>
        ))}
      </div>
    </div>
  )
}

export default LocationMixinsRow
