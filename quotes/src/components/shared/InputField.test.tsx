/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import InputField from './InputField'

describe('InputField', () => {
  afterEach(cleanup)

  it('labels the wrapped control as a group named after the label', () => {
    render(
      <InputField label="Comment">
        <input data-testid="control" />
      </InputField>
    )
    const group = screen.getByRole('group', { name: 'Comment' })
    expect(group.contains(screen.getByTestId('control'))).toBe(true)
  })

  it('names each field of a form by its own label', () => {
    render(
      <>
        <InputField label="Reason">
          <input />
        </InputField>
        <InputField label="Comment">
          <input />
        </InputField>
      </>
    )
    expect(screen.getByRole('group', { name: 'Reason' })).toBeTruthy()
    expect(screen.getByRole('group', { name: 'Comment' })).toBeTruthy()
  })

  it('keeps the label tied to a control that has the given name as its id', () => {
    render(
      <InputField label="Comment" name="comment">
        <input id="comment" />
      </InputField>
    )
    // The group is named by the label too, so ask for the input.
    expect(screen.getByLabelText('Comment', { selector: 'input' })).toBe(
      document.getElementById('comment')
    )
  })

  it('does not put the addon in the name of the group', () => {
    render(
      <InputField label="Comment" addon={<button>Help</button>}>
        <input />
      </InputField>
    )
    expect(screen.getByRole('group', { name: 'Comment' })).toBeTruthy()
  })
})
