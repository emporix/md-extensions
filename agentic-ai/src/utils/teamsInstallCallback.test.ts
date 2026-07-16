import { describe, expect, it } from 'vitest'
import {
  buildTeamsGraphConsentSearch,
  buildTeamsToolRouteFromCallback,
  extractToolIdFromHashPath,
  parseTeamsGraphConsentFromLocation,
} from './teamsInstallCallback'

describe('teamsInstallCallback', () => {
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
})
