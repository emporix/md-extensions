/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { DataTableColumnFilterElementOptions } from '@emporix/component-library'
import { parseColumnProps, type DisplayMixin } from './DisplayMixin'
import { SchemaAttributeType } from './Schema.model'

vi.mock('react-i18next', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-i18next')>()),
  useTranslation: () => ({ t: (key: string) => key }),
}))

const label = (value: unknown) => String(value ?? '')

const booleanMixin: DisplayMixin = {
  key: 'productMixin.isFragile',
  label: { en: 'Fragile' },
  type: SchemaAttributeType.BOOLEAN,
}

afterEach(() => {
  cleanup()
})

describe('parseColumnProps for a boolean mixin', () => {
  it('filters with an exact match, not a text CONTAINS', () => {
    const column = parseColumnProps(booleanMixin, label)

    expect(column.filterMatchMode).toBe('in')
    expect(column.filterElement).toBeTypeOf('function')
  })

  it('applies Yes as a one-entry list (exact `key:(true)` query)', () => {
    const column = parseColumnProps(booleanMixin, label)
    const filterApplyCallback = vi.fn()
    const options = {
      value: null,
      filterApplyCallback,
      index: 0,
    } as unknown as DataTableColumnFilterElementOptions
    const filterElement = column.filterElement as (
      o: DataTableColumnFilterElementOptions
    ) => ReactNode
    render(<>{filterElement(options)}</>)

    fireEvent.click(screen.getByRole('combobox'))
    const yes = screen
      .getAllByRole('option', { name: 'global.yes' })
      .find((el) => el.tagName === 'LI')
    fireEvent.mouseDown(yes as HTMLElement)

    expect(filterApplyCallback).toHaveBeenCalledWith(['true'], 0)
  })

  it('keeps CONTAINS for text mixins', () => {
    const column = parseColumnProps(
      { ...booleanMixin, type: SchemaAttributeType.TEXT },
      label
    )

    expect(column.filterMatchMode).toBe('contains')
  })
})
