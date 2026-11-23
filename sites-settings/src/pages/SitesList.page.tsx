import { useTranslation } from 'react-i18next'
import { PrimaryButton } from '@emporix/component-library'

import HeaderSection from '../components/shared/HeaderSection'
import SitesTable from '../components/sites/SitesTable'
import { useCanManageSites } from '../components/sites/useCanManageSites'
import useCustomNavigate from '../hooks/useCustomNavigate'
import { siteAddPath } from '../constants/paths'

const SitesListPage = () => {
  const { t } = useTranslation()
  const { navigate } = useCustomNavigate()
  const canManage = useCanManageSites()

  return (
    <>
      <HeaderSection
        title={t('sites.plural')}
        moduleActions={
          <PrimaryButton
            disabled={!canManage}
            onClick={() => navigate(siteAddPath())}
            data-testid="sites-create"
          >
            {t('sites.createButton')}
          </PrimaryButton>
        }
      />
      <SitesTable />
    </>
  )
}

export default SitesListPage
