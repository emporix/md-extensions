import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '@emporix/component-library'
import { Template } from '../models/Groups.model'
import { AccessControl } from '../models/Permissions.model'
import {
  CUSTOMER_DOMAINS,
  CustomerDomains,
  EMPLOYEE_ADMIN_DOMAINS,
  EMPLOYEE_DOMAINS,
  EmployeeDomains,
  OE_DOMAINS,
  OeDomains,
  VENDOR_DOMAINS,
  VendorDomains,
} from '../configs/accessControls'
import { useDashboardContext } from './Dashboard.context'
import LoadingLayout from '../components/shared/LoadingLayout'
import {
  expandWithImpliedViewerAcs,
  getAccessControlsFromDomain,
  getDomainsMapFromAccessControls,
} from '../helpers/accessControls'
import { useIamApi } from '../hooks/api/iam'

export type DomainName =
  | EmployeeDomains
  | OeDomains
  | VendorDomains
  | CustomerDomains

type PermissionContextType = {
  userAccessControls: AccessControl[]
  tenantAccessControls: AccessControl[]
  mdAccessControls: AccessControl[]
  accessControlsForVendor: AccessControl[]
  accessControlsForOe: AccessControl[]
  accessControlsForCustomer: AccessControl[]
  accessControlsForEmployee: AccessControl[]
  templates: Template[]
  userScopes: string[]
  isPermissionsLoading: boolean
  vendor?: string
  hasPermission: (domainName: DomainName) => boolean
  syncScopes: () => Promise<void>
  syncUserAccessControls: () => Promise<void>
  syncTenantAccessControls: () => Promise<void>
}

const PermissionsContext = createContext<PermissionContextType>({
  userAccessControls: [],
  tenantAccessControls: [],
  mdAccessControls: [],
  accessControlsForVendor: [],
  accessControlsForOe: [],
  accessControlsForCustomer: [],
  accessControlsForEmployee: [],
  templates: [],
  userScopes: [],
  isPermissionsLoading: true,
  vendor: undefined,
  hasPermission: () => false,
  syncScopes: async () => {
    // NOOP
  },
  syncUserAccessControls: async () => {
    // NOOP
  },
  syncTenantAccessControls: async () => {
    // NOOP
  },
})

const restrictDomains =
  (allowedDomainIds: Set<string>) =>
  (ac: AccessControl): AccessControl =>
    ac.predefined
      ? {
          ...ac,
          domains: (ac.domains ?? []).filter((d) => allowedDomainIds.has(d)),
        }
      : ac

export const usePermissions = () => useContext(PermissionsContext)

export const PermissionsProvider = ({ children }: PropsWithChildren) => {
  const { user, tenant, token } = useDashboardContext()
  const { t } = useTranslation()
  const { showError } = useToast()
  const {
    getAllAccessControlsForUser,
    getAllAccessControls,
    getAccessControlsTemplates,
    getScopesForUser,
  } = useIamApi()

  const [vendor, setVendor] = useState<string>()
  const [isPermissionsLoading, setIsPermissionsLoading] = useState(true)
  const [userScopes, setUserScopes] = useState<string[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [userAccessControls, setUserAccessControls] = useState<AccessControl[]>(
    []
  )
  const [tenantAccessControls, setTenantAccessControls] = useState<
    AccessControl[]
  >([])

  const syncUserAccessControls = async () => {
    if (!user?.userId) return
    try {
      const userACs = await getAllAccessControlsForUser()
      setUserAccessControls(userACs)
    } catch (e: unknown) {
      console.error(e)
      const details =
        e &&
        typeof e === 'object' &&
        'response' in e &&
        e.response &&
        typeof e.response === 'object' &&
        'data' in e.response &&
        e.response.data &&
        typeof e.response.data === 'object' &&
        'details' in e.response.data
          ? String(e.response.data.details)
          : t('global.toasts.fetchUserAccessControls.error')
      showError(t('global.toasts.fetchUserAccessControls.error'), details)
    }
  }

  const syncTenantAccessControls = async () => {
    try {
      const tenantACs = await getAllAccessControls()
      setTenantAccessControls(tenantACs.values)
    } catch (e: unknown) {
      console.error(e)
      const details =
        e &&
        typeof e === 'object' &&
        'response' in e &&
        e.response &&
        typeof e.response === 'object' &&
        'data' in e.response &&
        e.response.data &&
        typeof e.response.data === 'object' &&
        'details' in e.response.data
          ? String(e.response.data.details)
          : t('global.toasts.fetchTenantAccessControls.error')
      showError(t('global.toasts.fetchTenantAccessControls.error'), details)
    }
  }

  const syncTemplates = async () => {
    try {
      const fetchedTemplates = await getAccessControlsTemplates()
      setTemplates(fetchedTemplates as unknown as Template[])
    } catch (e: unknown) {
      console.error(e)
    }
  }

  const syncScopes = async () => {
    try {
      const { scopes, vendorId } = await getScopesForUser()
      const scopesArray = scopes.split(' ')
      setVendor(vendorId)
      setUserScopes(scopesArray)
    } catch (e: unknown) {
      console.error(e)
      showError(t('global.toasts.fetchUserAccessControls.error'))
    }
  }

  const domainsMap = useMemo(() => getDomainsMapFromAccessControls(), [])

  const expandedUserAcIds = useMemo(
    () =>
      expandWithImpliedViewerAcs(
        new Set(userAccessControls.map((ac) => ac.id))
      ),
    [userAccessControls]
  )

  const mdAccessControls = useMemo(
    () =>
      tenantAccessControls
        .filter((ac) => !ac.predefined || domainsMap.has(ac.id))
        .map((ac) =>
          ac.predefined
            ? {
                ...ac,
                domains: domainsMap.get(ac.id) ?? [],
              }
            : ac
        ),
    [tenantAccessControls, domainsMap]
  )

  const accessControlsForOe = useMemo(() => {
    const acIds = new Set(OE_DOMAINS.flatMap((d) => d.accessControls))
    const domainsIds = new Set(OE_DOMAINS.map((d) => d.id))
    return mdAccessControls
      .filter((ac) => acIds.has(ac.id))
      .map(restrictDomains(domainsIds))
  }, [mdAccessControls])

  const accessControlsForCustomer = useMemo(() => {
    const acIds = new Set(CUSTOMER_DOMAINS.flatMap((d) => d.accessControls))
    const domainsIds = new Set(CUSTOMER_DOMAINS.map((d) => d.id))
    return mdAccessControls
      .filter((ac) => acIds.has(ac.id))
      .map(restrictDomains(domainsIds))
  }, [mdAccessControls])

  const accessControlsForVendor = useMemo(() => {
    const acIds = new Set(VENDOR_DOMAINS.flatMap((d) => d.accessControls))
    const domainsIds = new Set(VENDOR_DOMAINS.map((d) => d.id))
    return mdAccessControls
      .filter((ac) => acIds.has(ac.id))
      .map(restrictDomains(domainsIds))
  }, [mdAccessControls])

  const accessControlsForEmployee = useMemo(() => {
    const domains = [...EMPLOYEE_DOMAINS, ...EMPLOYEE_ADMIN_DOMAINS]
    const acIds = new Set(domains.flatMap((d) => d.accessControls))
    const domainsIds = new Set(domains.map((d) => d.id))
    return mdAccessControls
      .filter((ac) => !ac.predefined || acIds.has(ac.id))
      .map(restrictDomains(domainsIds))
  }, [mdAccessControls])

  const hasPermission = useCallback(
    (domainName: DomainName): boolean => {
      const requiredAcs = getAccessControlsFromDomain(domainName)
      return (
        requiredAcs.length > 0 &&
        requiredAcs.every((ac) => expandedUserAcIds.has(ac))
      )
    },
    [expandedUserAcIds]
  )

  useEffect(() => {
    if (!token || !user?.userId) {
      setIsPermissionsLoading(false)
      return
    }
    setIsPermissionsLoading(true)
    ;(async () => {
      try {
        await syncUserAccessControls()
        await syncScopes()
        await syncTemplates()
      } catch (e: unknown) {
        console.error(e)
      } finally {
        setIsPermissionsLoading(false)
      }
    })()
  }, [user?.userId, tenant, token])

  useEffect(() => {
    ;(async () => {
      if (hasPermission(EmployeeDomains.ACCESS_CONTROLS_VIEWER)) {
        await syncTenantAccessControls()
      }
    })()
  }, [hasPermission])

  if (isPermissionsLoading) {
    return <LoadingLayout />
  }

  return (
    <PermissionsContext.Provider
      value={{
        isPermissionsLoading,
        userScopes,
        templates,
        userAccessControls,
        tenantAccessControls,
        mdAccessControls,
        accessControlsForVendor,
        accessControlsForOe,
        accessControlsForCustomer,
        accessControlsForEmployee,
        vendor,
        hasPermission,
        syncScopes,
        syncUserAccessControls,
        syncTenantAccessControls,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  )
}
