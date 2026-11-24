/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { DataTableColumnFilterElementOptions } from '@emporix/component-library'
import NumberFilterTemplate from './NumberFilterTemplate'

afterEach(() => {
  cleanup()
})

/** Holds the applied filter value, like the companies table does. */
const Filter = ({
  onApply,
}: {
  readonly onApply: (value: unknown) => void
}) => {
  const [value, setValue] = useState<unknown>(null)
  const filterOptions = {
    value,
    index: 0,
    field: 'accountLimit.amount',
    filterModel: {},
    filterCallback: vi.fn(),
    filterApplyCallback: (next: unknown) => {
      onApply(next)
      setValue(next ?? null)
    },
  } as unknown as DataTableColumnFilterElementOptions
  return <NumberFilterTemplate filterOptions={filterOptions} />
}

const typeNumber = (input: HTMLInputElement, text: string) => {
  input.setSelectionRange(0, input.value.length)
  fireEvent.paste(input, { clipboardData: { getData: () => text } })
}

describe('NumberFilterTemplate', () => {
  it('applies the typed number with the equals mode', () => {
    const onApply = vi.fn()
    render(<Filter onApply={onApply} />)
    const input = screen.getByRole('spinbutton') as HTMLInputElement

    typeNumber(input, '150')

    expect(onApply).toHaveBeenLastCalledWith({ value: 150, mode: 'equals' })
  })

  it('removes the filter when the field is cleared', () => {
    const onApply = vi.fn()
    render(<Filter onApply={onApply} />)
    const input = screen.getByRole('spinbutton') as HTMLInputElement
    typeNumber(input, '150')

    input.setSelectionRange(0, input.value.length)
    fireEvent.keyDown(input, {
      key: 'Backspace',
      code: 'Backspace',
      keyCode: 8,
      which: 8,
    })
    fireEvent.blur(input)

    expect(onApply).toHaveBeenLastCalledWith(undefined)
  })

  it('never applies a lone minus sign as the filter value', () => {
    const onApply = vi.fn()
    render(<Filter onApply={onApply} />)
    const input = screen.getByRole('spinbutton') as HTMLInputElement

    input.focus()
    fireEvent.keyPress(input, {
      key: '-',
      code: 'Minus',
      keyCode: 45,
      which: 45,
      charCode: 45,
    })
    fireEvent.blur(input)

    const applied = onApply.mock.calls.map(([value]) => value)
    expect(applied).not.toContainEqual({ value: '-', mode: 'equals' })
    expect(
      applied.every(
        (value) =>
          value === undefined ||
          typeof (value as { value: unknown }).value === 'number'
      )
    ).toBe(true)
  })
})
