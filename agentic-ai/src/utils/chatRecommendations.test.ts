import { describe, expect, it } from 'vitest'
import {
  CHAT_RECOMMENDATION_LIMIT,
  buildRecommendationMessage,
  parseChatRecommendations,
  selectCommerceEventSchemas,
} from './chatRecommendations'

const payload = (count: number, hasRecommendations = true) =>
  JSON.stringify({
    hasRecommendations,
    recommendations: Array.from({ length: count }, (_, index) => ({
      icon: '📈',
      label: `Label ${index + 1}`,
      prompt: `Prompt ${index + 1}`,
    })),
  })

describe('parseChatRecommendations', () => {
  it('returns recommendations from a structured reply', () => {
    expect(parseChatRecommendations(payload(2))).toEqual([
      { icon: '📈', label: 'Label 1', prompt: 'Prompt 1' },
      { icon: '📈', label: 'Label 2', prompt: 'Prompt 2' },
    ])
  })

  it('keeps at most five recommendations', () => {
    expect(parseChatRecommendations(payload(8))).toHaveLength(
      CHAT_RECOMMENDATION_LIMIT
    )
  })

  it('returns nothing when the agent has no recommendations', () => {
    expect(parseChatRecommendations(payload(2, false))).toEqual([])
  })

  it('returns nothing for invalid JSON', () => {
    expect(parseChatRecommendations('not json')).toEqual([])
  })

  it('strips a markdown fence and skips incomplete items', () => {
    const raw = [
      '```json',
      JSON.stringify({
        hasRecommendations: true,
        recommendations: [
          { icon: ' ', label: '  Keep  ', prompt: ' Do this ' },
          { label: '', prompt: 'missing label' },
          { label: 'No prompt', prompt: '   ' },
        ],
      }),
      '```',
    ].join('\n')

    expect(parseChatRecommendations(raw)).toEqual([
      { icon: '', label: 'Keep', prompt: 'Do this' },
    ])
  })
})

describe('buildRecommendationMessage', () => {
  it('includes the target agent and omits chat history', () => {
    const text = buildRecommendationMessage({
      agentName: 'Orders',
      agentDescription: 'Looks up orders',
      agentPrompt: 'Use the orders tool. Reply with JSON only.',
      templatePrompt: 'You are a commerce assistant.',
    })

    expect(text).toContain('Target agent name: Orders')
    expect(text).toContain('Target agent description: Looks up orders')
    expect(text).toContain(
      'Target agent prompt:\nUse the orders tool. Reply with JSON only.'
    )
    expect(text).toContain(
      'Target agent template prompt:\nYou are a commerce assistant.'
    )
    expect(text).not.toContain('Recent conversation:')
  })

  it('sends the agent prompt without clipping it', () => {
    const agentPrompt = 'x'.repeat(2000)
    const text = buildRecommendationMessage({
      agentName: 'Orders',
      agentDescription: 'Looks up orders',
      agentPrompt,
    })

    expect(text).toContain(agentPrompt)
  })

  it('uses placeholders when the agent fields are blank', () => {
    const text = buildRecommendationMessage({
      agentName: '   ',
      agentDescription: '',
      agentPrompt: '',
    })

    expect(text).toContain('Target agent name: (unknown)')
    expect(text).toContain('Target agent description: (none)')
    expect(text).toContain('Target agent prompt:\n(none)')
    expect(text).not.toContain('Target agent template prompt:')
    expect(text).not.toContain('Recent conversation:')
  })

  it('includes schemas for the selected commerce events only', () => {
    const schema = { type: 'object', properties: { id: { type: 'string' } } }
    const text = buildRecommendationMessage({
      agentName: 'Orders',
      agentDescription: 'Reacts to orders',
      agentPrompt: 'Handle order events.',
      eventSchemas: [{ eventType: 'order.created', schema }],
    })

    expect(text).toContain('Commerce event subscriptions:')
    expect(text).toContain('Event: order.created')
    expect(text).toContain(JSON.stringify(schema))
  })
})

describe('selectCommerceEventSchemas', () => {
  const subscriptions = [
    {
      event: {
        type: 'order.created',
        eventSchema: { type: 'object' },
      },
    },
    {
      event: {
        type: 'product.updated',
        eventSchema: {
          type: 'object',
          properties: { sku: { type: 'string' } },
        },
      },
    },
    { event: { type: 'customer.created' } },
  ]

  it('keeps schemas for the agent events', () => {
    expect(
      selectCommerceEventSchemas(subscriptions, [
        'order.created',
        'product.updated',
      ])
    ).toEqual([
      { eventType: 'order.created', schema: { type: 'object' } },
      {
        eventType: 'product.updated',
        schema: { type: 'object', properties: { sku: { type: 'string' } } },
      },
    ])
  })

  it('returns nothing when the agent has no commerce events', () => {
    expect(selectCommerceEventSchemas(subscriptions, [])).toEqual([])
  })

  it('matches ai-service event ids to webhook types by group and action', () => {
    const catalogSchema = { id: 'String' }
    const priceModelSchema = { id: 'String', includesTax: 'Boolean' }
    const orderStatusSchema = { status: 'String' }
    const result = selectCommerceEventSchemas(
      [
        {
          event: {
            type: 'catalog.created',
            group: { en: 'Catalog' },
            eventSchema: catalogSchema,
          },
        },
        {
          event: {
            type: 'price-model.updated',
            group: { en: 'Price' },
            eventSchema: priceModelSchema,
          },
        },
        {
          event: {
            type: 'price.deleted',
            group: { en: 'Price' },
            eventSchema: { id: 'String' },
          },
        },
        {
          event: {
            type: 'order.status-changed',
            group: { en: 'Order' },
            eventSchema: orderStatusSchema,
          },
        },
        {
          event: {
            type: 'category.updated',
            group: { en: 'Category Tree' },
            eventSchema: { id: 'String' },
          },
        },
        {
          event: {
            type: 'return.created',
            group: { en: 'Return' },
            eventSchema: { id: 'String' },
          },
        },
        {
          event: {
            type: 'agent.job-finished',
            group: { en: 'Ai' },
            eventSchema: { jobId: 'String' },
          },
        },
      ],
      [
        'catalog.catalog-created',
        'price-v2.price-model-change',
        'price-v2.price-v2-deleted',
        'order.order-status-webhook-updated',
        'category-tree.category-tree-category-updated',
        'returns.return-created',
      ]
    )

    expect(result.map((item) => item.eventType)).toEqual([
      'catalog.created',
      'price-model.updated',
      'price.deleted',
      'order.status-changed',
      'category.updated',
      'return.created',
    ])
    expect(result[0]?.schema).toBe(catalogSchema)
    expect(result[1]?.schema).toBe(priceModelSchema)
    expect(result[3]?.schema).toBe(orderStatusSchema)
  })
})
