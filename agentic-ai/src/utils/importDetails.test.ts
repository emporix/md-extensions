import { describe, expect, it } from 'vitest'
import type { TFunction } from 'i18next'
import {
  formatImportDetails,
  getImportStateClassName,
  getImportStateLabel,
  getImportStateSeverity,
  hasImportDetails,
  hasImportFailures,
  shouldShowLegacyTokenNote,
} from './importDetails'
import { ImportDetails } from '../types/Job'

const translations: Record<string, string> = {
  import_details_MISSING_TOKEN: 'Token "{{objectId}}" was not found.',
  import_details_MISSING_FUNCTION:
    'Function "{{objectId}}" for tool "{{objectName}}" was not found. Imported tool has been disabled.',
  import_details_IMPORT_FAILED: 'Import failed: {{message}}',
  enabled: 'Enabled',
  disabled: 'Disabled',
  TO_CREATE: 'To be created',
  exists: 'Exists',
  failed: 'Failed',
}

const interpolatingT = ((key: string, options?: Record<string, string>) => {
  const template = translations[key]
  if (!template) {
    return key
  }
  return template.replace(
    /\{\{(\w+)\}\}/g,
    (_, name: string) => options?.[name] ?? ''
  )
}) as unknown as TFunction

describe('hasImportDetails', () => {
  it('returns false for missing or empty details', () => {
    expect(hasImportDetails({})).toBe(false)
    expect(hasImportDetails({ details: [] })).toBe(false)
  })

  it('returns true when details exist', () => {
    expect(
      hasImportDetails({
        details: [{ code: 'MISSING_TOKEN', objectId: 'tok-1' }],
      })
    ).toBe(true)
  })
})

describe('shouldShowLegacyTokenNote', () => {
  it('shows note for old jobs with disabled entities and no details', () => {
    expect(
      shouldShowLegacyTokenNote([{ state: 'DISABLED' }, { state: 'ENABLED' }])
    ).toBe(true)
  })

  it('hides note when any entity has details', () => {
    expect(
      shouldShowLegacyTokenNote([
        {
          state: 'DISABLED',
          details: [{ code: 'AGENT_IMPORTED_DISABLED' }],
        },
      ])
    ).toBe(false)
  })

  it('hides note when there are no enabled or disabled entities', () => {
    expect(
      shouldShowLegacyTokenNote([{ state: 'TO_CREATE' }, { state: 'EXISTS' }])
    ).toBe(false)
  })
})

describe('hasImportFailures', () => {
  it('returns true when any item failed', () => {
    expect(
      hasImportFailures([
        { id: '1', name: 'Agent', state: 'ENABLED' },
        { id: '2', name: 'Tool', state: 'FAILED' },
      ])
    ).toBe(true)
  })

  it('returns false when no items failed', () => {
    expect(
      hasImportFailures([{ id: '1', name: 'Agent', state: 'ENABLED' }])
    ).toBe(false)
  })
})

describe('formatImportDetails', () => {
  it('interpolates localized copy from code', () => {
    const details: ImportDetails = {
      code: 'MISSING_TOKEN',
      objectId: 'openai-token',
      message: 'fallback',
    }
    expect(formatImportDetails(interpolatingT, details)).toBe(
      'Token "openai-token" was not found.'
    )
  })

  it('interpolates message for import failed', () => {
    expect(
      formatImportDetails(interpolatingT, {
        code: 'IMPORT_FAILED',
        message: 'Upsert conflict',
      })
    ).toBe('Import failed: Upsert conflict')
  })
})

describe('getImportStateLabel', () => {
  it('returns translated labels for known states', () => {
    expect(getImportStateLabel(interpolatingT, 'ENABLED')).toBe('Enabled')
    expect(getImportStateLabel(interpolatingT, 'FAILED')).toBe('Failed')
  })
})

describe('getImportStateClassName', () => {
  it('maps states to css classes', () => {
    expect(getImportStateClassName('TO_CREATE')).toBe('state-to-create')
    expect(getImportStateClassName('FAILED')).toBe('state-failed')
  })
})

describe('getImportStateSeverity', () => {
  it('maps states to badge severities', () => {
    expect(getImportStateSeverity('ENABLED')).toBe('success')
    expect(getImportStateSeverity('FAILED')).toBe('danger')
  })
})
