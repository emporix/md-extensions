import { describe, expect, it } from 'vitest'
import { getAgentTagOptions } from './agentHelpers'
import { AVAILABLE_TAGS } from './constants'

describe('getAgentTagOptions', () => {
  it('offers all predefined tags when nothing is selected', () => {
    const options = getAgentTagOptions([])
    expect(options).toEqual(
      AVAILABLE_TAGS.map((tag) => ({ label: tag, value: tag }))
    )
  })

  it('keeps the selected casing for predefined tags (case-insensitive match)', () => {
    const options = getAgentTagOptions(['productivity', 'SECURITY'])
    expect(options).toContainEqual({
      label: 'productivity',
      value: 'productivity',
    })
    expect(options).toContainEqual({ label: 'SECURITY', value: 'SECURITY' })
    expect(
      options.filter((o) => o.value.toLowerCase() === 'productivity')
    ).toHaveLength(1)
  })

  it('appends tags that are not in the predefined list as their own value', () => {
    const options = getAgentTagOptions(['custom-tag'])
    expect(options).toHaveLength(AVAILABLE_TAGS.length + 1)
    expect(options).toContainEqual({ label: 'custom-tag', value: 'custom-tag' })
  })

  it('does not duplicate an unknown tag', () => {
    const options = getAgentTagOptions(['custom-tag', 'custom-tag'])
    expect(options.filter((o) => o.value === 'custom-tag')).toHaveLength(1)
  })

  it('ignores empty or missing input', () => {
    expect(getAgentTagOptions(undefined)).toEqual(
      AVAILABLE_TAGS.map((tag) => ({ label: tag, value: tag }))
    )
    expect(getAgentTagOptions(null)).toEqual(
      AVAILABLE_TAGS.map((tag) => ({ label: tag, value: tag }))
    )
  })
})
