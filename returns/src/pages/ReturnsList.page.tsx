import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dropdown, PrimaryButton } from '@emporix/component-library'

import HeaderSection from '../components/shared/HeaderSection'
import ReturnsTable from '../components/returns/ReturnsTable'
import useCustomNavigate from '../hooks/useCustomNavigate'
import { usePermissions } from '../context/PermissionsProvider'
import { useSites } from '../context/SitesProvider'
import { EmployeeDomains } from '../configs/accessControls'
import { returnAddPath } from '../constants/paths'
import styles from './ReturnsPage.module.scss'

const ReturnsListPage = () => {
  const { t } = useTranslation()
  const { navigate } = useCustomNavigate()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.RETURNS_MANAGER)
  const { sites } = useSites()
  const [selectedSiteCode, setSelectedSiteCode] = useState<string>()
  const siteOptions = [
    { label: t('returns.list.sitePlaceholder'), value: '' },
    ...(sites ?? []).map((site) => ({
      label: `${site.name} - ${site.code}`,
      value: site.code,
    })),
  ]

  return (
    <>
      <HeaderSection
        title={t('returns.plural')}
        moduleActions={
          <PrimaryButton
            disabled={!canManage}
            onClick={() => navigate(returnAddPath())}
          >
            {t('returns.createReturn')}
          </PrimaryButton>
        }
      >
        <Dropdown
          className={styles.siteFilter}
          value={selectedSiteCode}
          options={siteOptions}
          optionLabel="label"
          optionValue="value"
          placeholder={t('returns.list.sitePlaceholder')}
          filter
          onChange={(event) => {
            const value = event.value
            setSelectedSiteCode(
              typeof value === 'string' && value.trim() !== ''
                ? value
                : undefined
            )
          }}
        />
      </HeaderSection>
      <ReturnsTable
        className={styles.table}
        selectedSiteCode={selectedSiteCode}
      />
    </>
  )
}

export default ReturnsListPage
