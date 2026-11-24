import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ConfirmBox,
  DataTable,
  Dropdown,
  FilterMatchMode,
  IconButton,
  InputSwitch,
  InputText,
  Tooltip,
  useToast,
  type DataTableColumnProps,
} from '@emporix/component-library'
import {
  BsCheckCircleFill,
  BsInfoCircle,
  BsPencilFill,
  BsTrash,
  BsXCircle,
} from 'react-icons/bs'

import HeaderSection from '../components/shared/HeaderSection'
import { useConfigurationApi } from '../hooks/api/configuration'
import { usePermissions } from '../context/PermissionsProvider'
import { useDashboardContext } from '../context/Dashboard.context'
import { EmployeeDomains } from '../configs/accessControls'
import { SYSTEM_PREFERENCES } from '../configs/systemPreferences'
import { createRequestTracker } from '../helpers/api'
import {
  buildPreferencePayload,
  canClear,
  cellText,
  currentValue,
  listText,
  preferenceErrorDetails,
  shouldSkipSave,
  toBoolean,
  toPreferenceValue,
  type SystemPreferenceRow,
} from '../helpers/systemPreferences.helpers'
import styles from './SystemPreferencesPage.module.scss'

/** What Prime's row-editor column hands to its `body` and `editor`. */
type RowEditorControls = {
  readonly editing?: boolean
  readonly onInitClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
  readonly onSaveClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
  readonly onCancelClick?: (event: { preventDefault: () => void }) => void
}

type EditorOptions = {
  readonly rowData: SystemPreferenceRow
  readonly value: unknown
  readonly editorCallback?: (value: unknown) => void
}

type StoredValues = Record<string, { existing: boolean; value?: unknown }>

/**
 * MD's System Preferences: the fixed preference keys in one client-side table,
 * each edited inline in its row (Prime row editing through the CL DataTable).
 */
const SystemPreferencesPage = () => {
  const { t, i18n } = useTranslation()
  const { showError, showSuccess } = useToast()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.SYSTEM_PREFERENCES_MANAGER)
  const { tenant } = useDashboardContext()
  const {
    getConfiguration,
    createConfiguration,
    updateConfiguration,
    deleteConfiguration,
  } = useConfigurationApi()

  const [stored, setStored] = useState<StoredValues>({})
  const [isLoading, setIsLoading] = useState(false)
  const [clearKey, setClearKey] = useState<string | null>(null)
  const [clearing, setClearing] = useState(false)
  const closeEditedRow = useRef<RowEditorControls['onCancelClick'] | null>(null)
  const trackRequest = useRef(createRequestTracker()).current

  useEffect(() => {
    // The host switches tenant without remounting this remote; only the
    // latest load may fill the table.
    const isLatest = trackRequest()
    setStored({})
    setIsLoading(true)
    Promise.all(
      SYSTEM_PREFERENCES.map((preference) =>
        getConfiguration(preference.key)
          .then((config) => [
            preference.key,
            {
              existing: true,
              // A secret is never shown, so it is never kept.
              value: preference.type === 'PASSWORD' ? undefined : config.value,
            },
          ])
          // A key the tenant has not set answers 404: list it with its default.
          .catch(() => [preference.key, { existing: false }])
      )
    ).then((entries) => {
      if (!isLatest()) return
      setStored(Object.fromEntries(entries))
      setIsLoading(false)
    })
  }, [tenant, getConfiguration, trackRequest])

  const rows: SystemPreferenceRow[] = useMemo(
    () =>
      SYSTEM_PREFERENCES.map((preference) => ({
        ...preference,
        name: t(preference.nameKey),
        ...stored[preference.key],
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stored, t, i18n.language]
  )

  const storeValue = (
    key: string,
    value: { existing: boolean; value?: unknown }
  ) => setStored((previous) => ({ ...previous, [key]: value }))

  const onRowEditComplete = async (event: unknown) => {
    const { newData } = event as { newData: SystemPreferenceRow }
    const value = toPreferenceValue(newData.type, newData.value)
    if (shouldSkipSave(newData, value)) {
      return
    }
    const payload = buildPreferencePayload(newData, value)
    try {
      if (!newData.existing) {
        await createConfiguration(
          newData.key,
          payload.value,
          payload.secured === undefined
            ? undefined
            : { secured: payload.secured }
        )
        showSuccess(t('systemPreferences.toasts.successCreate'))
      } else {
        await updateConfiguration(newData.key, payload)
        showSuccess(t('systemPreferences.toasts.successUpdate'))
      }
      storeValue(newData.key, {
        existing: true,
        value: newData.type === 'PASSWORD' ? undefined : newData.value,
      })
    } catch (e: unknown) {
      console.error('Error updating system preference:', e)
      showError(
        newData.existing
          ? t('systemPreferences.toasts.errorUpdate')
          : t('systemPreferences.toasts.errorCreate'),
        preferenceErrorDetails(e)
      )
    }
  }

  const onClearReject = () => {
    if (clearing) return
    closeEditedRow.current = null
    setClearKey(null)
  }

  const onClearAccept = async () => {
    if (!clearKey || clearing) return
    setClearing(true)
    try {
      await deleteConfiguration(clearKey)
      storeValue(clearKey, { existing: false })
      showSuccess(t('systemPreferences.toasts.successDelete'))
      closeEditedRow.current?.({ preventDefault: () => undefined })
    } catch (e: unknown) {
      console.error('Error deleting system preference:', e)
      showError(
        t('systemPreferences.toasts.errorDelete'),
        preferenceErrorDetails(e)
      )
    } finally {
      closeEditedRow.current = null
      setClearKey(null)
      setClearing(false)
    }
  }

  const nameBody = (row: SystemPreferenceRow) => (
    <div className={styles.name}>
      <span>{row.name}</span>
      {row.descriptionKey && (
        <Tooltip content={t(row.descriptionKey)} position="top" showDelay={200}>
          <BsInfoCircle
            size={16}
            className={styles.info}
            aria-label={t(row.descriptionKey)}
            data-testid={`system-preferences-info-${row.key}`}
          />
        </Tooltip>
      )}
    </div>
  )

  const valueBody = (row: SystemPreferenceRow) => {
    if (row.type === 'BOOLEAN') {
      return (
        <InputSwitch
          className={styles.readOnlySwitch}
          checked={toBoolean(currentValue(row))}
          disabled
          aria-label={row.name}
          data-testid={`system-preferences-value-${row.key}`}
        />
      )
    }
    return (
      <span data-testid={`system-preferences-value-${row.key}`}>
        {cellText(row)}
      </span>
    )
  }

  const valueEditor = (options: EditorOptions) => {
    const row = options.rowData
    const change = (value: unknown) => options.editorCallback?.(value)
    const testId = `system-preferences-editor-${row.key}`

    if (row.type === 'ENUM' && row.options) {
      return (
        <Dropdown
          value={options.value ?? row.defaultValue}
          options={row.options.map((option) => ({
            label: option,
            value: option,
          }))}
          onChange={(e) => change(e.value)}
          placeholder={t('systemPreferences.selectValue')}
          data-testid={testId}
        />
      )
    }
    if (row.type === 'BOOLEAN') {
      return (
        <InputSwitch
          checked={toBoolean(options.value ?? row.defaultValue)}
          onChange={(e) => change(e.value.toString())}
          aria-label={row.name}
          data-testid={testId}
        />
      )
    }
    if (row.type === 'LIST') {
      return (
        <InputText
          value={listText(options.value ?? row.defaultValue)}
          onChange={(e) => change(e.target.value)}
          placeholder={t('systemPreferences.commaSeparatedValues')}
          data-testid={testId}
        />
      )
    }
    const value =
      row.type === 'PASSWORD'
        ? (options.value ?? '')
        : (options.value ?? row.defaultValue ?? '')
    return (
      <InputText
        type={row.type === 'PASSWORD' ? 'password' : 'text'}
        value={String(value)}
        onChange={(e) => change(e.target.value)}
        data-testid={testId}
      />
    )
  }

  const actionsBody = (
    row: SystemPreferenceRow,
    options: { rowEditor?: RowEditorControls }
  ) => {
    const editor = options.rowEditor
    if (editor?.editing && canManage) {
      return (
        <div className={styles.actions}>
          {canClear(row) && (
            <IconButton
              icon={<BsTrash size={16} />}
              ariaLabel={t('systemPreferences.clear')}
              onClick={() => {
                closeEditedRow.current = editor.onCancelClick ?? null
                setClearKey(row.key)
              }}
              data-testid={`system-preferences-clear-${row.key}`}
            />
          )}
          <IconButton
            icon={<BsXCircle size={16} />}
            ariaLabel={t('global.cancel')}
            onClick={(e) => editor.onCancelClick?.(e)}
            data-testid={`system-preferences-cancel-${row.key}`}
          />
          <IconButton
            icon={<BsCheckCircleFill size={16} />}
            ariaLabel={t('global.save')}
            onClick={(e) => editor.onSaveClick?.(e)}
            data-testid={`system-preferences-save-${row.key}`}
          />
        </div>
      )
    }
    return (
      <div className={styles.actions}>
        <IconButton
          icon={<BsPencilFill size={16} />}
          ariaLabel={t('global.edit')}
          disabled={!canManage}
          onClick={(e) => editor?.onInitClick?.(e)}
          data-testid={`system-preferences-edit-${row.key}`}
        />
      </div>
    )
  }

  const columns: DataTableColumnProps[] = useMemo(
    () => [
      {
        columnKey: 'name',
        header: t('systemPreferences.columns.name'),
        field: 'name',
        body: nameBody,
        bodyStyle: { width: '45%' },
        filter: true,
        filterMatchMode: FilterMatchMode.CONTAINS,
        showFilterMenu: false,
        showClearButton: false,
      },
      {
        columnKey: 'key',
        header: t('systemPreferences.columns.key'),
        field: 'key',
        bodyStyle: { width: '20%' },
        filter: true,
        filterMatchMode: FilterMatchMode.CONTAINS,
        showFilterMenu: false,
        showClearButton: false,
      },
      {
        columnKey: 'value',
        header: t('systemPreferences.columns.value'),
        field: 'value',
        body: valueBody,
        editor: (options) => valueEditor(options as unknown as EditorOptions),
        bodyStyle: { width: '30%' },
        filter: true,
        filterMatchMode: FilterMatchMode.CONTAINS,
        showFilterMenu: false,
        showClearButton: false,
      },
      {
        columnKey: 'rowEditor',
        rowEditor: true,
        body: actionsBody,
      },
    ],
    // The bodies close over permissions and translations only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, i18n.language, canManage]
  )

  return (
    <div className={styles.page}>
      <HeaderSection title={t('systemPreferences.title')} />
      <ConfirmBox
        visible={clearKey !== null}
        loading={clearing}
        onAccept={onClearAccept}
        onReject={onClearReject}
        title={t('systemPreferences.clearConfirm.title')}
        message={t('systemPreferences.clearConfirm.message')}
        acceptLabel={t('systemPreferences.clear')}
        data-testid="system-preferences-clear-confirm"
      />
      <DataTable
        dataKey="key"
        value={rows}
        columns={columns}
        editMode="row"
        onRowEditComplete={onRowEditComplete}
        lazy={false}
        loading={isLoading}
        emptyMessage={t('global.noDataFound')}
        data-testid="system-preferences-table"
      />
    </div>
  )
}

export default SystemPreferencesPage
