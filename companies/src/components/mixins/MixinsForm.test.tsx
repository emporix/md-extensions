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

vi.mock('../../context/ConfigurationProvider', () => ({
  useConfiguration: () => ({
    languages: [{ id: 'en' }, { id: 'de' }],
    contentLanguage: 'en',
  }),
}))
vi.mock('../../context/Dashboard.context', () => ({
  useDashboardContext: () => ({ tenant: 'tenant', contentLanguage: 'en' }),
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

describe('MixinsForm text fields', () => {
  const textItems = [
    item({ key: 'text', type: MixinsFormItemType.text }),
    item({ key: 'note', type: MixinsFormItemType.text }),
  ]

  it('saves untouched and cleared text fields without an empty string', async () => {
    const { onSave, saveButton } = renderForm(textItems, { note: 'Hello' })
    fireEvent.change(screen.getByDisplayValue('Hello'), {
      target: { value: '' },
    })

    const payload = await savedPayload(onSave, saveButton)

    expect(payload).toEqual({})
  })
})

describe('MixinsForm number and date fields', () => {
  const items = [
    item({
      key: 'weight',
      name: 'Weight',
      type: MixinsFormItemType.decimal,
      isRequired: true,
    }),
    item({ key: 'count', type: MixinsFormItemType.integer }),
    item({
      key: 'releaseDate',
      name: 'Release Date',
      type: MixinsFormItemType.date,
      isRequired: true,
    }),
    item({ key: 'orderedAt', type: MixinsFormItemType.dateTime }),
  ]

  it('shows empty number and date fields empty and saves none of them', async () => {
    const optional = items.map((i) => ({ ...i, isRequired: false }))
    const { onSave, saveButton } = renderForm(optional)

    expect(screen.queryByDisplayValue('0')).toBeNull()
    const payload = await savedPayload(onSave, saveButton)

    expect(payload).toEqual({})
  })

  it('blocks Save and names the empty required number and date', async () => {
    const { saveButton } = renderForm(items)

    await waitFor(() =>
      expect(
        screen.getByText(
          'mixins.labels.requiredFieldsMissing: Release Date, Weight'
        )
      ).toBeTruthy()
    )
    expect(saveButton().disabled).toBe(true)
  })
})

describe('MixinsForm number input without keypress', () => {
  const items = [
    item({ key: 'count', type: MixinsFormItemType.integer }),
    item({ key: 'weight', type: MixinsFormItemType.decimal }),
  ]

  it('marks the form dirty and saves values set by change + blur', async () => {
    const { onSave, saveButton } = renderForm(items)
    const [countInput, weightInput] = screen.getAllByRole('spinbutton')

    // Autofill / drop: the input value changes without any key event.
    fireEvent.change(countInput, { target: { value: '42' } })
    fireEvent.blur(countInput)
    fireEvent.change(weightInput, { target: { value: '1,234.5' } })
    fireEvent.blur(weightInput)

    await waitFor(() =>
      expect(
        (
          screen.getByRole('button', {
            name: 'global.discard',
          }) as HTMLButtonElement
        ).disabled
      ).toBe(false)
    )
    const payload = await savedPayload(onSave, saveButton)

    expect(payload).toEqual({ count: 42, weight: 1234.5 })
  })

  it('saves a pasted number', async () => {
    const { onSave, saveButton } = renderForm(items)
    const [countInput] = screen.getAllByRole('spinbutton')

    fireEvent.focus(countInput)
    fireEvent.paste(countInput, {
      clipboardData: { getData: () => '7' },
    })
    fireEvent.blur(countInput)

    const payload = await savedPayload(onSave, saveButton)

    expect(payload).toEqual({ count: 7 })
  })
})

describe('MixinsForm nullable localized text', () => {
  it.each(['v1', 'v2'] as const)(
    'saves an untouched %s field without null',
    async (version) => {
      const { onSave, saveButton } = renderForm(
        [
          item({
            key: 'locNull',
            type: MixinsFormItemType.localized,
            localizedVersion: version,
          }),
          item({ key: 'text', type: MixinsFormItemType.text }),
        ],
        { text: 'Hello' }
      )

      const payload = await savedPayload(onSave, saveButton)

      expect(payload).toEqual({ text: 'Hello' })
    }
  )

  it.each(['v1', 'v2'] as const)(
    'saves a cleared %s field as an empty value, not null',
    async (version) => {
      const stored =
        version === 'v1' ? [{ language: 'en', value: 'Hi' }] : { en: 'Hi' }
      const { onSave, saveButton } = renderForm(
        [
          item({
            key: 'locNull',
            type: MixinsFormItemType.localized,
            localizedVersion: version,
          }),
        ],
        { locNull: stored }
      )
      fireEvent.change(screen.getByDisplayValue('Hi'), {
        target: { value: '' },
      })

      const payload = await savedPayload(onSave, saveButton)

      expect(payload).toEqual({ locNull: version === 'v1' ? [] : {} })
    }
  )
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

describe('MixinsForm keeps values the user did not edit', () => {
  const rowItems = [
    item({ key: 'label', type: MixinsFormItemType.text }),
    item({ key: 'qty', type: MixinsFormItemType.integer }),
    item({ key: 'active', type: MixinsFormItemType.boolean }),
    item({
      key: 'kind',
      type: MixinsFormItemType.enum,
      enum: ['A', 'B'],
    }),
    item({ key: 'note', type: MixinsFormItemType.text, isNullable: true }),
  ]
  const rowsItem = item({
    key: 'rows',
    type: MixinsFormItemType.array,
    arrayType: MixinsFormItemType.object,
    items: rowItems,
  })

  it('leaves an untouched boolean unset and keeps a stored one', async () => {
    const { onSave, saveButton } = renderForm(
      [
        item({ key: 'fragile', type: MixinsFormItemType.boolean }),
        item({ key: 'stackable', type: MixinsFormItemType.boolean }),
      ],
      { stackable: true }
    )

    const payload = await savedPayload(onSave, saveButton)

    expect(payload).toEqual({ stackable: true })
  })

  it('leaves untouched empty nullable fields out and keeps a stored null', async () => {
    const { onSave, saveButton } = renderForm(
      [
        item({ key: 'nText', type: MixinsFormItemType.text, isNullable: true }),
        item({
          key: 'nCount',
          type: MixinsFormItemType.integer,
          isNullable: true,
        }),
        item({
          key: 'nKind',
          type: MixinsFormItemType.enum,
          enum: ['A', null],
          isNullable: true,
        }),
        item({ key: 'nDate', type: MixinsFormItemType.date, isNullable: true }),
        item({ key: 'kept', type: MixinsFormItemType.text, isNullable: true }),
      ],
      { kept: null }
    )

    const payload = await savedPayload(onSave, saveButton)

    expect(payload).toEqual({ kept: null })
  })

  it('still sends a cleared nullable text as null', async () => {
    const { onSave, saveButton } = renderForm(
      [item({ key: 'nText', type: MixinsFormItemType.text, isNullable: true })],
      { nText: 'Hello' }
    )
    fireEvent.change(screen.getByDisplayValue('Hello'), {
      target: { value: '' },
    })

    const payload = await savedPayload(onSave, saveButton)

    expect(payload).toEqual({ nText: null })
  })

  it('leaves an untouched localized object out and keeps a stored one', async () => {
    const specItem = (key: string) =>
      item({
        key,
        type: MixinsFormItemType.localized,
        localizedVersion: 'v2',
        localizedObject: true,
        items: [item({ key: 'color', type: MixinsFormItemType.text })],
      })
    const { onSave, saveButton } = renderForm(
      [specItem('spec'), specItem('stored')],
      { stored: { en: { color: 'red' } } }
    )

    const payload = await savedPayload(onSave, saveButton)

    expect(payload).toEqual({ stored: { en: { color: 'red' } } })
  })

  it('leaves untouched empty objects and arrays out', async () => {
    const { onSave, saveButton } = renderForm([
      item({
        key: 'dims',
        type: MixinsFormItemType.object,
        items: [
          item({ key: 'dims.w', type: MixinsFormItemType.integer }),
          item({ key: 'dims.b', type: MixinsFormItemType.boolean }),
          item({
            key: 'dims.n',
            type: MixinsFormItemType.text,
            isNullable: true,
          }),
        ],
      }),
      item({
        key: 'tags',
        type: MixinsFormItemType.array,
        arrayType: MixinsFormItemType.text,
      }),
      item({
        key: 'nTags',
        type: MixinsFormItemType.array,
        arrayType: MixinsFormItemType.text,
        isNullable: true,
      }),
      item({
        key: 'nSpec',
        type: MixinsFormItemType.localized,
        localizedVersion: 'v2',
        localizedObject: true,
        isNullable: true,
        items: [item({ key: 'color', type: MixinsFormItemType.text })],
      }),
    ])

    const payload = await savedPayload(onSave, saveButton)

    expect(payload).toEqual({})
  })

  it('keeps fields of existing array entries exactly as stored', async () => {
    const stored = {
      rows: [{ label: 'first' }, { qty: 3, active: true, note: null }],
    }
    const { onSave, saveButton } = renderForm([rowsItem], stored)

    const payload = await savedPayload(onSave, saveButton)

    expect(payload).toEqual(stored)
  })

  it('stays clean on open: Discard disabled, Save sends exactly the stored values', async () => {
    const stored = {
      label: 'kept',
      qty: 0,
      active: false,
      kind: 'B',
      note: null,
      rows: [{ label: 'first' }],
    }
    const { onSave, saveButton } = renderForm(
      [
        ...rowItems,
        item({ key: 'emptyText', type: MixinsFormItemType.text }),
        item({ key: 'emptyQty', type: MixinsFormItemType.integer }),
        item({ key: 'emptyFlag', type: MixinsFormItemType.boolean }),
        item({ key: 'emptyDate', type: MixinsFormItemType.date }),
        rowsItem,
      ],
      stored
    )
    const discardButton = () =>
      screen.getByRole('button', {
        name: 'global.discard',
      }) as HTMLButtonElement

    await waitFor(() => expect(saveButton().disabled).toBe(false))
    expect(discardButton().disabled).toBe(true)
    const payload = await savedPayload(onSave, saveButton)

    expect(payload).toEqual(stored)
  })
})

describe('MixinsAccordionForm keeps values the user did not edit', () => {
  it('leaves untouched booleans and nullable fields out of the processed data', async () => {
    const ref = createRef<MixinsAccordionFormHandle>()
    render(
      <MixinsAccordionForm
        ref={ref}
        name="Test"
        items={[
          item({ key: 'fragile', type: MixinsFormItemType.boolean }),
          item({
            key: 'nText',
            type: MixinsFormItemType.text,
            isNullable: true,
          }),
          item({
            key: 'rows',
            type: MixinsFormItemType.array,
            arrayType: MixinsFormItemType.object,
            items: [
              item({ key: 'label', type: MixinsFormItemType.text }),
              item({ key: 'qty', type: MixinsFormItemType.integer }),
            ],
          }),
        ]}
        mixins={{ [SCHEMA_KEY]: { rows: [{ label: 'x' }] } } as Mixins}
        metadata={metadata}
      />
    )

    await waitFor(() => expect(ref.current).toBeTruthy())
    expect(ref.current?.getProcessedData().mixins).toEqual({
      rows: [{ label: 'x' }],
    })
  })
})

describe('MixinsForm required boolean', () => {
  const flagItem = item({
    key: 'flag',
    name: 'Flag',
    type: MixinsFormItemType.boolean,
    isRequired: true,
  })

  it('blocks Save only while the required boolean is unset', async () => {
    const { saveButton } = renderForm([flagItem])

    await waitFor(() =>
      expect(
        screen.getByText('mixins.labels.requiredFieldsMissing: Flag')
      ).toBeTruthy()
    )
    expect(saveButton().disabled).toBe(true)
  })

  it('allows Save when false is stored', async () => {
    const { onSave, saveButton } = renderForm([flagItem], { flag: false })

    const payload = await savedPayload(onSave, saveButton)

    expect(payload).toEqual({ flag: false })
  })

  it('allows Save when the user chooses false', async () => {
    const { onSave, saveButton } = renderForm([flagItem])
    const toggle = screen.getByRole('switch')
    fireEvent.click(toggle)
    fireEvent.click(toggle)

    const payload = await savedPayload(onSave, saveButton)

    expect(payload).toEqual({ flag: false })
  })
})
