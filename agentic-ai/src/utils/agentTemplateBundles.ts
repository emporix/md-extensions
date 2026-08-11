import type { AgentTemplate } from '../types/Agent'

export const COMPLAINT_TEMPLATE_ID = 'complaint'
export const COMPLAINT_CATEGORIZATION_TEMPLATE_ID = 'complaint-categorization'
export const COMPLAINT_AUDIT_TEMPLATE_ID = 'complaint-audit'

export const ANTI_FRAUD_TEMPLATE_ID = 'anti-fraud'
export const ANTI_FRAUD_SCORING_TEMPLATE_ID = 'anti-fraud-scoring'
export const ANTI_FRAUD_AUDIT_TEMPLATE_ID = 'anti-fraud-audit'

export const AGENT_TEMPLATE_BUNDLES: Readonly<
  Record<string, readonly string[]>
> = {
  [COMPLAINT_TEMPLATE_ID]: [
    COMPLAINT_CATEGORIZATION_TEMPLATE_ID,
    COMPLAINT_AUDIT_TEMPLATE_ID,
  ],
  [ANTI_FRAUD_TEMPLATE_ID]: [
    ANTI_FRAUD_SCORING_TEMPLATE_ID,
    ANTI_FRAUD_AUDIT_TEMPLATE_ID,
  ],
}

const BUNDLE_HELPER_TEMPLATE_IDS = new Set(
  Object.values(AGENT_TEMPLATE_BUNDLES).flat()
)

export const isBundleHelperTemplateId = (templateId: string): boolean =>
  BUNDLE_HELPER_TEMPLATE_IDS.has(templateId)

export const getBundleHelperTemplateIds = (
  primaryTemplateId: string
): readonly string[] => AGENT_TEMPLATE_BUNDLES[primaryTemplateId] ?? []

export const isBundlePrimaryTemplateId = (templateId: string): boolean =>
  templateId in AGENT_TEMPLATE_BUNDLES

export const filterVisibleAgentTemplates = (
  templates: AgentTemplate[]
): AgentTemplate[] =>
  templates.filter((template) => !isBundleHelperTemplateId(template.id))
