import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Dropdown, type DropdownChangeEvent } from '@emporix/component-library'
import { useSites } from '../../context/SitesProvider'
import styles from './SitesSelect.module.scss'

const ALL_SITES = ''

type SitesSelectProps = {
  /** When false, the selector shows "all sites" even if a site is current. */
  readonly activeSite: boolean
  readonly setActiveSite: (active: boolean) => void
  readonly disabled?: boolean
}

/**
 * Header site selector (MD `SitesSelect`). CL `Dropdown` has no `showClear`,
 * so an explicit "All sites" option switches the list back to every site.
 */
const SitesSelect = ({
  activeSite,
  setActiveSite,
  disabled = false,
}: SitesSelectProps) => {
  const { t } = useTranslation()
  const { sites, currentSite, updateCurrentSite } = useSites()

  const options = useMemo(
    () => [
      { label: t('global.allSites'), value: ALL_SITES },
      ...(sites ?? []).map((site) => ({
        label: `${site.name} - ${site.code}`,
        value: site.code,
      })),
    ],
    [sites, t]
  )

  const handleChange = (e: DropdownChangeEvent) => {
    const code = String(e.value ?? ALL_SITES)
    if (code === ALL_SITES) {
      setActiveSite(false)
      return
    }
    setActiveSite(true)
    updateCurrentSite(sites?.find((site) => site.code === code))
  }

  return (
    <Dropdown
      className={styles.sitesSelect}
      placeholder={t('global.selectSite')}
      filter
      options={options}
      value={activeSite ? (currentSite?.code ?? ALL_SITES) : ALL_SITES}
      onChange={handleChange}
      disabled={disabled}
    />
  )
}

export default SitesSelect
