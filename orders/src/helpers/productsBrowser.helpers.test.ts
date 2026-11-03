import { describe, expect, it } from 'vitest'
import type { CategoryTree } from '@emporix/api-calls'
import type Localized from '../models/Localized.model'
import { ProductType } from '../models/Order.model'
import type { Product } from '../models/Product.model'
import {
  categoryLabel,
  toCategoryNodes,
  toProductRow,
  withCategoryScope,
} from './productsBrowser.helpers'

const english = (value: Localized | string | undefined) =>
  typeof value === 'string' ? value : (value?.en ?? '')

describe('withCategoryScope', () => {
  const filters = { code: { value: 'red', matchMode: 'startsWith' } }

  it('adds the categories to the filters', () => {
    expect(withCategoryScope(filters, ['shoes', 'boots'])).toEqual({
      code: { value: 'red', matchMode: 'startsWith' },
      categoryIds: { value: ['shoes', 'boots'], matchMode: 'in' },
    })
  })

  it('works without other filters', () => {
    expect(withCategoryScope(undefined, ['shoes'])).toEqual({
      categoryIds: { value: ['shoes'], matchMode: 'in' },
    })
  })

  it('returns the filters as they are without categories', () => {
    expect(withCategoryScope(filters, [])).toBe(filters)
  })

  it('does not change the given filters', () => {
    const given = { code: { value: 'red', matchMode: 'startsWith' } }

    withCategoryScope(given, ['shoes'])

    expect(given).toEqual({ code: { value: 'red', matchMode: 'startsWith' } })
  })
})

const category = (
  id: string,
  position: number,
  subcategories?: CategoryTree[],
  localizedName: Localized = { en: id }
): CategoryTree => ({
  id,
  position,
  published: true,
  localizedName,
  subcategories,
})

describe('categoryLabel', () => {
  it('uses the name in the content language', () => {
    expect(
      categoryLabel(category('c-1', 1, [], { en: 'Shoes', de: 'Schuhe' }), 'de')
    ).toBe('Schuhe')
  })

  it('matches the content language in any letter case', () => {
    expect(
      categoryLabel(category('c-1', 1, [], { 'de-AT': 'Schuhe' }), 'de-at')
    ).toBe('Schuhe')
  })

  it('tags another name with its language when the content language has none', () => {
    expect(
      categoryLabel(category('c-1', 1, [], { en: '', de: 'Schuhe' }), 'en')
    ).toBe('Schuhe(de)')
    expect(categoryLabel(category('c-1', 1, [], { en: 'Shoes' }), 'fr')).toBe(
      'Shoes(en)'
    )
  })

  it('falls back to the id when the category has no name', () => {
    expect(categoryLabel(category('c-1', 1, [], { en: '' }), 'en')).toBe('c-1')
    expect(categoryLabel(category('c-1', 1, [], {}), 'en')).toBe('c-1')
  })
})

describe('toCategoryNodes', () => {
  it('maps the trees with names and children, ordered by position', () => {
    const nodes = toCategoryNodes(
      [
        category('clothes', 2),
        category('footwear', 1, [
          category('hiking', 2),
          category('running', 1),
        ]),
      ],
      'en'
    )

    expect(nodes.map((node) => node.key)).toEqual(['footwear', 'clothes'])
    expect(nodes[0].label).toBe('footwear')
    expect(nodes[0].published).toBe(true)
    expect(nodes[0].data).toEqual(expect.objectContaining({ id: 'footwear' }))
    expect(nodes[0].children?.map((node) => node.key)).toEqual([
      'running',
      'hiking',
    ])
    expect(nodes[1].children).toBeUndefined()
  })

  it('labels the nodes of every level in the content language', () => {
    const nodes = toCategoryNodes(
      [
        category('footwear', 1, [category('running', 1, [], { en: 'Run' })], {
          en: 'Footwear',
          de: 'Schuhe',
        }),
      ],
      'de'
    )

    expect(nodes[0].label).toBe('Schuhe')
    expect(nodes[0].children?.[0].label).toBe('Run(en)')
  })

  it('passes the published status of every level for the status dot', () => {
    const nodes = toCategoryNodes(
      [
        category('footwear', 1, [
          { ...category('archive', 1), published: false },
        ]),
      ],
      'en'
    )

    expect(nodes[0].published).toBe(true)
    expect(nodes[0].children?.[0].published).toBe(false)
  })

  it('does not change the given trees', () => {
    const trees = [category('b', 2), category('a', 1)]
    const copy = JSON.parse(JSON.stringify(trees))

    toCategoryNodes(trees, 'en')

    expect(trees).toEqual(copy)
  })
})

describe('toProductRow', () => {
  const product: Product = {
    id: 'shoe-1',
    code: 'SHOE-1',
    name: { en: 'Running shoe', de: 'Laufschuh' },
    productType: ProductType.basic,
    media: [{ url: 'https://res.cloudinary.com/x/upload/shoe.png' }],
  }

  it('maps a product to a row with a sized thumbnail', () => {
    expect(toProductRow(product, english)).toEqual({
      id: 'shoe-1',
      code: 'SHOE-1',
      name: 'Running shoe',
      imageUrl:
        'https://res.cloudinary.com/x/upload/c_pad,q_auto,f_auto,dpr_1,h_32,w_32/shoe.png',
      productType: 'BASIC',
      product,
    })
  })

  it('has no image for a product without media', () => {
    expect(toProductRow({ ...product, media: [] }, english).imageUrl).toBeNull()
  })

  it('shows the first image when other media come first', () => {
    const media = [
      {
        url: 'https://cdn.example.com/manual.pdf',
        contentType: 'application/pdf',
      },
      { url: 'https://cdn.example.com/shoe.png', contentType: 'image/png' },
    ]

    expect(toProductRow({ ...product, media }, english).imageUrl).toBe(
      'https://cdn.example.com/shoe.png'
    )
  })

  it('has no image when the media hold no image', () => {
    const media = [
      { url: 'https://cdn.example.com/clip.mp4', contentType: 'video/mp4' },
    ]

    expect(toProductRow({ ...product, media }, english).imageUrl).toBeNull()
  })
})
