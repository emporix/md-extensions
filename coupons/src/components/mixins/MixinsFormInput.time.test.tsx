/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
import MixinsFormInput from './MixinsFormInput'
import { MixinsFormItem, MixinsFormItemType } from './helpers'
import '../../translations/i18n'

const item: MixinsFormItem = {
  name: 'Opening time',
  key: 'opensAt',
  type: MixinsFormItemType.time,
  isRequired: false,
}

const timeInput = () => screen.getByPlaceholderText('HH:mm') as HTMLInputElement

describe('MixinsFormInput — time field', () => {
  afterEach(() => cleanup())

  it('renders the component-library TimePicker, not a native time input', () => {
    render(
      <MixinsFormInput item={item} value="09:30" onInputChange={vi.fn()} />
    )

    expect(timeInput().value).toBe('09:30')
    expect(timeInput().type).toBe('text')
    expect(document.querySelector('input[type="time"]')).toBeNull()
    expect(screen.getByRole('button', { name: 'Choose time' })).toBeTruthy()
  })

  it('emits the picked time as HH:mm', () => {
    const onInputChange = vi.fn()
    render(
      <MixinsFormInput
        item={item}
        value="09:30"
        onInputChange={onInputChange}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Choose time' }))
    const hours = screen.getByRole('listbox', { name: 'Hours' })
    fireEvent.mouseDown(within(hours).getByRole('option', { name: '14' }))

    expect(onInputChange).toHaveBeenCalledWith('opensAt', '14:30')
  })

  it('clears an invalid typed time, as MD did on blur', () => {
    const onInputChange = vi.fn()
    render(
      <MixinsFormInput
        item={item}
        value="09:30"
        onInputChange={onInputChange}
      />
    )

    fireEvent.change(timeInput(), { target: { value: '29:99' } })
    fireEvent.blur(timeInput())

    expect(onInputChange).toHaveBeenCalledWith('opensAt', '')
  })

  it('cannot be opened when the field is read-only', () => {
    render(
      <MixinsFormInput
        item={{ ...item, isReadonly: true }}
        value="09:30"
        onInputChange={vi.fn()}
      />
    )

    expect(
      (screen.getByRole('button', { name: 'Choose time' }) as HTMLButtonElement)
        .disabled
    ).toBe(true)
  })
})
