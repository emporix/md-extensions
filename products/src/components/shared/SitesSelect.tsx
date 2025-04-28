import { useCallback, useEffect, useMemo } from 'react'
import { Dropdown, DropdownChangeParams } from 'primereact/dropdown'

import { useTranslation } from 'react-i18next'
import { useSites } from '../../context/SitesProvider'
import { Site } from '../../models/Site'
import { Item } from '../../models/Item'
import Badge from './Badge'

const parseItem = (site: Site): Item => {
  return {
    label: `${site.name} - ${site.code}`,
    value: site.code,
    badge: Badge({ value: site.name.substr(0, 2).toUpperCase() }),
  }
}

export interface SitesSelectProps {
  empty?: boolean
  defaultEmpty?: boolean
  setActiveSite?: (active: boolean) => unknown
  disabled?: boolean
}

export default function SitesSelect({
  empty = false,
  disabled = false,
  defaultEmpty = false,
  setActiveSite = undefined,
}: SitesSelectProps) {
  const { sites, updateCurrentSite, currentSite } = useSites()
  const { t } = useTranslation()
  const items = useMemo(() => {
    return sites?.map((site) => parseItem(site)) || []
  }, [sites])

  const handleItemSelect = useCallback(
    (item: DropdownChangeParams) => {
      setActiveSite?.(true)
      const newCurrentSite = sites?.find((site) => item.value === site.code)
      if (!newCurrentSite) return
      updateCurrentSite(newCurrentSite)
    },
    [sites]
  )

  useEffect(() => {
    if (empty) {
      updateCurrentSite(undefined)
    }
  }, [empty])

  return (
    <Dropdown
      placeholder={t('sites.select')}
      filter
      showClear
      showFilterClear
      filterBy="label"
      onChange={handleItemSelect}
      options={items}
      value={defaultEmpty ? null : currentSite?.code}
      disabled={disabled}
    />
  )
}
