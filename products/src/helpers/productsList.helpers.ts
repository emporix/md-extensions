import type { ProductRow } from '@emporix/api-calls'
import {
  ALL_PRODUCTS_BROWSER_COLUMNS,
  type DataTablePaginationState,
  type ProductsBrowserColumnKey,
  type ProductsBrowserRow,
} from '@emporix/component-library'
import type { ColumnVisibility } from '../models/Configuration.model'
import type Localized from '../models/Localized.model'
import { trimCloudinaryImage } from './images'

/** A row of the products list: the api-calls row, named in the content language. */
export type ProductsListRow = ProductRow & ProductsBrowserRow

type GetLocalizedValue = (value: Localized | string | undefined) => string

export const toProductsListRow = (
  row: ProductRow,
  getName: GetLocalizedValue
): ProductsListRow => ({
  ...row,
  name: getName(row.ref.localizedName),
  imageUrl: trimCloudinaryImage(row.imageUrl ?? undefined, 32, 32) ?? null,
})

/**
 * The registry columns the saved settings show. As in MD, a column the
 * settings do not know yet stays visible.
 */
export const visibleProductColumns = (
  settings: ColumnVisibility[]
): ProductsBrowserColumnKey[] =>
  ALL_PRODUCTS_BROWSER_COLUMNS.filter(
    (key) => settings.find((setting) => setting.key === key)?.visible ?? true
  )

/** The page and rows the URL holds, read the way usePagination reads them. */
export const pageFromSearchParams = (
  searchParams: URLSearchParams
): Pick<DataTablePaginationState, 'currentPage' | 'rows'> | undefined => {
  const currentPage = Number(searchParams.get('page'))
  const rows = Number(searchParams.get('rows'))
  const isCount = (value: number) => Number.isInteger(value) && value > 0
  if (!(isCount(currentPage) && isCount(rows))) {
    return undefined
  }
  return { currentPage, rows }
}
