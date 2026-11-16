import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '@emporix/component-library'
import {
  fetchSingleConfiguration,
  updateSingleConfiguration,
} from '@emporix/api-calls'
import { useDashboardContext } from '../context/Dashboard.context'
import { useRefresh } from '../context/RefreshValuesProvider'
import { getApiErrorDetails, getApiErrorStatus, makeCall } from '../helpers/api'
import { CLASSIFICATIONS_TABLE_KEY } from '../helpers/classificationsTable.helpers'
import type {
  ColumnVisibility,
  TableConfig,
} from '../models/Configuration.model'
import type { DisplayMixin } from '../models/DisplayMixin'

type StoredTable = {
  readonly columns: ColumnVisibility[]
  readonly mixins: DisplayMixin[]
}

const NO_PREFERENCE: StoredTable = { columns: [], mixins: [] }

const toStoredTable = (value: unknown): StoredTable => {
  const table = (value as Partial<TableConfig> | undefined)?.table
  return {
    columns: Array.isArray(table?.columns) ? table.columns : [],
    mixins: Array.isArray(table?.mixins) ? table.mixins : [],
  }
}

/**
 * Column visibility of the classifications table, persisted under
 * `ext_classifications` with MD's shape (`{ table: { columns, mixins } }`
 * through `updateSingleConfiguration`).
 *
 * The preference is read with its own request: `fetchBasicConfiguration`
 * returns table configurations for a fixed list of keys only, and
 * `ext_classifications` is not one of them, so the shared
 * `ConfigurationProvider` never sees it.
 *
 * The table shows no mixin columns and the settings offer none, but MD's
 * settings could store some under the same key: they are written back
 * untouched instead of being dropped.
 */
export const useClassificationsTableConfig = () => {
  const { t } = useTranslation()
  const { showError } = useToast()
  const { setRefreshValue } = useRefresh()
  const { tenant } = useDashboardContext()
  const [stored, setStored] = useState<StoredTable>(NO_PREFERENCE)
  const [isSaving, setIsSaving] = useState(false)
  // Bumped by every load, so a response for an earlier tenant is dropped.
  const loadIdRef = useRef(0)

  const loadTableConfig = useCallback(async () => {
    const loadId = ++loadIdRef.current
    if (!tenant) return
    try {
      const configuration = await fetchSingleConfiguration(
        tenant,
        CLASSIFICATIONS_TABLE_KEY
      )
      if (loadId !== loadIdRef.current) return
      setStored(toStoredTable(configuration?.value))
    } catch (e: unknown) {
      if (loadId !== loadIdRef.current) return
      // 404: nothing saved yet. Anything else: show every column as well.
      if (getApiErrorStatus(e) !== 404) {
        console.error(e)
      }
      setStored(NO_PREFERENCE)
    }
  }, [tenant])

  useEffect(() => {
    // The preference of another tenant must not apply while this one loads.
    setStored(NO_PREFERENCE)
    void loadTableConfig()
  }, [loadTableConfig])

  /**
   * Stores the preference and reads it back. Rejects after the MD error
   * toast, so the settings panel stays open.
   */
  const saveTableConfig = useCallback(
    async (columns: ColumnVisibility[]) => {
      if (!tenant) return
      const value: TableConfig = {
        table: { columns: [...columns], mixins: stored.mixins },
      }
      try {
        await makeCall(
          () =>
            updateSingleConfiguration(tenant, CLASSIFICATIONS_TABLE_KEY, {
              key: CLASSIFICATIONS_TABLE_KEY,
              value,
            }),
          setIsSaving
        )
      } catch (e: unknown) {
        showError(t('global.tableExtensions.saveError'), getApiErrorDetails(e))
        throw e
      }
      await loadTableConfig()
      setRefreshValue()
    },
    [tenant, stored.mixins, loadTableConfig, setRefreshValue, showError, t]
  )

  return { visibleColumns: stored.columns, saveTableConfig, isSaving }
}
