import { describe, it, expect } from 'vitest'
import {
  buildAgentCommerceFilterDsl,
  COMMERCE_FILTER_PARSE_I18N_KEYS,
  commerceTriggerExtractEvents,
  commerceTriggerExtractFilter,
  composeConditions,
  defaultCommerceFilterDsl,
  extractFilterDslJsonFromAgentMessage,
  isCommerceFilterValid,
  isCompoundFilter,
  mergeCommerceTriggerPersistedConfig,
  parseAgentCommerceFilterDsl,
  stringifyFilterDsl,
  uiOperatorToDsl,
  dslOperatorToUi,
  type AgentCommerceCompoundDsl,
  type AgentCommerceFilterDsl,
} from './agentFilterDslHelpers'

describe('agentFilterDslHelpers', () => {
  it('maps UI operators to DSL and back', () => {
    expect(uiOperatorToDsl('equals')).toBe('$eq')
    expect(uiOperatorToDsl('notIn')).toBe('$notIn')
    expect(dslOperatorToUi('$isEmpty')).toBe('isEmpty')
  })

  it('parses valid DSL with array right', () => {
    const input = {
      left: '$eventTypes',
      op: '$in',
      right: ['a', 'b'],
    }
    const { dsl, error } = parseAgentCommerceFilterDsl(input)
    expect(error).toBeUndefined()
    expect(dsl).toEqual(input)
  })

  it('parses operators without right', () => {
    const { dsl } = parseAgentCommerceFilterDsl({
      left: '$eventTypes',
      op: '$exists',
    })
    expect(dsl).toEqual({ left: '$eventTypes', op: '$exists' })
  })

  it('rejects invalid operator', () => {
    const { dsl, error } = parseAgentCommerceFilterDsl({
      left: '$eventTypes',
      op: '$bad',
      right: [],
    })
    expect(dsl).toBeNull()
    expect(error).toBe(COMMERCE_FILTER_PARSE_I18N_KEYS.unsupportedOperator)
  })

  it('rejects in without array right', () => {
    const { dsl, error } = parseAgentCommerceFilterDsl({
      left: '$eventTypes',
      op: '$in',
      right: 'single',
    })
    expect(dsl).toBeNull()
    expect(error).toBe(COMMERCE_FILTER_PARSE_I18N_KEYS.valueMustBeArray)
  })

  it('commerceTriggerExtractEvents reads events only', () => {
    expect(
      commerceTriggerExtractEvents({
        events: ['x', 'y'],
      })
    ).toEqual(['x', 'y'])
    expect(
      commerceTriggerExtractEvents({
        filter: { left: 'cart.siteCode', op: '$exists' },
      })
    ).toEqual([])
    expect(commerceTriggerExtractEvents(null)).toEqual([])
  })

  it('commerceTriggerExtractFilter reads explicit filter only', () => {
    expect(
      commerceTriggerExtractFilter({
        events: ['ignore'],
      })
    ).toBeNull()
    expect(
      commerceTriggerExtractFilter({
        events: ['ignore'],
        filter: { left: '$eventTypes', op: '$exists' },
      })
    ).toEqual({ left: '$eventTypes', op: '$exists' })
  })

  it('commerceTriggerExtractFilter returns null for invalid filter shapes', () => {
    // missing left
    expect(
      commerceTriggerExtractFilter({
        filter: { op: '$eq', right: 'x' },
      })
    ).toBeNull()

    // empty left
    expect(
      commerceTriggerExtractFilter({
        filter: { left: '', op: '$eq', right: 'x' },
      })
    ).toBeNull()

    // unknown operator
    expect(
      commerceTriggerExtractFilter({
        filter: { left: 'cart.site', op: '$unknown', right: 'x' },
      })
    ).toBeNull()

    // $in with empty array
    expect(
      commerceTriggerExtractFilter({
        filter: { left: 'cart.site', op: '$in', right: [] },
      })
    ).toBeNull()

    // $in right is not an array
    expect(
      commerceTriggerExtractFilter({
        filter: { left: 'cart.site', op: '$in', right: 'scalar' },
      })
    ).toBeNull()

    // compound with empty conditions array
    expect(
      commerceTriggerExtractFilter({
        filter: { op: '$and', conditions: [] },
      })
    ).toBeNull()

    // compound with invalid condition inside
    expect(
      commerceTriggerExtractFilter({
        filter: { op: '$and', conditions: [{ op: '$eq', right: 'x' }] },
      })
    ).toBeNull()

    // filter is not an object
    expect(
      commerceTriggerExtractFilter({
        filter: 'not-an-object',
      })
    ).toBeNull()
  })

  it('mergeCommerceTriggerPersistedConfig combines events array and serialized filter', () => {
    expect(
      mergeCommerceTriggerPersistedConfig(['a'], {
        left: 'cart.siteCode',
        op: '$eq',
        right: 'DE',
      })
    ).toEqual({
      events: ['a'],
      filter: {
        left: 'cart.siteCode',
        op: '$eq',
        right: 'DE',
      },
    })
  })

  it('mergeCommerceTriggerPersistedConfig omits filter when null', () => {
    expect(mergeCommerceTriggerPersistedConfig(['a', 'b'], null)).toEqual({
      events: ['a', 'b'],
    })
  })

  it('mergeCommerceTriggerPersistedConfig merges event types in filter leaf with standalone events selection', () => {
    expect(
      mergeCommerceTriggerPersistedConfig(['cart-a'], {
        left: '$eventTypes',
        op: '$in',
        right: ['a'],
      })
    ).toEqual({
      events: ['cart-a'],
      filter: {
        left: '$eventTypes',
        op: '$in',
        right: ['a'],
      },
    })
  })

  it('buildAgentCommerceFilterDsl does not mutate input array', () => {
    const arr = ['z']
    const dsl = buildAgentCommerceFilterDsl('$eventTypes', 'in', arr)
    arr.push('mutated')
    expect(dsl.right).toEqual(['z'])
  })

  it('rejects $in / $notIn with an empty array', () => {
    const inResult = parseAgentCommerceFilterDsl({
      left: '$eventTypes',
      op: '$in',
      right: [],
    })
    expect(inResult.dsl).toBeNull()
    expect(inResult.error).toBe(
      COMMERCE_FILTER_PARSE_I18N_KEYS.valueListRequired
    )

    const notInResult = parseAgentCommerceFilterDsl({
      left: '$eventTypes',
      op: '$notIn',
      right: [],
    })
    expect(notInResult.dsl).toBeNull()
    expect(notInResult.error).toBe(
      COMMERCE_FILTER_PARSE_I18N_KEYS.valueListRequired
    )
  })

  it('isCommerceFilterValid false for empty in list', () => {
    expect(
      isCommerceFilterValid({
        left: '$eventTypes',
        op: '$in',
        right: [],
      })
    ).toBe(false)
    const invalidEquals = parseAgentCommerceFilterDsl({
      left: '$eventTypes',
      op: '$eq',
      right: '',
    })
    expect(invalidEquals.dsl).toBeNull()
    expect(invalidEquals.error).toBe(
      COMMERCE_FILTER_PARSE_I18N_KEYS.scalarRequired
    )
  })

  it('stringifyFilterDsl omits right when undefined', () => {
    const s = stringifyFilterDsl({ left: '$eventTypes', op: '$exists' })
    expect(JSON.parse(s)).toEqual({ left: '$eventTypes', op: '$exists' })
  })

  it('defaultCommerceFilterDsl returns payload-oriented defaults', () => {
    expect(defaultCommerceFilterDsl()).toEqual({
      left: '',
      op: '$ne',
      right: '',
    })
  })

  it('parses payload path compares', () => {
    const { dsl, error } = parseAgentCommerceFilterDsl({
      left: 'cart.siteCode',
      op: '$ne',
      right: 'DE',
    })
    expect(error).toBeUndefined()
    expect(dsl).toEqual({
      left: 'cart.siteCode',
      op: '$ne',
      right: 'DE',
    })
  })

  it('parses compound $and', () => {
    const compound = {
      op: '$and',
      conditions: [
        { left: 'cart.siteCode', op: '$ne', right: 'DE' },
        { left: 'order.status', op: '$eq', right: 'open' },
      ],
    }
    const { dsl, error } = parseAgentCommerceFilterDsl(compound)
    expect(error).toBeUndefined()
    expect(dsl).toEqual(compound)
    expect(isCommerceFilterValid(dsl!)).toBe(true)
  })

  it('composeConditions collapses single leaf', () => {
    const leaf = defaultCommerceFilterDsl()
    const one = composeConditions('$or', [leaf])
    expect(one && 'left' in one).toBe(true)
    const multi = composeConditions('$or', [leaf, { ...leaf, left: 'a' }])
    expect(multi).not.toBeNull()
    expect(isCompoundFilter(multi as AgentCommerceFilterDsl)).toBe(true)
    expect((multi as AgentCommerceCompoundDsl).op).toBe('$or')
  })

  it('rejects compound with invalid leaf child', () => {
    const { dsl, error } = parseAgentCommerceFilterDsl({
      op: '$and',
      conditions: [{ left: '', op: '$eq', right: '1' }],
    })
    expect(dsl).toBeNull()
    expect(error).toBe(COMMERCE_FILTER_PARSE_I18N_KEYS.fieldLeftRequired)
  })

  it('extractFilterDslJsonFromAgentMessage parses plain JSON object', () => {
    const raw = '{"left":"cart.siteCode","op":"$eq","right":"main"}'
    const r = extractFilterDslJsonFromAgentMessage(raw)
    expect(r).not.toBeNull()
    expect(r?.rawSnippet).toBe(raw)
    expect(parseAgentCommerceFilterDsl(r!.parsed).dsl).toEqual({
      left: 'cart.siteCode',
      op: '$eq',
      right: 'main',
    })
  })

  it('extractFilterDslJsonFromAgentMessage returns null unless message is a single JSON object', () => {
    expect(
      extractFilterDslJsonFromAgentMessage(
        'Sure.\n```json\n{"left":"x","op":"$exists"}\n```'
      )
    ).toBeNull()
    expect(
      extractFilterDslJsonFromAgentMessage(
        'Use this filter: {"op":"$and","conditions":[{"left":"a","op":"$eq","right":"1"},{"left":"b","op":"$eq","right":"2"}]} thanks'
      )
    ).toBeNull()
  })

  it('parses nested $and with $or leaf group and boolean right', () => {
    const compound = {
      op: '$and',
      conditions: [
        {
          op: '$or',
          conditions: [
            { left: 'siteCode', op: '$eq', right: 'main' },
            { left: 'siteCode', op: '$eq', right: 'de' },
          ],
        },
        { left: 'published', op: '$eq', right: true },
      ],
    }
    const { dsl, error } = parseAgentCommerceFilterDsl(compound)
    expect(error).toBeUndefined()
    expect(dsl).toEqual(compound)
    expect(isCommerceFilterValid(dsl!)).toBe(true)
  })

  it('extractFilterDslJsonFromAgentMessage unwraps JSON string containing filter object', () => {
    const inner =
      '{"op":"$and","conditions":[{"left":"siteCode","op":"$eq","right":"main"}]}'
    const doubleEncoded = JSON.stringify(inner)
    const r = extractFilterDslJsonFromAgentMessage(doubleEncoded)
    expect(r).not.toBeNull()
    expect(parseAgentCommerceFilterDsl(r!.parsed).dsl).toEqual({
      op: '$and',
      conditions: [{ left: 'siteCode', op: '$eq', right: 'main' }],
    })
  })

  it('extractFilterDslJsonFromAgentMessage parses compound $and matching agent output', () => {
    const reply =
      '{"op":"$and","conditions":[{"left":"order.currency","op":"$eq","right":"EUR"},{"left":"cart.siteCode","op":"$in","right":["main","outlet"]}]}'
    const r = extractFilterDslJsonFromAgentMessage(reply)
    expect(r).not.toBeNull()
    expect(
      isCommerceFilterValid(parseAgentCommerceFilterDsl(r!.parsed).dsl!)
    ).toBe(true)
  })

  it('extractFilterDslJsonFromAgentMessage returns null for no JSON object', () => {
    expect(extractFilterDslJsonFromAgentMessage('')).toBeNull()
    expect(extractFilterDslJsonFromAgentMessage('not json')).toBeNull()
    expect(extractFilterDslJsonFromAgentMessage('[]')).toBeNull()
  })
})
