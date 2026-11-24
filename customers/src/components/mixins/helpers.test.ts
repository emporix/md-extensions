import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  applyDefaultsOnEmptyFields,
  createForm,
  defaultValueForMixinItem,
  MixinsFormItem,
  MixinsFormItemType,
} from './helpers'

const item = (
  overrides: Partial<MixinsFormItem> & Pick<MixinsFormItem, 'key' | 'type'>
): MixinsFormItem => ({
  name: overrides.key,
  isRequired: false,
  ...overrides,
})

describe('createForm', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('prefills date and date-time fields with the current instant', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-17T13:08:00.000Z'))

    const form = createForm([
      item({ key: 'date', type: MixinsFormItemType.date, isRequired: true }),
      item({
        key: 'dateTime',
        type: MixinsFormItemType.dateTime,
        isRequired: true,
      }),
    ])

    expect(form.date).toBe('2026-08-17T13:08:00.000Z')
    expect(form.dateTime).toBe('2026-08-17T13:08:00.000Z')
  })

  it('leaves enum fields without data unset', () => {
    const form = createForm([
      item({
        key: 'size',
        type: MixinsFormItemType.enum,
        enum: ['S', 'M', 'L'],
        isRequired: true,
      }),
    ])

    expect(form.size).toBeUndefined()
  })

  it('leaves text and time fields without data unset', () => {
    const form = createForm([
      item({ key: 'text', type: MixinsFormItemType.text, isRequired: true }),
      item({ key: 'time', type: MixinsFormItemType.time }),
    ])

    expect(form.text).toBeUndefined()
    expect(form.time).toBeUndefined()
  })

  it('keeps empty defaults for localized and boolean-off', () => {
    const form = createForm([
      item({ key: 'advertisement', type: MixinsFormItemType.localized }),
      item({ key: 'boolean', type: MixinsFormItemType.boolean }),
      item({
        key: 'number',
        type: MixinsFormItemType.integer,
        isRequired: true,
      }),
    ])

    expect(form.boolean).toBe(false)
    expect(form.number).toBe(0)
  })
})

describe('enum defaults', () => {
  const sizeItem = item({
    key: 'size',
    type: MixinsFormItemType.enum,
    enum: ['S', 'M', 'L'],
  })

  it('leaves an empty enum out of the save payload', () => {
    const payload = applyDefaultsOnEmptyFields({ size: undefined }, [sizeItem])

    expect(payload).not.toHaveProperty('size')
  })

  it('starts a newly added enum array entry with the first option', () => {
    const arrayItem = item({
      key: 'sizes',
      type: MixinsFormItemType.array,
      arrayType: MixinsFormItemType.enum,
      enum: ['S', 'M', 'L'],
    })

    expect(defaultValueForMixinItem(arrayItem, true)).toBe('S')
  })
})

describe('text defaults', () => {
  const textItem = item({ key: 'text', type: MixinsFormItemType.text })
  const timeItem = item({ key: 'time', type: MixinsFormItemType.time })

  it('leaves empty text and time fields out of the save payload', () => {
    const payload = applyDefaultsOnEmptyFields(
      { text: '', time: undefined, nested: { text: '' } },
      [
        textItem,
        timeItem,
        item({
          key: 'nested',
          type: MixinsFormItemType.object,
          items: [item({ key: 'nested.text', type: MixinsFormItemType.text })],
        }),
      ]
    )

    expect(payload).toEqual({ nested: {} })
  })

  it('starts a newly added text array entry with an empty string', () => {
    const arrayItem = item({
      key: 'texts',
      type: MixinsFormItemType.array,
      arrayType: MixinsFormItemType.text,
    })

    expect(defaultValueForMixinItem(arrayItem, true)).toBe('')
  })
})
