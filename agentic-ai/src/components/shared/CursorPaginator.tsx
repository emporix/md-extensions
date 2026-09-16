import { useTranslation } from 'react-i18next'
import { Button } from 'primereact/button'
import { Dropdown } from 'primereact/dropdown'

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100]

type CursorPaginatorProps = {
  readonly nextCursor: string | null
  readonly prevCursor: string | null
  readonly rows: number
  readonly rowsPerPageOptions?: number[]
  readonly isLoading: boolean
  readonly onNext: () => void
  readonly onPrevious: () => void
  readonly onRowsChange: (rows: number) => void
}

const CursorPaginator = ({
  nextCursor,
  prevCursor,
  rows,
  rowsPerPageOptions = ROWS_PER_PAGE_OPTIONS,
  isLoading,
  onNext,
  onPrevious,
  onRowsChange,
}: CursorPaginatorProps) => {
  const { t } = useTranslation()

  return (
    <div className="cursor-paginator">
      <div className="cursor-paginator__nav">
        <Button
          type="button"
          className="p-button-secondary"
          icon="pi pi-angle-left"
          label={t('previous_page')}
          disabled={!prevCursor || isLoading}
          onClick={onPrevious}
        />
        <Button
          type="button"
          className="p-button-secondary"
          icon="pi pi-angle-right"
          iconPos="right"
          label={t('next_page')}
          disabled={!nextCursor || isLoading}
          onClick={onNext}
        />
      </div>
      <Dropdown
        value={rows}
        options={rowsPerPageOptions}
        disabled={isLoading}
        onChange={(e) => onRowsChange(e.value as number)}
        className="cursor-paginator__rows"
        ariaLabel={t('rows_per_page')}
      />
    </div>
  )
}

export default CursorPaginator
