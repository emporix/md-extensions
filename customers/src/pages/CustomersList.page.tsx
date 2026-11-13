import { useTranslation } from 'react-i18next'
import { PrimaryButton } from '@emporix/component-library'
import HeaderSection from '../components/shared/HeaderSection'
import CustomersTable from '../components/customers/CustomersTable'
import useCustomNavigate from '../hooks/useCustomNavigate'
import { usePermissions } from '../context/PermissionsProvider'
import { EmployeeDomains } from '../configs/accessControls'
import { customerAddPath } from '../constants/paths'

/** MD `modules/Customers.module.tsx`. */
const CustomersListPage = () => {
  const { t } = useTranslation()
  const { navigate } = useCustomNavigate()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.CUSTOMERS_MANAGER)

  return (
    <>
      <HeaderSection
        title={t('customers.plural')}
        moduleActions={
          <PrimaryButton
            onClick={() => navigate(customerAddPath())}
            disabled={!canManage}
          >
            {t('customers.createCustomer')}
          </PrimaryButton>
        }
      />
      <CustomersTable canManage={canManage} />
    </>
  )
}

export default CustomersListPage
