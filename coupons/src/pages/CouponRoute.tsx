import { useRef } from 'react'
import { Navigate, useParams } from 'react-router'
import { CouponDataProvider } from '../context/Coupon.provider'
import { CurrencyProvider } from '../context/Currency.provider'
import { useDashboardContext } from '../context/Dashboard.context'
import { couponsListPath } from '../constants/paths'
import CouponPage from './Coupon.page'

/**
 * The key remounts the page when moving from `add` to the created coupon, so no
 * form state from the create form leaks into the edit form (MD parity).
 *
 * A host tenant switch leaves the page for the list (MD parity): the coupon
 * and the form belong to the previous tenant and must not be shown or saved
 * under the new one. Redirecting before the providers render also stops the
 * coupon from being reloaded under the new tenant.
 */
const CouponRoute = () => {
  const { code } = useParams()
  const { tenant } = useDashboardContext()
  const openedForTenant = useRef(tenant)

  if (tenant !== openedForTenant.current) {
    return <Navigate to={couponsListPath()} replace />
  }

  return (
    <CurrencyProvider>
      <CouponDataProvider key={code ?? 'add'}>
        <CouponPage />
      </CouponDataProvider>
    </CurrencyProvider>
  )
}

export default CouponRoute
