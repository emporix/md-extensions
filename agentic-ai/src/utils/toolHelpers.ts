import { Tool } from '../types/Tool'
import { TFunction } from 'i18next'
import {
  TeamsGraphConsentCallback,
  TeamsToolInstallDraft,
} from './teamsInstallCallback'

export const createEmptyTool = (): Tool => ({
  id: '',
  name: '',
  type: 'slack',
  config: {},
  enabled: true,
})

export const createEmptyTeamsTool = (tenantId?: string): Tool => ({
  id: '',
  name: '',
  type: 'teams',
  config: tenantId?.trim() ? { tenantId: tenantId.trim() } : {},
  enabled: true,
})

export const applyTeamsGraphConsentToTool = (
  prev: Tool | null,
  callback: TeamsGraphConsentCallback,
  draft?: TeamsToolInstallDraft | null
): Tool => ({
  id: draft?.toolId?.trim() || prev?.id || '',
  name: draft?.toolName?.trim() || prev?.name || '',
  type: 'teams',
  enabled: prev?.enabled ?? true,
  config: {
    ...(prev?.config ?? {}),
    ...(callback.providerTenantId?.trim()
      ? { tenantId: callback.providerTenantId.trim() }
      : draft?.tenantId?.trim()
        ? { tenantId: draft.tenantId.trim() }
        : {}),
  },
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
