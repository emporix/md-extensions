import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '@emporix/component-library'
import { useConfiguration } from '../context/ConfigurationProvider'
import { useRefresh } from '../context/RefreshValuesProvider'
import { getApiErrorDetails, makeCall } from '../helpers/api'
import { CATEGORIES_TABLE_KEY } from '../helpers/categoriesTable.helpers'
import type { ColumnVisibility } from '../models/Configuration.model'
import type { DisplayMixin } from '../models/DisplayMixin'

/**
 * Column visibility and mixin columns of the categories table, persisted
 * under `ext_categories` with MD's shape (`{ table: { columns, mixins } }`
 * through `updateSingleConfiguration`), so preferences saved in the built-in
 * screen keep applying. Load and save mirror the labels remote.
 */
export const useCategoriesTableConfig = () => {
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
    () => fetchTableConfiguration(CATEGORIES_TABLE_KEY),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tableConfigurations]
  )
  const visibleMixins = useMemo(
    () => getTableMixinColumns(CATEGORIES_TABLE_KEY),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tableConfigurations]
  )

  /**
   * Stores the preference and reloads the configuration. Rejects after the
   * MD error toast, so the settings panel stays open.
   */
  const saveTableConfig = useCallback(
    async (columns: ColumnVisibility[], mixins: DisplayMixin[]) => {
      try {
        await makeCall(
          () =>
            updateTableConfiguration(CATEGORIES_TABLE_KEY, {
              table: { columns: [...columns], mixins },
            }),
          setIsSaving
        )
      } catch (e: unknown) {
        showError(t('global.tableExtensions.saveError'), getApiErrorDetails(e))
        throw e
      }
      setRefreshValue()
    },
    [updateTableConfiguration, setRefreshValue, showError, t]
  )

  return { visibleColumns, visibleMixins, saveTableConfig, isSaving }
}
