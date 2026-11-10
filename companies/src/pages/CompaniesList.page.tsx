import { useTranslation } from 'react-i18next'
import { PrimaryButton } from '@emporix/component-library'
import HeaderSection from '../components/shared/HeaderSection'
import CompaniesTable from '../components/companies/CompaniesTable'
import useCustomNavigate from '../hooks/useCustomNavigate'
import { usePermissions } from '../context/PermissionsProvider'
import { EmployeeDomains } from '../configs/accessControls'
import { companyAddPath } from '../constants/paths'

/** MD `modules/companies/Companies.module.tsx`. */
const CompaniesListPage = () => {
  const { t } = useTranslation()
  const { navigate } = useCustomNavigate()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.COMPANIES_MANAGER)

  return (
    <>
      <HeaderSection
        title={t('companies.plural')}
        moduleActions={
          <PrimaryButton
            onClick={() => navigate(companyAddPath())}
            disabled={!canManage}
          >
            {t('companies.addNewCompany')}
          </PrimaryButton>
        }
      />
      <CompaniesTable canManage={canManage} />
    </>
  )
}

export default CompaniesListPage
