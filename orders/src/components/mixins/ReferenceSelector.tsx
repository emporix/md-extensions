import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Checkbox,
  Chip,
  ConfirmBox,
  DataTable,
  DataTableColumnProps,
  InputText,
  Menu,
  MenuRef,
  Skeleton,
  Tooltip,
  useToast,
} from '@emporix/component-library'
import usePagination, { PaginationProps } from '../../hooks/usePagination'
import { BsCopy, BsCursor, BsFilter } from 'react-icons/bs'
import useCustomNavigate from '../../hooks/useCustomNavigate'
import { useLocation, useParams } from 'react-router'
import useReferenceSelectorConfig, {
  AvailableFilter,
  LoadFnParams,
  ReferenceConfig,
} from './useReferenceSelectorConfig'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import { useFormContext } from 'react-hook-form'
import { assignHostLocation } from '../../helpers/hostUrls'
import Localized from '../../models/Localized.model'
import styles from './ReferenceSelector.module.scss'

interface Props {
  readonly value: string[]
  readonly onChange: (value: string[]) => void
  readonly referenceType: string
  readonly disabled?: boolean
  readonly disableDropdown?: boolean
  readonly customInstanceId?: string
  readonly externalItems?: ReferenceItem[]
  readonly onResolved?: (items: ReferenceItem[]) => void
  readonly className?: string
}

export interface ReferenceItem {
  id: string | null
  name: Localized | string
  code?: string
}

export const ReferenceSelector = (props: Props) => {
  const {
    value,
    onChange,
    referenceType,
    disabled = false,
    disableDropdown = false,
    className = '',
    customInstanceId,
    externalItems,
    onResolved,
  } = props
  const { t } = useTranslation()
  const toast = useToast()
  const { navigate } = useCustomNavigate()
  const location = useLocation()
  const { customInstanceId: urlCustomInstanceId } = useParams()
  const { config } = useReferenceSelectorConfig({ type: referenceType })
  const { getUiLangValue } = useLocalizedValue()
  const { onPageCallback, setTotalCount, totalCount, paginationParams } =
    usePagination(undefined, false)
  const {
    formState: { isDirty },
  } = useFormContext()

  const [items, setItems] = useState<ReferenceItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isResolving, setIsResolving] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmNavOpen, setConfirmNavOpen] = useState(false)
  const [filter, setFilter] = useState<AvailableFilter>(
    config.availableFilters[0]
  )
  const [failedItemIds, setFailedItemIds] = useState<Set<string>>(new Set())
  const [selectedItemMap, setSelectedItemMap] = useState<{
    [id: string]: ReferenceItem
  }>({})
  const selectorRef = useRef<HTMLDivElement>(null)
  const menu = useRef<MenuRef>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuOpen) return
      const target = e.target as HTMLElement
      if (selectorRef.current && selectorRef.current.contains(target)) {
        return
      }
      setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  // When a parent supplies already-resolved items, seed the map from them and
  // never resolve internally — this avoids one resolve call per array item.
  useEffect(() => {
    if (!externalItems) return
    const map: Record<string, ReferenceItem> = {}
    for (const item of externalItems) {
      if (item?.id) {
        map[item.id] = item
      }
    }
    if (Object.keys(map).length > 0) {
      setSelectedItemMap((prev) => ({ ...prev, ...map }))
    }
    // Show the skeleton only until the parent's single batched resolve delivers
    // its results. Once anything arrives, render labels for what resolved and
    // fall back to the raw id for any genuinely missing reference.
    setIsResolving(value.length > 0 && externalItems.length === 0)
  }, [externalItems, value])

  useEffect(() => {
    if (externalItems) return
    if (!config.permissions.canView || value.length === 0) return
    const missingIds = value.filter(
      (id) => !selectedItemMap[id] && !failedItemIds.has(id)
    )
    if (missingIds.length === 0) return
    resolveMissingReferences(missingIds, items)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [
    value,
    config.permissions,
    selectedItemMap,
    failedItemIds,
    items,
    externalItems,
  ])

  useEffect(() => {
    // Load the browsable option list lazily — only once the dropdown is open.
    // Selected chips are resolved separately (resolveMissingReferences) so they
    // still render while the dropdown stays closed.
    if (!dropdownOpen) return
    const handle = setTimeout(() => {
      searchItems(searchTerm, paginationParams, config, filter.code)
    }, 300)
    return () => {
      clearTimeout(handle)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [dropdownOpen, searchTerm, paginationParams, config, filter])

  const resolveMissingReferences = async (
    missingIds: string[],
    currentItems: ReferenceItem[]
  ) => {
    // Try to find in the currently loaded items
    setIsResolving(true)
    const foundInItems: Record<string, ReferenceItem> = {}
    const toFetch: string[] = []
    for (const id of missingIds) {
      const found = currentItems.find((it) => it.id === id)
      if (found) {
        foundInItems[id] = found
      } else {
        toFetch.push(id)
      }
    }
    // Fetch the rest. Use the batched query only when resolving more than one id
    // (e.g. an array field). For a single id — the regular non-array selector —
    // a direct per-id load avoids the list endpoint's pagination/count overhead.
    let fetchedItems: ReferenceItem[] = []
    let resolveSucceeded = true
    if (toFetch.length > 0) {
      try {
        fetchedItems =
          config.resolveItems && toFetch.length > 1
            ? await config.resolveItems(toFetch)
            : (
                await Promise.all(toFetch.map((id) => config.loadItem(id)))
              ).filter(Boolean)
      } catch (error) {
        resolveSucceeded = false
        console.error('Error resolving reference items:', error)
      }
    }
    const fetchedMap: Record<string, ReferenceItem> = {}
    for (const item of fetchedItems) {
      if (item?.id) {
        fetchedMap[item.id] = item
      }
    }
    // Update selectedItemMap only when something was actually resolved. Skipping
    // the no-op update keeps the map reference stable, which prevents the
    // resolve effect from re-firing in a tight loop after a failed request.
    const resolvedEntries = { ...foundInItems, ...fetchedMap }
    if (Object.keys(resolvedEntries).length > 0) {
      setSelectedItemMap((prev) => ({ ...prev, ...resolvedEntries }))
      onResolved?.(Object.values(resolvedEntries))
    }
    // Only mark ids as failed when the request actually succeeded but the item
    // was not returned (genuinely missing). On a thrown request (transient
    // network/server error) leave them unmarked so they can be retried.
    if (resolveSucceeded && toFetch.length > 0) {
      setFailedItemIds((prev) => {
        const next = new Set(prev)
        for (const id of toFetch) {
          if (!fetchedMap[id]) {
            next.add(id)
          }
        }
        return next
      })
    }
    setIsResolving(false)
  }

  const searchItems = async (
    query: string,
    paginationParams: Partial<PaginationProps>,
    config: ReferenceConfig,
    filterCode: string
  ) => {
    const params: LoadFnParams = {
      query,
      paginationParams,
      filterCode,
      contextId: customInstanceId || urlCustomInstanceId,
    }
    try {
      setIsLoading(true)
      const { items, totalCount } = await config.loadItems(params)
      setItems(items)
      setTotalCount(totalCount)
    } catch (error) {
      console.error('Error loading reference items:', error)
      setItems([])
    } finally {
      setIsLoading(false)
    }
  }

  const selectedItems = useMemo(() => {
    return value.map((id) => {
      const item = selectedItemMap[id]
      if (item) {
        return item
      }
      return {
        id,
        name: { en: id },
        code: id,
      } as unknown as ReferenceItem
    })
  }, [value, selectedItemMap])

  const handleItemSelection = useCallback(
    (itemId: string, checked: boolean) => {
      const newValue = checked
        ? [...value, itemId]
        : value.filter((id) => id !== itemId)
      onChange(newValue)
    },
    [value, onChange]
  )

  const handleNavigateClick = useCallback(
    (id: string) => {
      const path = config.navigationPath(id)
      if (config.isHostRoute) {
        // Host-owned entity (orders, customers, categories, …): leave the remote.
        assignHostLocation(path)
        return
      }
      const currentPath = `${location.pathname}${location.search}`
      navigate(path, {
        query: { backTo: currentPath },
      })
    },
    [config, location, navigate]
  )

  const labelText = (item: ReferenceItem): string => {
    const label = config.label(item)
    return typeof label === 'string' ? label : String(item.id ?? '')
  }

  const selectionTemplate = (item: ReferenceItem) => {
    const itemId = item.id || ''
    const isSelected = value.includes(itemId)
    return (
      // Keep the checkbox click from also firing the row-click toggle.
      <span onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={isSelected}
          onChange={(e) => handleItemSelection(itemId, e.checked)}
          disabled={disabled || !config.permissions.canManage || !itemId}
        />
      </span>
    )
  }

  const columns: DataTableColumnProps[] = [
    {
      bodyClassName: styles.selectColumn,
      body: selectionTemplate,
    },
    {
      field: 'name',
      body: (rowData: ReferenceItem) =>
        isLoading ? <Skeleton width="80%" /> : config.label(rowData),
    },
  ]

  if (!config.permissions.canView) {
    return (
      <InputText
        readOnly
        value={t('global.noPermissions')}
        className={className}
      />
    )
  }

  const isSelectorDisabled =
    disabled || disableDropdown || !config.permissions.canManage
  const placeholder = t('mixins.labels.selectReference', {
    referenceType: referenceType.toLowerCase().replace(/_/g, ' '),
  })

  return (
    <div ref={selectorRef} className={`${styles.wrapper} ${className}`}>
      <div className={styles.content}>
        {/* MD: Prime MultiSelect (display="chip", hidden panel) whose focus
            toggled the custom dropdown below; CL has no such mode, so the
            chips box is rendered directly with CL Chip. */}
        <div
          role="button"
          tabIndex={isSelectorDisabled ? -1 : 0}
          aria-disabled={isSelectorDisabled}
          className={[
            styles.chipsBox,
            isSelectorDisabled ? styles.chipsBoxDisabled : '',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={() => {
            if (!isSelectorDisabled) setDropdownOpen((prev) => !prev)
          }}
          onKeyDown={(e) => {
            if (!isSelectorDisabled && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault()
              setDropdownOpen((prev) => !prev)
            }
          }}
        >
          <div className={styles.chips}>
            {selectedItems.length === 0 ? (
              <span className={styles.placeholder}>{placeholder}</span>
            ) : (
              selectedItems.map((item) =>
                isResolving ? (
                  <Skeleton key={item.id} width="5rem" />
                ) : (
                  <Chip
                    key={item.id}
                    className={styles.chip}
                    label={labelText(item)}
                    title={labelText(item)}
                    removable={!isSelectorDisabled}
                    removeAriaLabel={t('global.remove')}
                    onRemove={(e) => {
                      e.originalEvent.stopPropagation()
                      onChange(value.filter((id) => id !== item.id))
                    }}
                  />
                )
              )
            )}
          </div>
          {disableDropdown ? null : (
            <i className={`pi pi-chevron-down ${styles.dropdownIcon}`} />
          )}
        </div>
        {value?.length === 1 &&
          (() => {
            const selectedItem = selectedItems.find((p) => p.id === value[0])
            return (
              <>
                <Tooltip
                  content={config.goToLabel(selectedItem)}
                  position="top"
                >
                  <button
                    type="button"
                    className={`${styles.iconButton} ${styles.goToButton}`}
                    disabled={disabled}
                    aria-label={config.goToLabel(selectedItem)}
                    onClick={() => {
                      if (!selectedItem?.id) return
                      if (isDirty) {
                        setConfirmNavOpen(true)
                      } else {
                        handleNavigateClick(selectedItem.id)
                      }
                    }}
                  >
                    <BsCursor size={16} />
                  </button>
                </Tooltip>
                <ConfirmBox
                  visible={confirmNavOpen}
                  title={t('navigation.blockedTitle')}
                  message={t('navigation.blockedAlert')}
                  onAccept={() => {
                    setConfirmNavOpen(false)
                    if (selectedItem?.id) {
                      handleNavigateClick(selectedItem.id)
                    }
                  }}
                  onReject={() => setConfirmNavOpen(false)}
                />
                <Tooltip
                  content={t('mixins.labels.copyId', {
                    id: selectedItem?.id,
                  })}
                  position="top"
                >
                  <button
                    type="button"
                    className={styles.iconButton}
                    disabled={disabled && !disableDropdown}
                    aria-label={t('mixins.labels.copyId', {
                      id: selectedItem?.id,
                    })}
                    onClick={() => {
                      if (!selectedItem?.id) return
                      navigator.clipboard.writeText(selectedItem.id)
                      toast.showToast(
                        t('global.copied'),
                        selectedItem?.id,
                        'info'
                      )
                    }}
                  >
                    <BsCopy size={16} />
                  </button>
                </Tooltip>
              </>
            )
          })()}
      </div>
      {dropdownOpen && (
        <div className={styles.dropdown}>
          <div className={styles.search}>
            <input
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('mixins.labels.search', {
                filter: getUiLangValue(filter.name).toLowerCase(),
              })}
            />
            {config.availableFilters.length > 1 && (
              <>
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={(e) => menu.current?.toggle(e)}
                  aria-controls="menuFilters"
                  aria-haspopup="true"
                >
                  <BsFilter size={16} />
                </button>
                <Menu
                  model={config.availableFilters.map((i) => ({
                    label: getUiLangValue(i.name),
                    // CL MenuItem has no per-item style: mark the active filter.
                    icon: i === filter ? 'pi pi-check' : undefined,
                    command: () => {
                      setFilter(i)
                    },
                  }))}
                  onShow={() => setMenuOpen(true)}
                  onHide={() => setMenuOpen(false)}
                  popup
                  ref={menu}
                  id="menuFilters"
                />
              </>
            )}
          </div>
          <DataTable
            value={items}
            columns={columns}
            lazy={true}
            paginator
            showHeaders={false}
            emptyMessage={t('global.noData')}
            className={styles.table}
            sortField={paginationParams.sortField}
            sortOrder={paginationParams.sortOrder}
            onPage={onPageCallback}
            pagination={{
              ...paginationParams,
              paginatorTemplate: 'PrevPageLink PageLinks NextPageLink',
              totalRecords: totalCount,
            }}
            totalRecords={totalCount}
            onRowClick={(rowData: ReferenceItem) => {
              const itemId = rowData.id || ''
              const isSelected = value.includes(itemId)
              handleItemSelection(itemId, !isSelected)
            }}
          />
        </div>
      )}
    </div>
  )
}
