import { describe, expect, it, vi } from 'vitest'
import { withOwnOverriddenList } from './variantOwnOverridden.helpers'
import { Product, ProductType } from '../models/Category.model'

const variant = (overridden?: string[] | null): Partial<Product> =>
  ({
    id: 'parent--blue',
    productType: ProductType.variant,
    metadata: { overridden, mixins: { qa: 'qa_v1.json' } },
  }) as Partial<Product>

describe('withOwnOverriddenList', () => {
  it('replaces the null list of the plain read with the own list (Scenario 1)', async () => {
    const read = vi.fn().mockResolvedValue(['description', 'mixins.qa'])

    const result = await withOwnOverriddenList(variant(null), read)

    expect(read).toHaveBeenCalledWith('parent--blue')
    expect(result.metadata?.overridden).toEqual(['description', 'mixins.qa'])
    expect(result.metadata?.mixins).toEqual({ qa: 'qa_v1.json' })
  })

  it('uses the own list even when the plain read returned one', async () => {
    const read = vi.fn().mockResolvedValue(['description'])

    const result = await withOwnOverriddenList(variant(['name']), read)

    expect(result.metadata?.overridden).toEqual(['description'])
  })

  it('rejects when the own list cannot be read, so no PUT is sent', async () => {
    const read = vi.fn().mockRejectedValue(new Error('500'))

    await expect(withOwnOverriddenList(variant(null), read)).rejects.toThrow(
      '500'
    )
  })

  it.each([
    ProductType.basic,
    ProductType.bundle,
    ProductType.parentVariant,
    ProductType.dynamicVariant,
  ])(
    'makes no read and keeps the payload of a %s product (Scenario 6)',
    async (productType) => {
      const read = vi.fn()
      const payload = {
        id: 'product-1',
        productType,
        metadata: { overridden: ['name'] },
      } as Partial<Product>

      const result = await withOwnOverriddenList(payload, read)

      expect(read).not.toHaveBeenCalled()
      expect(result).toBe(payload)
    }
  )

  it('makes no read for a variant without an id', async () => {
    const read = vi.fn()

    await withOwnOverriddenList({ productType: ProductType.variant }, read)

    expect(read).not.toHaveBeenCalled()
  })

  it('does not mutate the payload', async () => {
    const payload = variant(null)
    const snapshot = JSON.parse(JSON.stringify(payload))

    await withOwnOverriddenList(payload, async () => ['description'])

    expect(payload).toEqual(snapshot)
  })
})
