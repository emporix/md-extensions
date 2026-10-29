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
import { AccessControl } from '../models/Permissions.model'

export interface DomainGroup {
  name: string
  accessControls: AccessControl[]
}

const ROLE_SUFFIXES = ['Viewer', 'Editor', 'Manager', 'Administrator'] as const
type RoleSuffix = (typeof ROLE_SUFFIXES)[number]

const getRoleSuffix = (domainId: string): RoleSuffix | null => {
  for (const suffix of ROLE_SUFFIXES) {
    if (domainId.endsWith(suffix)) return suffix
  }
  return null
}

const getBaseName = (domainId: string, suffix: RoleSuffix): string =>
  domainId.slice(0, -suffix.length).trimEnd()

export const expandWithImpliedViewerAcs = (
  userAcIds: Set<string>
): Set<string> => {
  const allDomains = [
    ...EMPLOYEE_DOMAINS,
    ...EMPLOYEE_ADMIN_DOMAINS,
    ...OE_DOMAINS,
    ...VENDOR_DOMAINS,
    ...CUSTOMER_DOMAINS,
  ]

  // Group domains by base name, e.g. "Areas" → { Viewer: [...], Manager: [...] }
  const byBase = new Map<string, Partial<Record<RoleSuffix, string[]>>>()
  for (const domain of allDomains) {
    const suffix = getRoleSuffix(domain.id)
    if (!suffix) continue
    const base = getBaseName(domain.id, suffix)
    if (!byBase.has(base)) byBase.set(base, {})
    const baseRoles = byBase.get(base)
    if (baseRoles) {
      baseRoles[suffix] = domain.accessControls
    }
  }

  const expanded = new Set(userAcIds)

  // Iterate until no new ACs are added (fixed-point). This makes implications
  // cascade across bases: e.g. if a user has `Access Controls Manager`
  // natively, the first pass adds `Access Controls Viewer` to `expanded`; a
  // second pass then sees it when evaluating other bases (like
  // `Users And Groups Manager`) whose role list happens to reference
  // `Access Controls Viewer`. Without the loop, tightening unrelated
  // requirements at the Manager level could paradoxically *revoke* access —
  // violating monotonicity (relaxing a requirement should never take access
  // away from someone who qualified before).
  let changed = true
  while (changed) {
    changed = false
    for (const roles of byBase.values()) {
      const userHasRole = (suffix: RoleSuffix) => {
        const acs = roles[suffix]
        return !!acs && acs.length > 0 && acs.every((ac) => expanded.has(ac))
      }

      const hasAdmin = userHasRole('Administrator')
      const hasManager = hasAdmin || userHasRole('Manager')
      const hasEditor = hasManager || userHasRole('Editor')

      const addAll = (acs?: string[]) => {
        if (!acs) return
        for (const ac of acs) {
          if (!expanded.has(ac)) {
            expanded.add(ac)
            changed = true
          }
        }
      }

      if (hasAdmin) addAll(roles['Manager'])
      if (hasManager) addAll(roles['Editor'])
      if (hasEditor) addAll(roles['Viewer'])
    }
  }

  return expanded
}

export const groupAccessControlByDomain = (
  accessControls: AccessControl[]
): DomainGroup[] => {
  const OTHER_DOMAIN = 'zzzOther'
  const grouped: Record<string, AccessControl[]> = {}
  for (const ac of accessControls) {
    const effectiveDomains = (ac.domains ?? []).filter((d) => d !== '')
    const domains = effectiveDomains.length ? effectiveDomains : [OTHER_DOMAIN]
    for (const domain of domains) {
      if (!grouped[domain]) {
        grouped[domain] = []
      }
      grouped[domain].push(ac)
    }
  }
  return Object.entries(grouped).map(([name, accessControls]) => ({
    name,
    accessControls,
  }))
}

export const buildDomainGroups = (
  accessControls: AccessControl[],
  assignedIds: string[]
): DomainGroup[] => {
  const acIds = new Set(assignedIds)
  const fullyAssignedGroups = groupAccessControlByDomain(accessControls)
    .filter((group) =>
      group.name === 'zzzOther'
        ? group.accessControls.some((ac) => acIds.has(ac.id))
        : group.accessControls.every((ac) => acIds.has(ac.id))
    )
    .map((group) =>
      group.name === 'zzzOther'
        ? {
            ...group,
            accessControls: group.accessControls.filter((ac) =>
              acIds.has(ac.id)
            ),
          }
        : group
    )
  const visibleAcIds = new Set(
    fullyAssignedGroups.flatMap((g) => g.accessControls.map((ac) => ac.id))
  )
  const partialAcs = accessControls.filter(
    (ac) => acIds.has(ac.id) && !visibleAcIds.has(ac.id)
  )
  const otherGroup = fullyAssignedGroups.find((g) => g.name === 'zzzOther')
  return partialAcs.length === 0
    ? fullyAssignedGroups
    : [
        ...fullyAssignedGroups.filter((g) => g.name !== 'zzzOther'),
        {
          name: 'zzzOther',
          accessControls: [
            ...(otherGroup?.accessControls ?? []),
            ...partialAcs,
          ],
        },
      ]
}

export const getAccessControlsFromDomain = (
  name: EmployeeDomains | OeDomains | VendorDomains | CustomerDomains
): string[] => {
  return (
    [
      ...EMPLOYEE_DOMAINS,
      ...EMPLOYEE_ADMIN_DOMAINS,
      ...OE_DOMAINS,
      ...CUSTOMER_DOMAINS,
      ...VENDOR_DOMAINS,
    ].find((d) => d.id === name)?.accessControls ?? []
  )
}

export const getDomainsMapFromAccessControls = () =>
  new Map<string, string[]>(
    [
      ...EMPLOYEE_DOMAINS,
      ...EMPLOYEE_ADMIN_DOMAINS,
      ...OE_DOMAINS,
      ...CUSTOMER_DOMAINS,
      ...VENDOR_DOMAINS,
    ].reduce((map, domain) => {
      for (const acId of domain.accessControls) {
        const existing = map.get(acId)
        if (existing) {
          existing.push(domain.id)
        } else {
          map.set(acId, [domain.id])
        }
      }
      return map
    }, new Map<string, string[]>())
  )
