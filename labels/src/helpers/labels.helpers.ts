import { deleteLabel, removeLabelImageFromCloudinary } from '@emporix/api-calls'
import type { PaginationProps } from '../hooks/usePagination'
import type { ColumnVisibility } from '../models/Configuration.model'
import type { Label } from '../models/Label.model'

/**
 * Deletes a label together with its Cloudinary image. Mirrors the MD
 * behaviour: when removing the image fails, the label is still deleted.
 */
export const deleteLabelWithImage = async (label: Label): Promise<void> => {
  try {
    if (label.image) {
      await removeLabelImageFromCloudinary(label.image)
    }
    await deleteLabel(label)
  } catch (error) {
    console.error(error)
    console.warn(
      'there was a problem deleting label or its image from cloudinary: ',
      label.image,
      '  retrying...'
    )
    await deleteLabel(label)
  }
}

/**
 * Columns to render for a saved `ext_labels` preference. No saved entries
 * means the user never configured the table, so every column is shown; an
 * entry for a column decides its visibility, including when all are hidden.
 */
export const filterVisibleColumns = <TColumn extends { field?: string }>(
  columns: TColumn[],
  savedColumns: Pick<ColumnVisibility, 'key' | 'visible'>[]
): TColumn[] => {
  if (savedColumns.length === 0) return columns
  return columns.filter(
    (column) =>
      savedColumns.find((saved) => saved.key === column.field)?.visible ?? true
  )
}

export type LabelsQueryParams = {
  pageNumber: number
  pageSize: number
  sort?: string
  q?: string
}

const escapeRegexSpecialChars = (value: string): string =>
  value.replace(/[\\.^$|?*+()[\]{}-]/g, '\\$&')

const getNameSearch = (
  filters: PaginationProps['filters']
): string | undefined => {
  const filter = filters?.name
  const value = filter && 'value' in filter ? filter.value : undefined
  return typeof value === 'string' && value.trim() !== ''
    ? value.trim()
    : undefined
}

/**
 * Label service query params for the table state. The service searches only
 * through `q`, so the name filter becomes a regex match on `name`.
 */
export const toLabelsQueryParams = ({
  currentPage,
  rows,
  sortField,
  sortOrder,
  filters,
}: Partial<PaginationProps>): LabelsQueryParams => {
  const search = getNameSearch(filters)
  return {
    pageNumber: currentPage ?? 1,
    pageSize: rows ?? 10,
    ...(sortField
      ? { sort: `${sortField}:${sortOrder === 1 ? 'ASC' : 'DESC'}` }
      : {}),
    ...(search ? { q: `name:~(${escapeRegexSpecialChars(search)})` } : {}),
  }
}
