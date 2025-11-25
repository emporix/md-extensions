import { Token } from '../types/Token'
import { AppState } from '../types/common'
import { ApiClient } from './apiClient'
import { validateToken } from '../utils/validation'

export class TokensService {
  private api: ApiClient
  private tenant: string

  constructor(appState: AppState) {
    this.api = new ApiClient(appState)
    this.tenant = appState.tenant
  }

  async getTokens(): Promise<Token[]> {
    return await this.api.get<Token[]>(
      `/ai-service/${this.tenant}/agentic/tokens`
    )
  }

  async upsertToken(token: Token): Promise<Token> {
    validateToken(token)

    return await this.api.put<Token>(
      `/ai-service/${this.tenant}/agentic/tokens/${token.id}`,
      {
        name: token.name,
        value: token.value,
      }
    )
  }

  async deleteToken(tokenId: string, force?: boolean): Promise<void> {
    const url = `/ai-service/${this.tenant}/agentic/tokens/${tokenId}${force ? '?force=true' : ''}`
    await this.api.delete(url)
  }
}
