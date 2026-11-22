/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import PercentageInput from './PercentageInput'

afterEach(() => {
  cleanup()
})

/** Keeps the reported value, like the sale price form does. */
const Controlled = ({
  onValue,
}: {
  readonly onValue: (value: number | null) => void
}) => {
  const [value, setValue] = useState(0)
  return (
    <PercentageInput
      value={value}
      onChange={(event) => {
        onValue(event.value)
        setValue(event.value ?? 0)
      }}
    />
  )
}

describe('PercentageInput', () => {
  it('reports at most 100 when a larger percentage is entered', () => {
    const onValue = vi.fn()
    render(<Controlled onValue={onValue} />)
    const input = screen.getByRole('spinbutton') as HTMLInputElement

    input.setSelectionRange(0, input.value.length)
    fireEvent.paste(input, { clipboardData: { getData: () => '150' } })

    expect(onValue).toHaveBeenLastCalledWith(100)
    expect(input.value).toBe('%100')
  })
})
