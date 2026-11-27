/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import MixinsFormInput from './MixinsFormInput'
import { MixinsFormItem, MixinsFormItemType } from './helpers'

// The number fields do not read localized values; this hook needs the
// configuration and dashboard providers, which are not part of this test.
vi.mock('../../hooks/useLocalizedValue', () => ({
  useLocalizedValue: () => ({ getContentLangValue: () => '--' }),
}))

afterEach(() => {
  cleanup()
})

const numberItem = (type: MixinsFormItemType): MixinsFormItem => ({
  name: 'Weight',
  key: 'weight',
  type,
  isRequired: false,
})

/** Holds the field value like the mixins form does. */
const Field = ({
  type,
  onChange,
}: {
  readonly type: MixinsFormItemType
  readonly onChange: (key: string, value: unknown) => void
}) => {
  const [value, setValue] = useState<number | null>(null)
  return (
    <MixinsFormInput
      item={numberItem(type)}
      value={value}
      onInputChange={(key, next) => {
        onChange(key, next)
        setValue(next as number | null)
      }}
    />
  )
}

const typeNumber = (input: HTMLInputElement, text: string) => {
  input.setSelectionRange(0, input.value.length)
  fireEvent.paste(input, { clipboardData: { getData: () => text } })
}

const typeLoneMinus = (input: HTMLInputElement) => {
  input.focus()
  fireEvent.keyPress(input, {
    key: '-',
    code: 'Minus',
    keyCode: 45,
    which: 45,
    charCode: 45,
  })
  fireEvent.blur(input)
}

describe('MixinsFormInput number fields', () => {
  it.each([
    [MixinsFormItemType.integer, '42', 42],
    [MixinsFormItemType.decimal, '12.5', 12.5],
  ])('reports the number typed into a %s field', (type, text, expected) => {
    const onChange = vi.fn()
    render(<Field type={type} onChange={onChange} />)
    const input = screen.getByRole('spinbutton') as HTMLInputElement

    typeNumber(input, text)

    expect(onChange).toHaveBeenLastCalledWith('weight', expected)
  })

  it.each([MixinsFormItemType.integer, MixinsFormItemType.decimal])(
    'never reports a lone minus sign from a %s field',
    (type) => {
      const onChange = vi.fn()
      render(<Field type={type} onChange={onChange} />)
      const input = screen.getByRole('spinbutton') as HTMLInputElement

      typeLoneMinus(input)

      const reported = onChange.mock.calls.map(([, value]) => value)
      expect(reported).not.toContain('-')
      expect(
        reported.every((value) => value === null || typeof value === 'number')
      ).toBe(true)
    }
  )
})
