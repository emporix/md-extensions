/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { TEST_LABELS } from '../test/changelogTestKit'
import ChangelogPaginator from './ChangelogPaginator'

// The real component-library Dropdown, not a stub: its combobox is a div, so only its own label gives it a name
describe('ChangelogPaginator with the component-library Dropdown', () => {
  afterEach(cleanup)

  it('names the rows-per-page combobox', () => {
    render(
      <ChangelogPaginator
        nextCursor="n1"
        prevCursor="p1"
        rows={10}
        rowsPerPageOptions={[10, 25, 50]}
        isLoading={false}
        labels={TEST_LABELS}
        onNext={vi.fn()}
        onPrevious={vi.fn()}
        onRowsChange={vi.fn()}
      />
    )

    expect(screen.getByRole('combobox', { name: 'Rows per page' })).toBeTruthy()
  })
})
