import { describe, expect, it } from 'vitest'
import {
  getTeamsAppPackageSuffix,
  getTeamsAppPackageUrl,
  resolveRemoteAssetUrl,
} from './teamsAppPackageUrl'

describe('getTeamsAppPackageSuffix', () => {
  it('returns dev for vite --mode dev and default development', () => {
    expect(getTeamsAppPackageSuffix('dev')).toBe('dev')
    expect(getTeamsAppPackageSuffix('development')).toBe('dev')
  })

  it('returns stage for --mode stage', () => {
    expect(getTeamsAppPackageSuffix('stage')).toBe('stage')
  })

  it('returns prod for prod and unknown modes', () => {
    expect(getTeamsAppPackageSuffix('prod')).toBe('prod')
    expect(getTeamsAppPackageSuffix('production')).toBe('prod')
    expect(getTeamsAppPackageSuffix('test')).toBe('prod')
  })
})

describe('resolveRemoteAssetUrl', () => {
  it('resolves host-root asset paths against the federated remote origin', () => {
    expect(
      resolveRemoteAssetUrl(
        '/assets/EmporixTeamsBot.dev-D4uXRrfb.zip',
        'https://emporix-agentic-ai-develop.web.app/assets/__federation_expose_RemoteComponent.js'
      )
    ).toBe(
      'https://emporix-agentic-ai-develop.web.app/assets/EmporixTeamsBot.dev-D4uXRrfb.zip'
    )
  })

  it('resolves vite-dev asset paths against the local remote origin', () => {
    expect(
      resolveRemoteAssetUrl(
        '/src/assets/teams-app/EmporixTeamsBot.dev.zip',
        'http://localhost:5173/src/utils/teamsAppPackageUrl.ts'
      )
    ).toBe('http://localhost:5173/src/assets/teams-app/EmporixTeamsBot.dev.zip')
  })

  it('keeps already-absolute asset urls', () => {
    expect(
      resolveRemoteAssetUrl(
        'https://cdn.example/EmporixTeamsBot.prod.zip',
        'https://dev-admin.emporix.io/apps/administration/ai-agents'
      )
    ).toBe('https://cdn.example/EmporixTeamsBot.prod.zip')
  })
})

describe('getTeamsAppPackageUrl', () => {
  it('points the download at the remote origin, not the host', () => {
    const url = getTeamsAppPackageUrl(
      'dev',
      'https://emporix-agentic-ai-develop.web.app/assets/__federation_expose_RemoteComponent.js'
    )

    expect(url.startsWith('https://emporix-agentic-ai-develop.web.app/')).toBe(
      true
    )
    expect(url).toContain('EmporixTeamsBot.dev')
    expect(url).toContain('.zip')
  })
})
