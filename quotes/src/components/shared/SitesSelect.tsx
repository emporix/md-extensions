import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Dropdown, type DropdownChangeEvent } from '@emporix/component-library'
import { useSites } from '../../context/SitesProvider'
import styles from './SitesSelect.module.scss'

type SitesSelectProps = {
  readonly disabled?: boolean
}

/**
 * Header site selector (MD `components/SitesSelect` as the quote pages use
 * it): the sites of the tenant as `name - code`, filterable, and clearable
 * like MD's `showClear` — a cleared select leaves no current site. There is
 * no "All sites" option.
 */
const SitesSelect = ({ disabled = false }: SitesSelectProps) => {
  const { t } = useTranslation()
  const { sites, currentSite, updateCurrentSite } = useSites()

  const options = useMemo(
    () =>
      (sites ?? []).map((site) => ({
        label: `${site.name} - ${site.code}`,
        value: site.code,
      })),
    [sites]
  )

  const handleChange = (e: DropdownChangeEvent) => {
    updateCurrentSite(sites?.find((site) => site.code === e.value))
  }

  return (
    <Dropdown
      className={styles.sitesSelect}
      placeholder={t('sites.select')}
      filter
      showClear
      clearAriaLabel={t('global.clear')}
      options={options}
      value={currentSite?.code ?? null}
      onChange={handleChange}
      disabled={disabled}
      data-testid="sites-select"
    />
  )
}

export default SitesSelect
