/** @vitest-environment jsdom */
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createRef } from 'react'
import MixinsForm from './MixinsForm'
import MixinsAccordionForm, {
  MixinsAccordionFormHandle,
} from './MixinsAccordionForm'
import { MixinsFormItem, MixinsFormItemType } from './helpers'
import { Mixins } from '../../models/Mixins.model'

vi.mock('react-i18next', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-i18next')>()),
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options?.fields ? `${key}: ${options.fields}` : key,
    i18n: { language: 'en' },
  }),
}))
vi.mock('../../hooks/useLocalizedValue', () => ({
  useLocalizedValue: () => ({
    getContentLangValue: (value: unknown) =>
      typeof value === 'string'
        ? value
        : ((value as Record<string, string>)?.en ?? ''),
    getUiLangValue: (value: unknown) =>
      typeof value === 'string'
        ? value
        : ((value as Record<string, string>)?.en ?? ''),
  }),
}))

const SCHEMA_KEY = 'testMixin'
const metadata = { key: SCHEMA_KEY, url: 'https://example.com/test_v1.json' }

const item = (
  overrides: Partial<MixinsFormItem> & Pick<MixinsFormItem, 'key' | 'type'>
): MixinsFormItem => ({
  name: overrides.key,
  isRequired: false,
  ...overrides,
})

const renderForm = (
  items: MixinsFormItem[],
  stored?: Record<string, unknown>
) => {
  const onSave = vi.fn()
  const mixins = (stored ? { [SCHEMA_KEY]: stored } : {}) as Mixins
  render(
    <MixinsForm
      name="Test"
      items={items}
      mixins={mixins}
      metadata={metadata}
      onSave={onSave}
    />
  )
  const saveButton = () =>
    screen.getByRole('button', { name: 'global.save' }) as HTMLButtonElement
  return { onSave, saveButton }
}

const savedPayload = async (
  onSave: ReturnType<typeof vi.fn>,
  saveButton: () => HTMLButtonElement
) => {
  await waitFor(() => expect(saveButton().disabled).toBe(false))
  fireEvent.click(saveButton())
  await waitFor(() => expect(onSave).toHaveBeenCalled())
  return onSave.mock.calls[0][0]
}

afterEach(() => {
  cleanup()
})

const enumItems = [
  item({
    key: 'enumReq',
    name: 'Packaging',
    type: MixinsFormItemType.enum,
    enum: ['BOX', 'PALLET'],
    isRequired: true,
  }),
  item({
    key: 'enumOpt',
    type: MixinsFormItemType.enum,
    enum: ['STANDARD', 'EXPRESS'],
  }),
]

describe('MixinsForm enum fields', () => {
  it('saves an untouched optional enum without its first option', async () => {
    const { onSave, saveButton } = renderForm(enumItems, { enumReq: 'PALLET' })

    const payload = await savedPayload(onSave, saveButton)

    expect(payload).toEqual({ enumReq: 'PALLET' })
    expect(payload).not.toHaveProperty('enumOpt')
  })

  it('blocks Save and names the empty required enum', async () => {
    const { saveButton } = renderForm(enumItems)

    await waitFor(() =>
      expect(
        screen.getByText('mixins.labels.requiredFieldsMissing: Packaging')
      ).toBeTruthy()
    )
    expect(saveButton().disabled).toBe(true)
    expect(screen.getAllByText('global.fieldRequired')).toHaveLength(1)
  })
})

describe('MixinsAccordionForm enum fields', () => {
  const renderAccordion = (stored?: Record<string, unknown>) => {
    const ref = createRef<MixinsAccordionFormHandle>()
    const mixins = (stored ? { [SCHEMA_KEY]: stored } : {}) as Mixins
    render(
      <MixinsAccordionForm
        ref={ref}
        name="Test"
        items={enumItems}
        mixins={mixins}
        metadata={metadata}
      />
    )
    return ref
  }

  it('leaves an untouched optional enum out of the processed data', async () => {
    const ref = renderAccordion({ enumReq: 'PALLET' })

    await waitFor(() => expect(ref.current).toBeTruthy())
    expect(ref.current?.getProcessedData().mixins).toEqual({
      enumReq: 'PALLET',
    })
  })

  it('shows the required error for an empty required enum', async () => {
    renderAccordion()

    await waitFor(() =>
      expect(screen.getAllByText('global.fieldRequired')).toHaveLength(1)
    )
  })
})
