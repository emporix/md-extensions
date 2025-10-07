import { Token } from '../types/Token';
import { AppState } from '../types/common';
import { ApiClient } from './apiClient';
import { validateToken } from '../utils/validation';

export class TokensService {
  private api: ApiClient;
  private tenant: string;

  constructor(appState: AppState) {
    this.api = new ApiClient(appState);
    this.tenant = appState.tenant;
  }

  async getTokens(): Promise<Token[]> {
    try {
      return await this.api.get<Token[]>(`/ai-service/${this.tenant}/agentic/tokens`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch tokens';
      throw new Error(errorMessage);
    }
  }

  async upsertToken(token: Token): Promise<Token> {
    validateToken(token);

    try {
      return await this.api.put<Token>(
        `/ai-service/${this.tenant}/agentic/tokens/${token.id}`,
        {
          name: token.name,
          value: token.value,
        }
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save token';
      throw new Error(errorMessage);
    }
  }

  async deleteToken(tokenId: string): Promise<void> {
    try {
      await this.api.delete(`/ai-service/${this.tenant}/agentic/tokens/${tokenId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete token';
      throw new Error(errorMessage);
    }
  }
}
