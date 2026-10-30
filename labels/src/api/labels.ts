import { getApiClient } from '@emporix/api-calls'
import { toLabelsQueryParams } from '../helpers/labels.helpers'
import type { PaginatedResponse, PaginationProps } from '../hooks/usePagination'
import type { Label } from '../models/Label.model'

/**
 * Lists labels for the table. Replaces `fetchLabels` from
 * `@emporix/api-calls`, which sends filters as raw query params the label
 * service ignores instead of `q`.
 *
 * `language` overrides the client's `Accept-Language: *`: with `*` the
 * service sorts names by byte value (uppercase before lowercase).
 */
export const fetchLabelsPage = async (
  pagination: Partial<PaginationProps>,
  language: string
): Promise<PaginatedResponse<Label>> => {
  const { data, headers } = await getApiClient().get<Label[]>('label/labels', {
    params: toLabelsQueryParams(pagination),
    headers: { 'x-total-count': true, 'Accept-Language': language },
  })
  return { values: data, totalRecords: Number(headers['x-total-count'] ?? 0) }
}
