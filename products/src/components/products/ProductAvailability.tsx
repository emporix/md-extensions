import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSites } from '../../context/SitesProvider'
import { Availability } from '@emporix/api-calls'
import { useAvailabilityApi } from '../../hooks/api/availability'
import { useRefresh } from '../../context/RefreshValuesProvider'
import { useTranslation } from 'react-i18next'
import {
  ConfirmBox,
  DataTable,
  type DataTableColumnProps,
  SectionTitle,
} from '@emporix/component-library'
import AvailabilityRecordExpansion from './AvailabilityRecordExpansion'
import styles from './ProductAvailability.module.scss'

type ProductAvailabilityProps = {
  readonly productId: string
}

type AvailabilityRow = Availability & { rowKey: string }

/** Prime row-expansion state: keyed by `dataKey`, or an array of rows. */
type ExpandedRows = AvailabilityRow[] | Record<string, boolean> | undefined

const emptyForSite = (siteCode?: string) =>
  ({ site: siteCode, stockLevel: 0, popularity: 0 }) as Availability
const getRowKey = (a: Availability): string => a.id ?? `new-${a.site}`

const withRowKey = (a: Availability): AvailabilityRow => ({
  ...a,
  rowKey: getRowKey(a),
})

const getExpandedKeys = (expanded: unknown): Set<string> => {
  if (!expanded) return new Set()
  if (Array.isArray(expanded)) {
    return new Set(expanded.map((e) => (e as AvailabilityRow).rowKey))
  }
  return new Set(Object.keys(expanded as Record<string, unknown>))
}

export const ProductAvailability = ({
  productId,
}: ProductAvailabilityProps) => {
  const { currentSite, sites } = useSites()
  const [availability, setAvailability] = useState<AvailabilityRow[]>([])
  const { refresh } = useRefresh()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const { getAllAvailabilities } = useAvailabilityApi()

  const [expandedRows, setExpandedRows] = useState<ExpandedRows>(undefined)
  const [pendingCollapse, setPendingCollapse] = useState<{
    newExpanded: ExpandedRows
    rowKey: string
  } | null>(null)
  const dirtyRowKeys = useRef<Set<string>>(new Set())

  useEffect(() => {
    ;(async () => {
      if (sites) {
        setLoading(true)
        try {
          const found = await getAllAvailabilities(productId)
          const merged = sites.flatMap((site) => {
            const forSite = found.filter((a) => a.site === site.code)
            return forSite.length > 0
              ? forSite
              : [emptyForSite(site.code as string)]
          })
          setAvailability(merged.map(withRowKey))
        } catch (error) {
          console.error(error)
          setAvailability(
            sites.map((site) => withRowKey(emptyForSite(site.code as string)))
          )
        } finally {
          setLoading(false)
        }
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [currentSite, productId, sites, refresh])

  const handleRowDirtyChange = useCallback(
    (rowKey: string, isDirty: boolean) => {
      if (isDirty) {
        dirtyRowKeys.current.add(rowKey)
      } else {
        dirtyRowKeys.current.delete(rowKey)
      }
    },
    []
  )

  const handleRowToggle = useCallback(
    (toggled: unknown) => {
      const newExpanded = toggled as ExpandedRows
      const newKeys = getExpandedKeys(newExpanded)
      const collapsedKey = [...getExpandedKeys(expandedRows)].find(
        (k) => !newKeys.has(k)
      )
      if (collapsedKey && dirtyRowKeys.current.has(collapsedKey)) {
        setPendingCollapse({ newExpanded, rowKey: collapsedKey })
        return
      }
      setExpandedRows(newExpanded)
    },
    [expandedRows]
  )

  const confirmCollapse = useCallback(() => {
    if (!pendingCollapse) return
    dirtyRowKeys.current.delete(pendingCollapse.rowKey)
    setExpandedRows(pendingCollapse.newExpanded)
    setPendingCollapse(null)
  }, [pendingCollapse])

  const rowExpansionTemplate = useCallback(
    (row: AvailabilityRow) => (
      <AvailabilityRecordExpansion
        productId={productId}
        record={row}
        rowKey={row.rowKey}
        onDirtyChange={handleRowDirtyChange}
      />
    ),
    [productId, handleRowDirtyChange]
  )

  const columns = useMemo<DataTableColumnProps[]>(
    () => [
      {
        columnKey: 'expander',
        expander: true,
        className: styles.expanderColumn,
      },
      {
        columnKey: 'id',
        field: 'site',
        header: t('products.edit.tab.availability.columns.site'),
        body: (rowData: Availability) => {
          if (sites) {
            const foundSite = sites?.find((site) => site.code === rowData.site)
            return `${foundSite?.name} - ${foundSite?.code}`
          } else {
            return '-'
          }
        },
      },
      {
        columnKey: 'stockLevel',
        field: 'stockLevel',
        header: t('products.edit.tab.availability.columns.stockLevel'),
      },
      {
        columnKey: 'distributionChannel',
        field: 'distributionChannel',
        body: (rowData: Availability) => rowData.distributionChannel || '-',
        header: t('products.edit.tab.availability.columns.distributionChannel'),
      },
    ],
    [sites, t]
  )

  return (
    <>
      <SectionTitle
        className={styles.title}
        name={t('products.edit.tab.availability.title')}
      />
      <ConfirmBox
        visible={!!pendingCollapse}
        loading={false}
        onAccept={confirmCollapse}
        onReject={() => setPendingCollapse(null)}
        title={t(
          'products.edit.tab.availability.confirm.collapseUnsaved.title'
        )}
        message={t(
          'products.edit.tab.availability.confirm.collapseUnsaved.message'
        )}
        acceptLabel={t('global.discard')}
        rejectLabel={t('global.cancel')}
      />
      <DataTable
        value={availability}
        columns={columns}
        loading={loading}
        showFilter={false}
        dataKey="rowKey"
        expandedRows={expandedRows}
        onRowToggle={handleRowToggle}
        rowExpansionTemplate={rowExpansionTemplate}
      />
    </>
  )
}
