import type { Tool } from '../types/Tool'
import type { TFunction } from 'i18next'
import type {
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

export const shouldApplyTeamsGraphConsent = ({
  isCreating = false,
  toolType,
  draftToolType,
}: {
  readonly isCreating?: boolean
  readonly toolType?: string | null
  readonly draftToolType?: string | null
}): boolean =>
  isCreating ||
  toolType === 'teams' ||
  (!toolType?.trim() && draftToolType === 'teams')

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
    ...(prev?.type === 'teams' ? (prev.config ?? {}) : {}),
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
