/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import '../../translations/i18n'
import ChangelogPaginator from './ChangelogPaginator'

type DropdownProps = {
  value?: number
  disabled?: boolean
  options?: { label: string; value: number }[]
  onChange: (event: { value: number }) => void
  'data-testid'?: string
}

vi.mock('@emporix/component-library', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@emporix/component-library')>()),
  Dropdown: (props: DropdownProps) => (
    <select
      data-testid={props['data-testid']}
      value={props.value}
      disabled={props.disabled}
      onChange={(e) => props.onChange({ value: Number(e.target.value) })}
    >
      {props.options?.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}))

type Overrides = Partial<Parameters<typeof ChangelogPaginator>[0]>

const mount = (overrides: Overrides = {}) => {
  const handlers = {
    onNext: vi.fn(),
    onPrevious: vi.fn(),
    onRowsChange: vi.fn(),
  }
  const view = render(
    <ChangelogPaginator
      nextCursor="n1"
      prevCursor="p1"
      rows={10}
      rowsPerPageOptions={[10, 25, 50]}
      isLoading={false}
      {...handlers}
      {...overrides}
    />
  )
  return { ...handlers, ...view }
}

const previous = () => screen.getByTestId('changelog-paginator-previous')
const next = () => screen.getByTestId('changelog-paginator-next')

describe('ChangelogPaginator', () => {
  afterEach(cleanup)

  it('enables Previous and Next when both cursors exist', () => {
    mount()

    expect((previous() as HTMLButtonElement).disabled).toBe(false)
    expect((next() as HTMLButtonElement).disabled).toBe(false)
  })

  it.each([
    ['previous', { prevCursor: null }],
    ['next', { nextCursor: null }],
  ] as const)('disables %s without its cursor', (which, overrides) => {
    mount(overrides)

    const button = which === 'previous' ? previous() : next()
    const other = which === 'previous' ? next() : previous()
    expect((button as HTMLButtonElement).disabled).toBe(true)
    expect((other as HTMLButtonElement).disabled).toBe(false)
  })

  it('disables both buttons and the rows while loading', () => {
    mount({ isLoading: true })

    expect((previous() as HTMLButtonElement).disabled).toBe(true)
    expect((next() as HTMLButtonElement).disabled).toBe(true)
    expect(
      (screen.getByTestId('changelog-paginator-rows') as HTMLSelectElement)
        .disabled
    ).toBe(true)
  })

  it('calls back on Previous and Next', () => {
    const { onNext, onPrevious } = mount()

    fireEvent.click(previous())
    fireEvent.click(next())

    expect(onPrevious).toHaveBeenCalledTimes(1)
    expect(onNext).toHaveBeenCalledTimes(1)
  })

  it('labels the buttons Previous and Next', () => {
    mount()

    expect(previous().textContent).toContain('Previous')
    expect(next().textContent).toContain('Next')
  })

  it('hands up the rows per page as a number', () => {
    const { onRowsChange } = mount()

    fireEvent.change(screen.getByTestId('changelog-paginator-rows'), {
      target: { value: '25' },
    })

    expect(onRowsChange).toHaveBeenCalledWith(25)
  })

  it('shows no page numbers or totals', () => {
    const { container } = mount()

    expect(container.textContent).not.toMatch(/\d+\s*(-|–|of)\s*\d+/)
    expect(screen.queryByText(/of \d+/)).toBeNull()
    expect(container.querySelectorAll('button')).toHaveLength(2)
  })
})
