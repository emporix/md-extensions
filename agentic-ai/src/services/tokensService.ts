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
      throw error;
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
      throw error;
    }
  }

  async deleteToken(tokenId: string): Promise<void> {
    try {
      await this.api.delete(`/ai-service/${this.tenant}/agentic/tokens/${tokenId}`);
    } catch (error) {
      return Promise.resolve();
    }
  }
}
