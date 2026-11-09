import { useTranslation } from 'react-i18next'
import { PrimaryButton } from '@emporix/component-library'
import HeaderSection from '../components/shared/HeaderSection'
import CouponsTable from '../components/coupons/CouponsTable'
import useCustomNavigate from '../hooks/useCustomNavigate'
import useCouponPermissions from '../hooks/useCouponPermissions'
import { couponAddPath } from '../constants/paths'

const CouponsPage = () => {
  const { t } = useTranslation()
  const { navigate } = useCustomNavigate()
  const { canManage } = useCouponPermissions()

  return (
    <>
      <HeaderSection
        title={t('coupons.plural')}
        moduleActions={
          <PrimaryButton
            data-testid="coupons-create"
            disabled={!canManage}
            onClick={() => navigate(couponAddPath())}
          >
            {t('coupons.addNewCoupon')}
          </PrimaryButton>
        }
      />
      <CouponsTable />
    </>
  )
}

export default CouponsPage
