import { Dropdown } from '@emporix/component-library'
import { useTranslation } from 'react-i18next'
import styles from './ChangelogPaginator.module.scss'

type ChangelogPaginatorProps = {
  readonly nextCursor: string | null
  readonly prevCursor: string | null
  readonly rows: number
  readonly rowsPerPageOptions: number[]
  readonly isLoading: boolean
  readonly onNext: () => void
  readonly onPrevious: () => void
  readonly onRowsChange: (rows: number) => void
}

const ChangelogPaginator = ({
  nextCursor,
  prevCursor,
  rows,
  rowsPerPageOptions,
  isLoading,
  onNext,
  onPrevious,
  onRowsChange,
}: ChangelogPaginatorProps): JSX.Element => {
  const { t } = useTranslation()

  return (
    <nav className={styles.paginator}>
      <div className={styles.controls}>
        <button
          type="button"
          className={styles.pageButton}
          disabled={!prevCursor || isLoading}
          onClick={onPrevious}
          data-testid="changelog-paginator-previous"
        >
          ‹ {t('global.previousPage')}
        </button>
        <button
          type="button"
          className={styles.pageButton}
          disabled={!nextCursor || isLoading}
          onClick={onNext}
          data-testid="changelog-paginator-next"
        >
          {t('global.nextPage')} ›
        </button>
      </div>
      <Dropdown
        className={styles.rowsDropdown}
        options={rowsPerPageOptions.map((value) => ({
          label: String(value),
          value,
        }))}
        optionLabel="label"
        optionValue="value"
        value={rows}
        disabled={isLoading}
        onChange={(e) => onRowsChange(Number(e.value ?? rows))}
        data-testid="changelog-paginator-rows"
      />
    </nav>
  )
}

export default ChangelogPaginator
