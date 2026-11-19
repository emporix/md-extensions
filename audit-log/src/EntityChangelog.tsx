import { useMemo, useState, type ReactElement, type ReactNode } from 'react'
import {
  DataTableEmptyState,
  PrimaryButton,
  ProgressSpinner,
  SecondaryButton,
} from '@emporix/component-library'
import ChangelogCard from './card/ChangelogCard'
import type { EntityChangelogLabels } from './labels'
import ChangelogPaginator from './paging/ChangelogPaginator'
import useChangelogCursorPage, {
  type FetchChangelogPage,
} from './paging/useChangelogCursorPage'
import {
  defaultChangelogWindow,
  type ChangelogScope,
} from './window/changelogWindow'
import ChangelogWindowPicker from './window/ChangelogWindowPicker'
import styles from './EntityChangelog.module.scss'

export type ChangelogLinkProps = {
  readonly to: string
  readonly className: string
  readonly title: string
  readonly children: ReactNode
}

export type EntityChangelogLinks = {
  readonly pathOf: (entity: string, entityId: string) => string | undefined
  readonly render: (link: ChangelogLinkProps) => ReactElement
}

export type EntityChangelogProps = {
  readonly entity: string
  readonly entityId: string
  readonly enabled: boolean
  readonly tenant: string
  readonly fetchPage: FetchChangelogPage
  readonly labels: EntityChangelogLabels
  readonly locale: string
  readonly dateFormat: string
  readonly entityLinks?: EntityChangelogLinks
  readonly className?: string
}

const DEFAULT_ROWS = 10
const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100]

const EntityChangelog = ({
  entity,
  entityId,
  enabled,
  tenant,
  fetchPage,
  labels,
  locale,
  dateFormat,
  entityLinks,
  className = '',
}: EntityChangelogProps): JSX.Element => {
  const [rows, setRows] = useState(DEFAULT_ROWS)
  const [changelogWindow, setChangelogWindow] = useState(() =>
    defaultChangelogWindow(new Date())
  )
  const scope = useMemo<ChangelogScope>(
    () => ({ entity, entityId }),
    [entity, entityId]
  )
  const page = useChangelogCursorPage(scope, changelogWindow, rows, {
    tenant,
    fetchPage,
    enabled: enabled && entityId !== '',
  })
  const isLoading = page.status === 'loading'
  const tabClassName = `${styles.tab} ${className}`.trim()

  if (!enabled) {
    return <div className={tabClassName} />
  }

  const renderEmpty = (text: string, retry?: () => void) => (
    <div className={styles.emptyState}>
      <DataTableEmptyState message={text} showIcon={true} />
      {retry ? (
        <PrimaryButton className={styles.actionLink} onClick={retry}>
          {labels.retry}
        </PrimaryButton>
      ) : null}
    </div>
  )

  const renderBody = () => {
    if (page.items.length === 0 && isLoading) {
      return (
        <div className={styles.loading}>
          <ProgressSpinner />
        </div>
      )
    }
    if (page.items.length === 0 && page.status === 'error') {
      return renderEmpty(labels.loadError, page.retry)
    }
    if (page.items.length === 0) {
      return renderEmpty(labels.empty)
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
            labels={labels}
            locale={locale}
            entityLinks={entityLinks}
          />
        ))}
        {page.status === 'error' && (
          <div className={styles.window}>
            <span>{labels.loadError}</span>
            <SecondaryButton size="small" onClick={page.retry}>
              {labels.retry}
            </SecondaryButton>
          </div>
        )}
        <ChangelogPaginator
          nextCursor={page.nextCursor}
          prevCursor={page.prevCursor}
          rows={rows}
          rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
          isLoading={isLoading}
          labels={labels}
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
          labels={labels}
          dateFormat={dateFormat}
        />
      </div>
      {renderBody()}
    </div>
  )
}

export default EntityChangelog
