/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { FormProvider, useForm } from 'react-hook-form'
import '../../translations/i18n'
import { CategoryFormFields } from '../../helpers/categoryForm.helpers'
import CategoryPath from './CategoryPath'

vi.mock('../../context/PermissionsProvider', () => ({
  usePermissions: () => ({ hasPermission: () => true }),
}))

// The parent picker is the CL PaginatedSelector, which loads from the API.
vi.mock('../shared/CategoriesSelector', () => ({ default: () => null }))

afterEach(() => {
  cleanup()
})

/** Holds the category form and shows its position, as the add/edit page does. */
const Form = () => {
  const methods = useForm<CategoryFormFields>({
    defaultValues: { position: 2 } as CategoryFormFields,
  })
  return (
    <FormProvider {...methods}>
      <CategoryPath />
      <output data-testid="form-position">
        {String(methods.watch('position'))}
      </output>
    </FormProvider>
  )
}

const typeNumber = (input: HTMLInputElement, text: string) => {
  input.setSelectionRange(0, input.value.length)
  fireEvent.paste(input, { clipboardData: { getData: () => text } })
}

describe('CategoryPath position', () => {
  it('keeps a typed position', () => {
    render(<Form />)
    const input = document.getElementById('position') as HTMLInputElement

    typeNumber(input, '7')

    expect(screen.getByTestId('form-position').textContent).toBe('7')
  })

  // min={0}: the field takes no minus sign, so the position stays as it was.
  it('does not accept a negative position', () => {
    render(<Form />)
    const input = document.getElementById('position') as HTMLInputElement

    typeNumber(input, '-5')

    expect(input.value).toBe('2')
    expect(screen.getByTestId('form-position').textContent).toBe('2')
  })
})
