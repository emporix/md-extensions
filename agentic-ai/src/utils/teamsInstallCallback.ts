export type TeamsGraphConsentStatus = 'success' | 'error' | 'unknown'

export interface TeamsGraphConsentCallback {
  status: TeamsGraphConsentStatus
  providerTenantId?: string
  state?: string
  error?: string
  errorDescription?: string
  hashPath?: string
}

export interface TeamsToolInstallDraft {
  toolId: string
  toolName: string
  toolType: string
  tenantId?: string
  installStateId: string
}

export const TEAMS_TOOL_DRAFT_STORAGE_KEY = 'emporix.teamsToolInstallDraft'

const normalizeHashPath = (hashPath: string): string => {
  const trimmed = hashPath.trim()
  if (!trimmed) {
    return ''
  }
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}

const parseSearchParams = (query: string): URLSearchParams | null => {
  if (!query.trim()) {
    return null
  }
  return new URLSearchParams(query.startsWith('?') ? query.slice(1) : query)
}

const toConsentStatus = (value: string | null): TeamsGraphConsentStatus => {
  if (value === 'success' || value === 'error') {
    return value
  }
  return 'unknown'
}

export const parseTeamsGraphConsentFromLocation = (
  href: string
): TeamsGraphConsentCallback | null => {
  try {
    const url = new URL(href)
    const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash
    const hashQueryIndex = hash.indexOf('?')
    const hashPath = hashQueryIndex >= 0 ? hash.slice(0, hashQueryIndex) : hash
    const hashSearchParams = parseSearchParams(
      hashQueryIndex >= 0 ? hash.slice(hashQueryIndex) : ''
    )
    const locationSearchParams = parseSearchParams(url.search)

    const consent =
      hashSearchParams?.get('teamsGraphConsent') ??
      locationSearchParams?.get('teamsGraphConsent')
    if (!consent) {
      return null
    }

    const params = hashSearchParams ?? locationSearchParams
    if (!params) {
      return { status: toConsentStatus(consent) }
    }

    return {
      status: toConsentStatus(consent),
      providerTenantId: params.get('providerTenantId') ?? undefined,
      state: params.get('state') ?? undefined,
      error: params.get('error') ?? undefined,
      errorDescription: params.get('errorDescription') ?? undefined,
      hashPath: hashPath ? normalizeHashPath(hashPath) : undefined,
    }
  } catch {
    return null
  }
}

export const extractToolIdFromHashPath = (
  hashPath?: string
): string | undefined => {
  if (!hashPath) {
    return undefined
  }

  const match = hashPath.match(/^\/tools\/([^/]+)\/edit$/)
  return match?.[1]
}

export const buildTeamsToolRouteFromCallback = (
  callback: TeamsGraphConsentCallback
): string => {
  const toolIdFromPath = extractToolIdFromHashPath(callback.hashPath)
  if (toolIdFromPath) {
    return `/tools/${toolIdFromPath}/edit`
  }
  return '/tools/add'
}

export const buildTeamsGraphConsentSearch = (
  callback: TeamsGraphConsentCallback
): string => {
  const params = new URLSearchParams()
  params.set('teamsGraphConsent', callback.status)
  if (callback.providerTenantId) {
    params.set('providerTenantId', callback.providerTenantId)
  }
  if (callback.state) {
    params.set('state', callback.state)
  }
  if (callback.error) {
    params.set('error', callback.error)
  }
  if (callback.errorDescription) {
    params.set('errorDescription', callback.errorDescription)
  }
  return params.toString()
}

export const saveTeamsToolInstallDraft = (
  draft: TeamsToolInstallDraft
): void => {
  sessionStorage.setItem(TEAMS_TOOL_DRAFT_STORAGE_KEY, JSON.stringify(draft))
}

export const readTeamsToolInstallDraft = (
  installStateId?: string
): TeamsToolInstallDraft | null => {
  const raw = sessionStorage.getItem(TEAMS_TOOL_DRAFT_STORAGE_KEY)
  if (!raw) {
    return null
  }

  try {
    const draft = JSON.parse(raw) as TeamsToolInstallDraft
    if (!draft?.toolId?.trim() || !draft.installStateId?.trim()) {
      return null
    }
    if (installStateId && draft.installStateId !== installStateId) {
      return null
    }
    return draft
  } catch {
    return null
  }
}

export const clearTeamsToolInstallDraft = (): void => {
  sessionStorage.removeItem(TEAMS_TOOL_DRAFT_STORAGE_KEY)
}
