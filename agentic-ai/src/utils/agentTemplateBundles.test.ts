import { describe, expect, it } from 'vitest'
import type { AgentTemplate } from '../types/Agent'
import {
  ANTI_FRAUD_AUDIT_TEMPLATE_ID,
  ANTI_FRAUD_SCORING_TEMPLATE_ID,
  ANTI_FRAUD_TEMPLATE_ID,
  COMPLAINT_AUDIT_TEMPLATE_ID,
  COMPLAINT_CATEGORIZATION_TEMPLATE_ID,
  COMPLAINT_TEMPLATE_ID,
  IMPORT_COPILOT_TEMPLATE_ID,
  IMPORT_DIAGNOSTICS_TEMPLATE_ID,
  IMPORT_MAPPING_DSL_TEMPLATE_ID,
  filterVisibleAgentTemplates,
  getBundleHelperTemplateIds,
  isBundleHelperTemplateId,
  isBundlePrimaryTemplateId,
} from './agentTemplateBundles'

const template = (id: string): AgentTemplate => ({
  id,
  name: { en: id },
  description: { en: id },
  userPrompt: '',
  templatePrompt: '',
  type: 'generic',
  mcpServers: [],
  nativeTools: [],
  enabled: true,
})

describe('agentTemplateBundles', () => {
  it('returns helpers in install order for complaint and anti-fraud', () => {
    expect(getBundleHelperTemplateIds(COMPLAINT_TEMPLATE_ID)).toEqual([
      COMPLAINT_CATEGORIZATION_TEMPLATE_ID,
      COMPLAINT_AUDIT_TEMPLATE_ID,
    ])
    expect(getBundleHelperTemplateIds(ANTI_FRAUD_TEMPLATE_ID)).toEqual([
      ANTI_FRAUD_SCORING_TEMPLATE_ID,
      ANTI_FRAUD_AUDIT_TEMPLATE_ID,
    ])
    expect(getBundleHelperTemplateIds('support')).toEqual([])
  })

  it('returns helpers in install order for the import copilot', () => {
    // The copilot hands off to the mapping specialist first and the diagnostics specialist second,
    // and the order here is the order they are installed in — a helper must exist before the primary
    // that references it by id is created.
    expect(getBundleHelperTemplateIds(IMPORT_COPILOT_TEMPLATE_ID)).toEqual([
      IMPORT_MAPPING_DSL_TEMPLATE_ID,
      IMPORT_DIAGNOSTICS_TEMPLATE_ID,
    ])
  })

  it('hides the import copilot helpers from the library but keeps the copilot itself', () => {
    // The two specialists are only ever reached through the copilot, so offering them as separate
    // entries in the template library would present three things to install where there is one.
    const visible = filterVisibleAgentTemplates([
      template(IMPORT_COPILOT_TEMPLATE_ID),
      template(IMPORT_MAPPING_DSL_TEMPLATE_ID),
      template(IMPORT_DIAGNOSTICS_TEMPLATE_ID),
    ])

    expect(visible.map((t) => t.id)).toEqual([IMPORT_COPILOT_TEMPLATE_ID])
  })

  it('detects primary and helper template ids', () => {
    expect(isBundlePrimaryTemplateId(COMPLAINT_TEMPLATE_ID)).toBe(true)
    expect(isBundlePrimaryTemplateId(ANTI_FRAUD_TEMPLATE_ID)).toBe(true)
    expect(isBundlePrimaryTemplateId('support')).toBe(false)

    expect(isBundleHelperTemplateId(COMPLAINT_AUDIT_TEMPLATE_ID)).toBe(true)
    expect(isBundleHelperTemplateId(ANTI_FRAUD_SCORING_TEMPLATE_ID)).toBe(true)
    expect(isBundleHelperTemplateId(COMPLAINT_TEMPLATE_ID)).toBe(false)
  })

  it('filters helper templates from the visible catalog', () => {
    const templates = [
      template(COMPLAINT_TEMPLATE_ID),
      template(COMPLAINT_CATEGORIZATION_TEMPLATE_ID),
      template(COMPLAINT_AUDIT_TEMPLATE_ID),
      template(ANTI_FRAUD_TEMPLATE_ID),
      template(ANTI_FRAUD_SCORING_TEMPLATE_ID),
      template(ANTI_FRAUD_AUDIT_TEMPLATE_ID),
      template('support'),
    ]

    expect(
      filterVisibleAgentTemplates(templates).map((item) => item.id)
    ).toEqual([COMPLAINT_TEMPLATE_ID, ANTI_FRAUD_TEMPLATE_ID, 'support'])
  })
})
