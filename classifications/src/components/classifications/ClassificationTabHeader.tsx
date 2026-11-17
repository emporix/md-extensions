import { useTranslation } from 'react-i18next'
import { useClassificationVersionData } from '../../context/ClassificationVersion.provider'

/**
 * Label of the Classification tab. CL `TabItem.label` is a string, so MD's
 * orange `!` corner badge (`ClassificationTabHeader` + `VersionBadge`) for an
 * outdated schema becomes a ` (!)` suffix, as in the categories remote's
 * classification mixins tab.
 */
export const useClassificationTabHeader = () => {
  const { t } = useTranslation()
  const { hasSchemaVersions } = useClassificationVersionData()
  const label = t('classifications.tabs.classification')

  return hasSchemaVersions ? `${label} (!)` : label
}
