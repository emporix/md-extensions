/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import '../../translations/i18n'
import { CategoryTree } from '../../models/Category.model'
import CategoryDetailsPanel from './CategoryDetailsPanel'

vi.mock('../../context/PermissionsProvider', () => ({
  usePermissions: () => ({ hasPermission: () => true }),
}))

vi.mock('../../hooks/useLocalizedValue', () => ({
  useLocalizedValue: () => ({
    getContentLangValue: (value: Record<string, string> | undefined) =>
      value?.en ?? '--',
  }),
}))

// Name, code, slug and description; not part of what is tested here.
vi.mock('./CategoryDetailsFields', () => ({ default: () => null }))

vi.mock('@emporix/component-library', async () => {
  const actual = await vi.importActual<
    typeof import('@emporix/component-library')
  >('@emporix/component-library')
  return {
    ...actual,
    useToast: () => ({ showError: vi.fn(), showSuccess: vi.fn() }),
  }
})

afterEach(() => {
  cleanup()
})

const category = {
  id: 'shoes',
  code: 'SHO',
  localizedName: { en: 'Shoes' },
  localizedSlug: { en: 'shoes' },
  localizedDescription: {},
  published: true,
  position: 2,
  validity: {},
} as unknown as CategoryTree

const typeNumber = (input: HTMLInputElement, text: string) => {
  input.setSelectionRange(0, input.value.length)
  fireEvent.paste(input, { clipboardData: { getData: () => text } })
}

const renderPanel = (onSave = vi.fn().mockResolvedValue(undefined)) => {
  render(
    <CategoryDetailsPanel
      category={category}
      siblings={[]}
      onSave={onSave}
      onOpenFullEdit={vi.fn()}
      onDelete={vi.fn()}
    />
  )
  const input = within(screen.getByTestId('category-details-panel'))
    .getAllByRole('spinbutton')
    .at(0) as HTMLInputElement
  return { input, onSave }
}

describe('CategoryDetailsPanel position', () => {
  it('saves a typed position', async () => {
    const { input, onSave } = renderPanel()

    typeNumber(input, '7')
    fireEvent.click(screen.getByTestId('category-panel-save'))

    await waitFor(() => expect(onSave).toHaveBeenCalledWith({ position: 7 }))
  })

  // min={0}: the field takes no minus sign, so nothing changes and Save stays off.
  it('does not accept a negative position', () => {
    const { input, onSave } = renderPanel()

    typeNumber(input, '-5')

    expect(input.value).toBe('2')
    expect(
      (screen.getByTestId('category-panel-save') as HTMLButtonElement).disabled
    ).toBe(true)
    expect(onSave).not.toHaveBeenCalled()
  })
})
