import { Token } from '../types/Token'
import { TFunction } from 'i18next'

export const createEmptyToken = (): Token => ({
  id: '',
  name: '',
  value: '',
})

export const getTokenTypeLabel = (t: TFunction, tokenId: string): string => {
  const normalizedId = tokenId.toLowerCase()

  if (normalizedId.includes('openai')) {
    return t('llm_provider_openai')
  }

  if (normalizedId.includes('anthropic')) {
    return t('token_type_anthropic')
  }

  if (normalizedId.includes('emporix')) {
    return t('emporix')
  }

  return t('token_type_api')
}
