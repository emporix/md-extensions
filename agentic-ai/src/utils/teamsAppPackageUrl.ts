import devPackageUrl from '../assets/teams-app/EmporixTeamsBot.dev.zip?url'
import prodPackageUrl from '../assets/teams-app/EmporixTeamsBot.prod.zip?url'
import stagePackageUrl from '../assets/teams-app/EmporixTeamsBot.stage.zip?url'

export const getTeamsAppPackageSuffix = (): string => {
  const mode = import.meta.env.MODE
  if (mode === 'dev') {
    return 'dev'
  }
  if (mode === 'stage') {
    return 'stage'
  }
  return 'prod'
}

export const getTeamsAppPackageUrl = (): string => {
  const mode = import.meta.env.MODE
  if (mode === 'dev') {
    return devPackageUrl
  }
  if (mode === 'stage') {
    return stagePackageUrl
  }
  return prodPackageUrl
}
