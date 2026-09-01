import type { TFunction } from 'i18next'
import { ImportSummaryState } from '../types/common'
import { ImportDetails, ImportedItem } from '../types/Job'

const IMPORT_DETAILS_KEY_PREFIX = 'import_details_'
const ENABLEMENT_STATES: ImportSummaryState[] = ['ENABLED', 'DISABLED']

export const hasImportDetails = (
  item: Pick<ImportedItem, 'details'>
): boolean => Array.isArray(item.details) && item.details.length > 0

export const shouldShowLegacyTokenNote = (
  items: Array<Pick<ImportedItem, 'state' | 'details'>>
): boolean => {
  const relevant = items.filter((item) =>
    ENABLEMENT_STATES.includes(item.state)
  )
  if (relevant.length === 0) {
    return false
  }
  return relevant.every((item) => !hasImportDetails(item))
}

export const hasImportFailures = (items: ImportedItem[]): boolean =>
  items.some((item) => item.state === 'FAILED')

export const formatImportDetails = (
  t: TFunction,
  details: ImportDetails
): string =>
  t(`${IMPORT_DETAILS_KEY_PREFIX}${details.code}`, {
    objectId: details.objectId ?? '',
    objectName: details.objectName ?? '',
    message: details.message ?? '',
  })

export const getImportStateLabel = (
  t: TFunction,
  state: ImportSummaryState
): string => {
  switch (state) {
    case 'ENABLED':
      return t('enabled')
    case 'DISABLED':
      return t('disabled')
    case 'TO_CREATE':
      return t('TO_CREATE')
    case 'EXISTS':
      return t('exists')
    case 'FAILED':
      return t('failed')
    default:
      return state
  }
}

export const getImportStateClassName = (state: ImportSummaryState): string =>
  `state-${state.toLowerCase().replace('_', '-')}`

export type ImportStateBadgeSeverity =
  | 'success'
  | 'warning'
  | 'info'
  | 'danger'
  | undefined

export const getImportStateSeverity = (
  state: ImportSummaryState
): ImportStateBadgeSeverity => {
  switch (state) {
    case 'ENABLED':
      return 'success'
    case 'DISABLED':
      return 'warning'
    case 'TO_CREATE':
      return 'info'
    case 'EXISTS':
      return 'success'
    case 'FAILED':
      return 'danger'
    default:
      return undefined
  }
}
