import { AppState } from '../types/common'
import { ApiClient } from './apiClient'

export interface FeatureToggleDto {
  isEnabled: boolean
}

export class FeatureToggleService {
  private api: ApiClient
  private tenant: string

  constructor(appState: AppState) {
    this.api = new ApiClient(appState)
    this.tenant = appState.tenant
  }

  async isRagFeatureEnabled(): Promise<boolean> {
    try {
      const response = await this.api.get<FeatureToggleDto>(
        `/feature-toggle/${this.tenant}/features/rag`
      )
      return response.isEnabled
    } catch (error) {
      console.error('Failed to fetch RAG feature toggle:', error)
      return false
    }
  }
}

