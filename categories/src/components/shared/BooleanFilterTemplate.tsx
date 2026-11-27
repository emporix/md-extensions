import { useTranslation } from 'react-i18next'
import {
  Dropdown,
  type DataTableColumnFilterElementOptions,
} from '@emporix/component-library'
import styles from './DropdownFilter.module.scss'

interface BooleanFilterTemplateProps {
  readonly filterOptions: DataTableColumnFilterElementOptions
}

const ALL_VALUE = ''

/**
 * Yes / No filter for a boolean column. The value is applied as a one-entry
 * list so the query is an exact match (`key:(true)`); a text CONTAINS on a
 * boolean (`key:~(true)`) matches nothing.
 */
export const BooleanFilterTemplate = ({
  filterOptions,
}: BooleanFilterTemplateProps) => {
  const { t } = useTranslation()
  const current = Array.isArray(filterOptions.value)
    ? String(filterOptions.value[0] ?? ALL_VALUE)
    : ALL_VALUE
  return (
    <Dropdown
      className={`${styles.filterDropdown} p-column-filter`}
      options={[
        { label: t('global.all'), value: ALL_VALUE },
        { label: t('global.yes'), value: 'true' },
        { label: t('global.no'), value: 'false' },
      ]}
      value={current}
      onChange={(e) =>
        filterOptions.filterApplyCallback(
          e.value === ALL_VALUE ? null : [e.value],
          filterOptions.index
        )
      }
    />
  )
}
