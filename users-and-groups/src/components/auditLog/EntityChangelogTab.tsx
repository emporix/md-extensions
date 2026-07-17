import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ProgressSpinner } from '@emporix/component-library'
import { useChangelogApi } from '../../hooks/api/changelog'
import { useDashboardContext } from '../../context/Dashboard.context'
import { makeCall } from '../../helpers/api'
import usePagination, {
  DEFAULT_PAGINATION_PROPS,
} from '../../hooks/usePagination'
import type { ChangelogItem } from '../../models/Changelog.model'
import EmptyContent from '../shared/EmptyContent'
import ChangelogCard from './ChangelogCard'
import ChangelogPaginator from './ChangelogPaginator'
import styles from './EntityChangelogTab.module.scss'

type EntityChangelogTabProps = {
  readonly entity: string
  readonly entityId: string
  readonly isActive?: boolean
  readonly className?: string
}

const EntityChangelogTab = ({
  entity,
  entityId,
  isActive = false,
  className = '',
}: EntityChangelogTabProps) => {
  const { t } = useTranslation()
  const { tenant } = useDashboardContext()
  const { getEntityChangelog } = useChangelogApi()
  const initialPaginationRef = useRef({ ...DEFAULT_PAGINATION_PROPS })
  const { paginationParams, onPageCallback, resetPagination } = usePagination(
    initialPaginationRef.current,
    false
  )
  const [items, setItems] = useState<ChangelogItem[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const entityKey = `${entity}:${entityId}`
  const prevEntityKeyRef = useRef(entityKey)
  const currentPage = paginationParams.currentPage ?? 1
  const rows = paginationParams.rows ?? 10

  useEffect(() => {
    if (!isActive || !entityId || !tenant) {
      return
    }

    if (prevEntityKeyRef.current !== entityKey) {
      prevEntityKeyRef.current = entityKey
      setItems([])
      setTotalElements(0)
      resetPagination()
      return
    }

    void (async () => {
      try {
        const data = await makeCall(
          () =>
            getEntityChangelog(entity, entityId, {
              pagination: paginationParams,
            }),
          setIsLoading
        )
        setItems(data?.items ?? [])
        setTotalElements(data?.totalElements ?? 0)
      } catch (error) {
        console.error(error)
        setItems([])
        setTotalElements(0)
      }
    })()
    // resetPagination is not memoized in usePagination — do not add it here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isActive,
    entity,
    entityId,
    entityKey,
    tenant,
    getEntityChangelog,
    currentPage,
    rows,
  ])

  if (!isActive) {
    return <div className={`${styles.tab} ${className}`.trim()} />
  }

  if (isLoading && totalElements === 0) {
    return (
      <div className={`${styles.tab} ${styles.loading} ${className}`.trim()}>
        <ProgressSpinner />
      </div>
    )
  }

  if (totalElements === 0) {
    return (
      <div className={`${styles.tab} ${className}`.trim()}>
        <EmptyContent text={t('auditLog.entityChangelog.empty')} />
      </div>
    )
  }

  return (
    <div className={`${styles.tab} ${className}`.trim()}>
      {items.map((item, index) => (
        <ChangelogCard
          key={`${item.at}-${item.type}-${item.entity}-${item.entityId}-${
            item.actor ?? ''
          }`}
          item={item}
          currentEntity={entity}
          currentEntityId={entityId}
          iterationNumber={
            totalElements - (paginationParams.first ?? 0) - index
          }
        />
      ))}
      <ChangelogPaginator
        paginationParams={paginationParams}
        totalRecords={totalElements}
        onPageChange={onPageCallback}
      />
    </div>
  )
}

export default EntityChangelogTab
