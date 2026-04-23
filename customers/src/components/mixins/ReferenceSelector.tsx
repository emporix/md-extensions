import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MultiSelect } from 'primereact/multiselect'
import { useToast } from '../../context/ToastProvider'
import { InputText } from 'primereact/inputtext'
import usePagination, { PaginationProps } from '../../hooks/usePagination'
import { Column } from 'primereact/column'
import { Checkbox } from 'primereact/checkbox'
import { BsCopy, BsCursor, BsFilter } from 'react-icons/bs'
import useCustomNavigate from '../../hooks/useCustomNavigate'
import { useLocation, useParams } from 'react-router-dom'
import './ReferenceSelector.scss'
import MdDataTable from '../MdDataTable'
import { Button } from 'primereact/button'
import { Skeleton } from 'primereact/skeleton'
import useReferenceSelectorConfig, {
  AvailableFilter,
  LoadFnParams,
  ReferenceConfig,
} from './useReferenceSelectorConfig'
import { Menu } from 'primereact/menu'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import { useFormContext } from 'react-hook-form'
import { StylableProps } from '../../helpers/props'

interface Props extends StylableProps {
  value: string[]
  onChange: (value: string[]) => void
  referenceType: string
  disabled?: boolean
  disableDropdown?: boolean
  customInstanceId?: string
}

interface ReferenceItem {
  id: string | null
  name: any
  code?: string
}

const asReferenceItem = (raw: unknown): ReferenceItem | null => {
  if (!raw || typeof raw !== 'object') return null
  return raw as ReferenceItem
}

export const ReferenceSelector = (props: Props) => {
  const {
    value,
    onChange,
    referenceType,
    disabled = false,
    disableDropdown = false,
    className = '',
    style = {},
    customInstanceId,
  } = props
  const { t } = useTranslation()
  const toast = useToast()
  const { navigate } = useCustomNavigate()
  const location = useLocation()
  const { customInstanceId: urlCustomInstanceId } = useParams()
  const { config } = useReferenceSelectorConfig({ type: referenceType })
  const { getUiLangValue } = useLocalizedValue()
  const { onPageCallback, setTotalCount, totalCount, paginationParams } =
    usePagination()
  const {
    formState: { isDirty },
  } = useFormContext()

  const [items, setItems] = useState<ReferenceItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isResolving, setIsResolving] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [filter, setFilter] = useState<AvailableFilter>(
    config.availableFilters[0]
  )
  const [failedItemIds, setFailedItemIds] = useState<Set<string>>(new Set())
  const [selectedItemMap, setSelectedItemMap] = useState<{
    [id: string]: ReferenceItem
  }>({})
  const selectorRef = useRef<HTMLDivElement>(null)
  const menu = useRef<Menu>(null)

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

  useEffect(() => {
    if (!config.permissions.canView || value.length === 0) return
    const missingIds = value.filter(
      (id) => !selectedItemMap[id] && !failedItemIds.has(id)
    )
    if (missingIds.length === 0) return
    resolveMissingReferences(missingIds, items)
  }, [value, config.permissions, selectedItemMap, failedItemIds, items])

  useEffect(() => {
    const handle = setTimeout(() => {
      searchItems(searchTerm, paginationParams, config, filter.code)
    }, 300)
    return () => {
      clearTimeout(handle)
    }
  }, [searchTerm, paginationParams, config, filter])

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
    // Fetch the rest
    const fetched = await Promise.all(
      toFetch.map(async (id) => ({
        id,
        item: asReferenceItem(await config.loadItem(id)),
      }))
    )
    // Update selectedItemMap
    setSelectedItemMap((prev) => {
      const next = { ...prev, ...foundInItems }
      for (const { item } of fetched) {
        if (item?.id) {
          next[item.id] = item
        }
      }
      return next
    })
    // Set failed IDs
    setFailedItemIds((prev) => {
      const next = new Set(prev)
      for (const { id, item } of fetched) {
        if (!item?.id) {
          next.add(id)
        }
      }
      return next
    })
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
      setItems(items as ReferenceItem[])
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
    [value]
  )

  const handleNavigateClick = useCallback(
    (id: string) => {
      const path = config.navigationPath(id)
      const currentPath = `${location.pathname}${location.search}`
      navigate(path, {
        query: { backTo: currentPath },
      })
    },
    [config, location, navigate]
  )

  const selectionTemplate = (item: ReferenceItem) => {
    const itemId = item.id || ''
    const isSelected = value.includes(itemId)
    return (
      <Checkbox
        checked={isSelected}
        onChange={(e) => {
          e.stopPropagation()
          handleItemSelection(itemId, e.checked)
        }}
        disabled={disabled || !config.permissions.canManage || !itemId}
      />
    )
  }

  if (!config.permissions.canView) {
    return (
      <InputText
        disabled
        value={t('global.noPermissions')}
        className={className}
      />
    )
  }

  return (
    <div
      ref={selectorRef}
      className={`reference-selector-wrapper ${className}`}
      style={style}
    >
      <div className="reference-selector-content">
        <MultiSelect
          disabled={
            disabled || disableDropdown || !config.permissions.canManage
          }
          options={selectedItems.map((item) => ({
            label: config.label(item),
            value: item.id,
            key: item.id,
          }))}
          value={value || []}
          className="w-full"
          onChange={(e) => {
            onChange(e.target.value)
            e.stopPropagation()
          }}
          placeholder={t('mixins.labels.selectReference', {
            referenceType: referenceType.toLowerCase().replace(/_/g, ' '),
          })}
          onFocus={() => setDropdownOpen((prev) => !prev)}
          panelClassName="hidden"
          display="chip"
          itemTemplate={isResolving ? <Skeleton width="5rem" /> : undefined}
          appendTo="self"
          dropdownIcon={disableDropdown ? null : undefined}
        />
        {value?.length === 1 &&
          (() => {
            const selectedItem = selectedItems.find((p) => p.id === value[0])
            return (
              <>
                <Button
                  className="p-button-text ml-1 flex-shrink-0"
                  disabled={disabled || isDirty}
                  icon={<BsCursor size={16} />}
                  tooltip={
                    isDirty
                      ? t('mixins.labels.saveBeforeNavigating')
                      : config.goToLabel(selectedItem)
                  }
                  tooltipOptions={{ position: 'top' }}
                  onClick={() => {
                    if (!selectedItem?.id) return
                    handleNavigateClick(selectedItem.id)
                  }}
                />
                <Button
                  className="p-button-text flex-shrink-0"
                  disabled={disabled && !disableDropdown}
                  icon={<BsCopy size={16} />}
                  tooltip={t('mixins.labels.copyId', {
                    id: selectedItem?.id,
                  })}
                  tooltipOptions={{ position: 'top' }}
                  onClick={() => {
                    if (!selectedItem?.id) return
                    navigator.clipboard.writeText(selectedItem.id)
                    toast.showToast(
                      t('global.copied'),
                      selectedItem?.id,
                      'info'
                    )
                  }}
                />
              </>
            )
          })()}
      </div>
      {dropdownOpen && (
        <div className="reference-dropdown">
          <div className="reference-dropdown-search">
            <InputText
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('mixins.labels.search', {
                filter: getUiLangValue(filter.name).toLowerCase(),
              })}
              className="w-full"
            />
            {config.availableFilters.length > 1 && (
              <>
                <Button
                  className="p-button-text"
                  onClick={(e) => menu.current?.toggle(e)}
                  icon={<BsFilter size={16} />}
                  aria-controls="menuFilters"
                  aria-haspopup="true"
                />
                <Menu
                  model={config.availableFilters.map((i) => ({
                    label: getUiLangValue(i.name),
                    style: {
                      fontSize: '0.875rem',
                      fontWeight: i === filter ? 'bold' : 'normal',
                      background: i === filter ? 'var(--grey-1)' : 'white',
                    },
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
          <MdDataTable
            value={items}
            lazy={true}
            showHeader={false}
            emptyMessage={t('global.noData')}
            className="border-0"
            sortField={paginationParams.sortField}
            sortOrder={paginationParams.sortOrder}
            onPage={onPageCallback}
            paginationOptions={{
              ...paginationParams,
              paginatorTemplate: 'PrevPageLink PageLinks NextPageLink',
              totalRecords: totalCount,
            }}
            onRowClick={(rowData) => {
              const itemId = rowData.id || ''
              const isSelected = value.includes(itemId)
              handleItemSelection(itemId, !isSelected)
            }}
          >
            <Column style={{ width: '2rem' }} body={selectionTemplate} />
            <Column
              field="name"
              body={(rowData) =>
                isLoading ? (
                  <Skeleton width="80%"></Skeleton>
                ) : (
                  config.label(rowData)
                )
              }
            />
          </MdDataTable>
        </div>
      )}
    </div>
  )
}
