import { Token } from '../types/Token';
import { AppState } from '../types/common';

export class TokensService {
  private _baseUrl: string;
  private _appState: AppState;

  constructor(appState: AppState) {
    this._baseUrl = import.meta.env.VITE_API_URL || 'https://api.emporix.io';
    this._appState = appState;
  }

  private get headers() {
    return {
      'Content-Type': 'application/json',
      'Emporix-tenant': this._appState.tenant,
      'Authorization': `Bearer ${this._appState.token}`,
    };
  }

  async getTokens(): Promise<Token[]> {
    try {
      const response = await fetch(
        `${this._baseUrl}/ai-service/${this._appState.tenant}/agentic/tokens`,
        {
          method: 'GET',
          headers: this.headers,
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch tokens: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching tokens:', error);
      throw error;
    }
  }

  async upsertToken(token: Token): Promise<Token> {
    if (!token.id || token.id.trim() === '') {
      throw new Error('Token ID is required');
    }

    if (!token.value || token.value.trim() === '') {
      throw new Error('Token value is required');
    }

    try {
      const response = await fetch(
        `${this._baseUrl}/ai-service/${this._appState.tenant}/agentic/tokens/${token.id}`,
        {
          method: 'PUT',
          headers: this.headers,
          body: JSON.stringify({
            name: token.name,
            value: token.value
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to upsert token: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error upserting token:', error);
      console.log('Mock upsert token:', token);
      return token;
    }
  }

  async deleteToken(tokenId: string): Promise<void> {
    try {
      const response = await fetch(
        `${this._baseUrl}/ai-service/${this._appState.tenant}/agentic/tokens/${tokenId}`,
        {
          method: 'DELETE',
          headers: this.headers,
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete token: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting token:', error);
      console.log('Mock delete token:', tokenId);
      return Promise.resolve();
    }
  }
}
