import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ProgressSpinner, SecondaryButton } from '@emporix/component-library'
import {
  defaultChangelogWindow,
  type ChangelogScope,
} from '../../helpers/auditLog/changelogWindow.helpers'
import useChangelogCursorPage from '../../hooks/useChangelogCursorPage'
import { DEFAULT_PAGINATION_PROPS } from '../../hooks/usePagination'
import EmptyContent from '../shared/EmptyContent'
import ChangelogCard from './ChangelogCard'
import ChangelogPaginator from './ChangelogPaginator'
import ChangelogWindowPicker from './ChangelogWindowPicker'
import styles from './EntityChangelogTab.module.scss'

type EntityChangelogTabProps = {
  readonly entity: string
  readonly entityId: string
  readonly isActive?: boolean
  readonly className?: string
}

const DEFAULT_ROWS = 10
const ROWS_PER_PAGE_OPTIONS = DEFAULT_PAGINATION_PROPS.rowsPerPageOptions

const EntityChangelogTab = ({
  entity,
  entityId,
  isActive = false,
  className = '',
}: EntityChangelogTabProps): JSX.Element => {
  const { t } = useTranslation()
  const [rows, setRows] = useState(DEFAULT_ROWS)
  const [changelogWindow, setChangelogWindow] = useState(() =>
    defaultChangelogWindow(new Date())
  )
  const scope = useMemo<ChangelogScope>(
    () => ({ entity, entityId }),
    [entity, entityId]
  )
  const page = useChangelogCursorPage(scope, changelogWindow, rows, {
    enabled: isActive && entityId !== '',
  })
  const isLoading = page.status === 'loading'
  const tabClassName = `${styles.tab} ${className}`.trim()

  if (!isActive) {
    return <div className={tabClassName} />
  }

  const renderBody = () => {
    if (page.items.length === 0 && isLoading) {
      return (
        <div className={styles.loading}>
          <ProgressSpinner />
        </div>
      )
    }
    if (page.items.length === 0 && page.status === 'error') {
      return (
        <EmptyContent
          text={t('auditLog.loadError')}
          buttonLabel={t('auditLog.retry')}
          action={page.retry}
        />
      )
    }
    if (page.items.length === 0) {
      return <EmptyContent text={t('auditLog.entityChangelog.empty')} />
    }
    return (
      <>
        {page.items.map((item, index) => (
          <ChangelogCard
            // Identical records can share a page (rows not yet compacted), so the index keeps keys unique
            key={`${item.at}-${item.type}-${item.entity}-${item.entityId}-${
              item.actor ?? ''
            }-${index}`}
            item={item}
            currentEntity={entity}
            currentEntityId={entityId}
          />
        ))}
        {page.status === 'error' && (
          <div className={styles.window}>
            <span>{t('auditLog.loadError')}</span>
            <SecondaryButton size="small" onClick={page.retry}>
              {t('auditLog.retry')}
            </SecondaryButton>
          </div>
        )}
        <ChangelogPaginator
          nextCursor={page.nextCursor}
          prevCursor={page.prevCursor}
          rows={rows}
          rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS ?? [DEFAULT_ROWS]}
          isLoading={isLoading}
          onNext={page.goNext}
          onPrevious={page.goPrev}
          onRowsChange={setRows}
        />
      </>
    )
  }

  return (
    <div className={tabClassName}>
      <div className={styles.window}>
        <ChangelogWindowPicker
          value={changelogWindow}
          onChange={setChangelogWindow}
        />
      </div>
      {renderBody()}
    </div>
  )
}

export default EntityChangelogTab
