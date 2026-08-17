import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createForm,
  MixinsFormItem,
  MixinsFormItemType,
} from './helpers'

const item = (
  overrides: Partial<MixinsFormItem> &
    Pick<MixinsFormItem, 'key' | 'type'>
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

  it('prefills enum fields with the first option', () => {
    const form = createForm([
      item({
        key: 'size',
        type: MixinsFormItemType.enum,
        enum: ['S', 'M', 'L'],
      }),
    ])

    expect(form.size).toBe('S')
  })

  it('keeps empty defaults for text, time, and boolean-off', () => {
    const form = createForm([
      item({ key: 'advertisement', type: MixinsFormItemType.localized }),
      item({ key: 'boolean', type: MixinsFormItemType.boolean }),
      item({ key: 'time', type: MixinsFormItemType.time, isRequired: true }),
      item({ key: 'number', type: MixinsFormItemType.integer, isRequired: true }),
    ])

    expect(form.boolean).toBe(false)
    expect(form.time).toBe('')
    expect(form.number).toBe(0)
  })
})
