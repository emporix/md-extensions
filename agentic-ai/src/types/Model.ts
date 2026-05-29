export type LlmModelProvider = 'openai' | 'anthropic' | 'google'

export interface LlmModel {
  id: string
  name: string
  description?: string
  thinking?: boolean
}

export interface ProviderModelsResponse {
  provider: LlmModelProvider
  models: LlmModel[]
}
