import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  buildTeamsGraphConsentSearch,
  buildTeamsToolRouteFromCallback,
  clearTeamsInstallPending,
  clearTeamsToolInstallDraft,
  extractToolIdFromHashPath,
  parseTeamsGraphConsentFromLocation,
  readTeamsInstallPending,
  readTeamsToolInstallDraft,
  saveTeamsInstallPending,
  saveTeamsToolInstallDraft,
  TEAMS_INSTALL_PENDING_STORAGE_KEY,
  TEAMS_TOOL_DRAFT_STORAGE_KEY,
} from './teamsInstallCallback'

const createSessionStorageMock = (): Storage => {
  const store = new Map<string, string>()
  return {
    get length() {
      return store.size
    },
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key)
    },
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
  }
}

describe('teamsInstallCallback', () => {
  beforeEach(() => {
    vi.stubGlobal('sessionStorage', createSessionStorageMock())
  })

  afterEach(() => {
    sessionStorage.clear()
    vi.unstubAllGlobals()
  })

  it('parses legacy hash callback urls', () => {
    const parsed = parseTeamsGraphConsentFromLocation(
      'https://dev-admin.emporix.io/apps/administration/ai-agents#tools?teamsGraphConsent=success&providerTenantId=a35dba29&state=state-1'
    )

    expect(parsed).toEqual({
      status: 'success',
      providerTenantId: 'a35dba29',
      state: 'state-1',
      hashPath: '/tools',
    })
  })

  it('parses hash router callback urls', () => {
    const parsed = parseTeamsGraphConsentFromLocation(
      'https://dev-admin.emporix.io/apps/administration/ai-agents#/tools/teams-support/edit?teamsGraphConsent=success&providerTenantId=a35dba29&state=state-1'
    )

    expect(parsed).toEqual({
      status: 'success',
      providerTenantId: 'a35dba29',
      state: 'state-1',
      hashPath: '/tools/teams-support/edit',
    })
  })

  it('builds edit route only when callback hash targets edit', () => {
    expect(
      buildTeamsToolRouteFromCallback({
        status: 'success',
        hashPath: '/tools/teams-support/edit',
      })
    ).toBe('/tools/teams-support/edit')
  })

  it('always uses add route when callback hash is not persisted edit', () => {
    expect(
      buildTeamsToolRouteFromCallback({
        status: 'success',
        hashPath: '/tools/add',
      })
    ).toBe('/tools/add')
  })

  it('extracts tool id from edit hash path', () => {
    expect(extractToolIdFromHashPath('/tools/teams-support/edit')).toBe(
      'teams-support'
    )
  })

  it('builds consent search params', () => {
    expect(
      buildTeamsGraphConsentSearch({
        status: 'success',
        providerTenantId: 'a35dba29',
        state: 'state-1',
      })
    ).toBe('teamsGraphConsent=success&providerTenantId=a35dba29&state=state-1')
  })

  it('reads install draft without tool id when installStateId matches', () => {
    saveTeamsToolInstallDraft({
      toolType: 'teams',
      installStateId: 'state-1',
    })

    expect(readTeamsToolInstallDraft('state-1')).toEqual({
      toolType: 'teams',
      installStateId: 'state-1',
    })
  })

  it('returns null when install draft state id does not match', () => {
    saveTeamsToolInstallDraft({
      toolType: 'teams',
      installStateId: 'state-1',
    })

    expect(readTeamsToolInstallDraft('state-2')).toBeNull()
  })

  it('stores and clears pending install state', () => {
    saveTeamsInstallPending({
      installStateId: 'state-1',
      providerTenantId: 'tenant-1',
    })

    expect(readTeamsInstallPending()).toEqual({
      installStateId: 'state-1',
      providerTenantId: 'tenant-1',
    })

    clearTeamsInstallPending()
    expect(sessionStorage.getItem(TEAMS_INSTALL_PENDING_STORAGE_KEY)).toBeNull()
  })

  it('returns null for invalid pending install payload', () => {
    sessionStorage.setItem(
      TEAMS_INSTALL_PENDING_STORAGE_KEY,
      JSON.stringify({ installStateId: 'state-1' })
    )

    expect(readTeamsInstallPending()).toBeNull()
  })

  it('clears install draft storage', () => {
    saveTeamsToolInstallDraft({
      toolType: 'teams',
      installStateId: 'state-1',
    })

    clearTeamsToolInstallDraft()
    expect(sessionStorage.getItem(TEAMS_TOOL_DRAFT_STORAGE_KEY)).toBeNull()
  })
})
