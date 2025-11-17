import { AppState } from '../types/common'
import { ApiClient } from './apiClient'

export class AiRagIndexerService {
  private api: ApiClient
  private tenant: string

  constructor(appState: AppState) {
    this.api = new ApiClient(appState)
    this.tenant = appState.tenant
  }

  async getRagMetadata(ragEntityType: string): Promise<string[]> {
    try {
      return await this.api.get<string[]>(
        `/ai-rag-indexer/${this.tenant}/${ragEntityType}/rag-metadata`
      )
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch RAG metadata'
      throw new Error(errorMessage)
    }
  }
}

