import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import {
  EntityChangelog,
  type EntityChangelogLabels,
  type EntityChangelogLinks,
} from '@emporix/md-audit-log'
import { getEntityDetailPath } from '../../configs/entityLinkConfig'
import { useDashboardContext } from '../../context/Dashboard.context'
import { useChangelogApi } from '../../hooks/api/changelog'

type EntityChangelogTabProps = {
  readonly entity: string
  readonly entityId: string
  readonly isActive?: boolean
  readonly className?: string
}

const ENTITY_LINKS: EntityChangelogLinks = {
  pathOf: getEntityDetailPath,
  render: ({ to, className, title, children }) => (
    <Link to={to} className={className} title={title}>
      {children}
    </Link>
  ),
}

const changelogLabels = (t: TFunction): EntityChangelogLabels => ({
  empty: t('auditLog.entityChangelog.empty'),
  loadError: t('auditLog.loadError'),
  retry: t('auditLog.retry'),
  notSet: t('auditLog.entityChangelog.notSet'),
  fieldColumn: t('auditLog.entityChangelog.table.field'),
  previousValueColumn: t('auditLog.entityChangelog.table.previousValue'),
  updatedValueColumn: t('auditLog.entityChangelog.table.updatedValue'),
  windowLabel: t('auditLog.window.label'),
  windowLimitHint: t('auditLog.window.limitHint'),
  previousPage: t('global.previousPage'),
  nextPage: t('global.nextPage'),
  rowsPerPage: t('auditLog.rowsPerPage'),
  changeType: (key) => t(`auditLog.changeTypes.${key}`),
  entity: (entity) =>
    t(`auditLog.entities.${entity}`, { defaultValue: entity }),
})

const EntityChangelogTab = ({
  entity,
  entityId,
  isActive = false,
  className = '',
}: EntityChangelogTabProps): JSX.Element => {
  const { t, i18n } = useTranslation()
  const { tenant } = useDashboardContext()
  const { getChangelogCursorPage } = useChangelogApi()

  return (
    <EntityChangelog
      entity={entity}
      entityId={entityId}
      enabled={isActive}
      className={className}
      tenant={tenant ?? ''}
      fetchPage={getChangelogCursorPage}
      labels={changelogLabels(t)}
      locale={i18n.language}
      dateFormat={t('global.dateFormat')}
      entityLinks={ENTITY_LINKS}
    />
  )
}

export default EntityChangelogTab
