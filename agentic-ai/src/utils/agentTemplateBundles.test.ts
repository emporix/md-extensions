import { describe, expect, it } from 'vitest'
import type { AgentTemplate } from '../types/Agent'
import {
  ANTI_FRAUD_AUDIT_TEMPLATE_ID,
  ANTI_FRAUD_SCORING_TEMPLATE_ID,
  ANTI_FRAUD_TEMPLATE_ID,
  COMPLAINT_AUDIT_TEMPLATE_ID,
  COMPLAINT_CATEGORIZATION_TEMPLATE_ID,
  COMPLAINT_TEMPLATE_ID,
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
