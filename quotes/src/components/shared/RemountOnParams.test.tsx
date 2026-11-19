/**
 * @vitest-environment jsdom
 */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router'
import RemountOnParams from './RemountOnParams'

/** Stands in for a page whose form state must not survive a route change. */
const Page = () => {
  const [value, setValue] = useState('')
  const navigate = useNavigate()
  return (
    <>
      <input
        data-testid="field"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button onClick={() => navigate('/c1/locations')}>add</button>
      <button onClick={() => navigate('/c2/locations/l1')}>
        other company
      </button>
      <button onClick={() => navigate('/c1/locations/l1?mixin=m1')}>
        mixin
      </button>
    </>
  )
}

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/:companyId/locations/:locationId?"
          element={
            <RemountOnParams>
              <Page />
            </RemountOnParams>
          }
        />
      </Routes>
    </MemoryRouter>
  )

const field = () => screen.getByTestId('field') as HTMLInputElement
const type = (value: string) => fireEvent.change(field(), { target: { value } })
const click = (name: string) =>
  act(() => {
    fireEvent.click(screen.getByRole('button', { name }))
  })

describe('RemountOnParams', () => {
  afterEach(cleanup)

  it('starts fresh when the route switches from edit to add', () => {
    renderAt('/c1/locations/l1')
    type('edited l1')

    click('add')

    expect(field().value).toBe('')
  })

  it('starts fresh for another company with the same location id', () => {
    renderAt('/c1/locations/l1')
    type('edited l1')

    click('other company')

    expect(field().value).toBe('')
  })

  it('keeps the page when only the query string changes', () => {
    renderAt('/c1/locations/l1')
    type('edited l1')

    click('mixin')

    expect(field().value).toBe('edited l1')
  })
})
