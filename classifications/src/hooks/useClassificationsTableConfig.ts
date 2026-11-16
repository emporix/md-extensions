import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '@emporix/component-library'
import { useConfiguration } from '../context/ConfigurationProvider'
import { useRefresh } from '../context/RefreshValuesProvider'
import { getApiErrorDetails, makeCall } from '../helpers/api'
import { CLASSIFICATIONS_TABLE_KEY } from '../helpers/classificationsTable.helpers'
import type { ColumnVisibility } from '../models/Configuration.model'

/**
 * Column visibility of the classifications table, persisted under
 * `ext_classifications` with MD's shape (`{ table: { columns, mixins } }`
 * through `updateSingleConfiguration`), so preferences saved in the built-in
 * screen keep applying.
 *
 * The table shows no mixin columns and the settings offer none, but MD's
 * settings could store some under the same key: they are written back
 * untouched instead of being dropped.
 */
export const useClassificationsTableConfig = () => {
  const { t } = useTranslation()
  const { showError } = useToast()
  const { setRefreshValue } = useRefresh()
  const {
    tableConfigurations,
    fetchTableConfiguration,
    getTableMixinColumns,
    updateTableConfiguration,
  } = useConfiguration()
  const [isSaving, setIsSaving] = useState(false)

  const visibleColumns = useMemo(
    () => fetchTableConfiguration(CLASSIFICATIONS_TABLE_KEY),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tableConfigurations]
  )

  /**
   * Stores the preference and reloads the configuration. Rejects after the
   * MD error toast, so the settings panel stays open.
   */
  const saveTableConfig = useCallback(
    async (columns: ColumnVisibility[]) => {
      try {
        await makeCall(
          () =>
            updateTableConfiguration(CLASSIFICATIONS_TABLE_KEY, {
              table: {
                columns: [...columns],
                mixins: getTableMixinColumns(CLASSIFICATIONS_TABLE_KEY),
              },
            }),
          setIsSaving
        )
      } catch (e: unknown) {
        showError(t('global.tableExtensions.saveError'), getApiErrorDetails(e))
        throw e
      }
      setRefreshValue()
    },
    [
      updateTableConfiguration,
      getTableMixinColumns,
      setRefreshValue,
      showError,
      t,
    ]
  )

  return { visibleColumns, saveTableConfig, isSaving }
}
