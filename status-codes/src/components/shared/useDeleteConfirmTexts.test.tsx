/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import i18n from '../../translations/i18n'
import { useDeleteConfirmTexts } from './useDeleteConfirmTexts'

const dashboard = vi.hoisted(() => ({ contentLanguage: 'en' }))

vi.mock('../../context/Dashboard.context.tsx', () => ({
  useDashboardContext: () => ({ contentLanguage: dashboard.contentLanguage }),
}))

vi.mock('../../context/ConfigurationProvider', () => ({
  useConfiguration: () => ({ languages: [] }),
}))

describe('useDeleteConfirmTexts', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
  })

  it('names the entity in the current content language', () => {
    const entity = { name: { en: 'Price', de: 'Preis' } }
    dashboard.contentLanguage = 'en'
    const { result, rerender } = renderHook(() =>
      useDeleteConfirmTexts({ pluralsPath: 'quotesReasons', entity })
    )
    expect(result.current.message).toContain('Price')

    dashboard.contentLanguage = 'de'
    rerender()

    expect(result.current.message).toContain('Preis')
  })
})
