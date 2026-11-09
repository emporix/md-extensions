/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import i18n from '../../translations/i18n'
import SidePanel from './SidePanel'

describe('SidePanel', () => {
  afterEach(async () => {
    cleanup()
    await i18n.changeLanguage('en')
  })

  it('labels its close controls in the UI language', async () => {
    await i18n.changeLanguage('de')
    render(
      <SidePanel visible onHide={vi.fn()} ariaLabel="Spalten">
        <p>content</p>
      </SidePanel>
    )

    expect(screen.getAllByRole('button', { name: 'Schließen' })).toHaveLength(2)
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull()
  })

  it('labels its close controls in English', async () => {
    await i18n.changeLanguage('en')
    render(
      <SidePanel visible onHide={vi.fn()} ariaLabel="Columns">
        <p>content</p>
      </SidePanel>
    )

    expect(screen.getAllByRole('button', { name: 'Close' })).toHaveLength(2)
  })
})
