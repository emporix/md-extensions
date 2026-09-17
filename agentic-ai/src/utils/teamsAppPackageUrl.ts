import devPackageUrl from '../assets/teams-app/EmporixTeamsBot.dev.zip?url'
import prodPackageUrl from '../assets/teams-app/EmporixTeamsBot.prod.zip?url'
import stagePackageUrl from '../assets/teams-app/EmporixTeamsBot.stage.zip?url'

const TEAMS_APP_PACKAGE_URLS = {
  dev: devPackageUrl,
  stage: stagePackageUrl,
  prod: prodPackageUrl,
} as const

export type TeamsAppPackageSuffix = keyof typeof TEAMS_APP_PACKAGE_URLS

export const getTeamsAppPackageSuffix = (
  mode: string = import.meta.env.MODE
): TeamsAppPackageSuffix => {
  if (mode === 'dev' || mode === 'development') {
    return 'dev'
  }
  if (mode === 'stage') {
    return 'stage'
  }
  return 'prod'
}

export const resolveRemoteAssetUrl = (
  assetUrl: string,
  moduleUrl: string
): string => new URL(assetUrl, moduleUrl).href

export const getTeamsAppPackageUrl = (
  mode: string = import.meta.env.MODE,
  moduleUrl: string = import.meta.url
): string => {
  const suffix = getTeamsAppPackageSuffix(mode)
  return resolveRemoteAssetUrl(TEAMS_APP_PACKAGE_URLS[suffix], moduleUrl)
}
