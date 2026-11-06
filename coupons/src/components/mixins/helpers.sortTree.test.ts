import { describe, expect, it } from 'vitest'
import { MixinsFormItem, MixinsFormItemType, sortTree } from './helpers'

const item = (
  key: string,
  type: MixinsFormItemType,
  extra: Partial<MixinsFormItem> = {}
): MixinsFormItem => ({
  name: key,
  key,
  type,
  isRequired: false,
  ...extra,
})

describe('sortTree', () => {
  it('shows scalars, then objects, then arrays', () => {
    const sorted = sortTree([
      item('plan', MixinsFormItemType.object, { items: [] }),
      item('arrayLoc', MixinsFormItemType.array, {
        arrayType: MixinsFormItemType.localized,
        localizedObject: true,
      }),
      item('zeta', MixinsFormItemType.text),
      item('localizedObj', MixinsFormItemType.localized, {
        localizedObject: true,
        items: [item('city', MixinsFormItemType.text)],
      }),
      item('alpha', MixinsFormItemType.text),
      item('title', MixinsFormItemType.localized),
      item('arrayObj', MixinsFormItemType.array, {
        arrayType: MixinsFormItemType.object,
      }),
    ])

    expect(sorted?.map((entry) => entry.key)).toEqual([
      'alpha',
      'title',
      'zeta',
      'localizedObj',
      'plan',
      'arrayLoc',
      'arrayObj',
    ])
  })

  it('sorts fields inside an object the same way', () => {
    const sorted = sortTree([
      item('plan', MixinsFormItemType.object, {
        items: [
          item('tags', MixinsFormItemType.array, {
            arrayType: MixinsFormItemType.text,
          }),
          item('note', MixinsFormItemType.text),
          item('nested', MixinsFormItemType.object, { items: [] }),
        ],
      }),
    ])

    expect(sorted?.[0].items?.map((entry) => entry.key)).toEqual([
      'note',
      'nested',
      'tags',
    ])
  })
})
