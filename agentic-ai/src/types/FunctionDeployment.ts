export type FunctionDeploymentType = 'github' | 'media'

export interface FunctionDeployment {
  id: string
  hostingId: string
  createdAt: string
  buildId: string
  deploymentType: FunctionDeploymentType
  repositoryUrl?: string
  branch?: string
  mediaId?: string
}

export interface FunctionDeploymentsResponse {
  deployments: FunctionDeployment[]
}
