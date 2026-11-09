import { Outlet } from 'react-router'
import { useTranslation } from 'react-i18next'
import { RefreshValuesProvider } from './context/RefreshValuesProvider'
import EmptyContent from './components/shared/EmptyContent'
import useCouponPermissions from './hooks/useCouponPermissions'

/**
 * Without Coupons Viewer no coupon screen renders and nothing is requested —
 * the host only hides the menu entry, so the hash route is still reachable.
 */
const CouponsModule = () => {
  const { t } = useTranslation()
  const { canView } = useCouponPermissions()

  return (
    <div className="module">
      {canView ? (
        <RefreshValuesProvider>
          <Outlet />
        </RefreshValuesProvider>
      ) : (
        <EmptyContent text={t('global.noPermissions')} />
      )}
    </div>
  )
}

export default CouponsModule
