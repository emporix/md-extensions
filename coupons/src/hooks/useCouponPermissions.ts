import { usePermissions } from '../context/PermissionsProvider'
import { EmployeeDomains } from '../configs/accessControls'

export interface CouponPermissions {
  canManage: boolean
  canViewAuditLog: boolean
  canViewCustomers: boolean
  canViewSegments: boolean
  canViewCategories: boolean
  canViewVendors: boolean
  canEditCustomers: boolean
  canEditSegments: boolean
  canEditCategories: boolean
  canEditVendors: boolean
}

/**
 * A restriction list is editable when the user manages coupons and can see the
 * restricted entities. The coupon permission decides, not the target entity's
 * manager role.
 */
const useCouponPermissions = (): CouponPermissions => {
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.COUPONS_MANAGER)
  const canViewCustomers = hasPermission(EmployeeDomains.CUSTOMERS_VIEWER)
  const canViewSegments = hasPermission(EmployeeDomains.SEGMENTS_VIEWER)
  const canViewCategories = hasPermission(EmployeeDomains.CATEGORIES_VIEWER)
  const canViewVendors = hasPermission(EmployeeDomains.VENDORS_VIEWER)

  return {
    canManage,
    canViewAuditLog: hasPermission(EmployeeDomains.AUDIT_LOG_VIEWER),
    canViewCustomers,
    canViewSegments,
    canViewCategories,
    canViewVendors,
    canEditCustomers: canManage && canViewCustomers,
    canEditSegments: canManage && canViewSegments,
    canEditCategories: canManage && canViewCategories,
    canEditVendors: canManage && canViewVendors,
  }
}

export default useCouponPermissions
