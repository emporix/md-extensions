import type { FunctionDeployment } from '../types/FunctionDeployment'

const deploymentCreatedAtMs = (deployment: FunctionDeployment): number => {
  const ms = new Date(deployment.createdAt).getTime()
  return Number.isFinite(ms) ? ms : 0
}

export const sortFunctionDeploymentsByCreatedAtDesc = (
  deployments: FunctionDeployment[]
): FunctionDeployment[] =>
  [...deployments].sort((a, b) => {
    const diff = deploymentCreatedAtMs(b) - deploymentCreatedAtMs(a)
    if (diff !== 0) {
      return diff
    }
    return b.id.localeCompare(a.id)
  })

/**
 * Returns `mediaId` from the deployment with the newest `createdAt` among
 * deployments that have a non-empty `mediaId`.
 */
export const getLatestDeploymentMediaId = (
  deployments: FunctionDeployment[] | null | undefined
): string | null => {
  const withMedia = (deployments ?? []).filter(
    (deployment): deployment is FunctionDeployment & { mediaId: string } =>
      typeof deployment.mediaId === 'string' &&
      deployment.mediaId.trim().length > 0
  )
  if (withMedia.length === 0) {
    return null
  }
  const sorted = sortFunctionDeploymentsByCreatedAtDesc(withMedia)
  return sorted[0]?.mediaId ?? null
}
