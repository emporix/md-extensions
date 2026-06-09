import { Tool } from '../types/Tool'
import { TFunction } from 'i18next'

export const createEmptyTool = (): Tool => ({
  id: '',
  name: '',
  type: 'slack',
  config: {},
  enabled: true,
})

export const getToolTypeLabel = (t: TFunction, toolType: string): string => {
  switch (toolType) {
    case 'slack':
      return t('slack')
    case 'teams':
      return t('microsoft_teams')
    case 'rag_custom':
      return t('rag_custom')
    case 'rag_emporix':
      return t('rag_emporix')
    default:
      return toolType
  }
}
