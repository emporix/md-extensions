import { getApiClient } from '@emporix/api-calls'
import { toLabelsQueryParams } from '../helpers/labels.helpers'
import type { PaginatedResponse, PaginationProps } from '../hooks/usePagination'
import type { Label } from '../models/Label.model'

/**
 * Lists labels for the table. Replaces `fetchLabels` from
 * `@emporix/api-calls`, which sends filters as raw query params the label
 * service ignores instead of `q`.
 */
export const fetchLabelsPage = async (
  pagination: Partial<PaginationProps>
): Promise<PaginatedResponse<Label>> => {
  const { data, headers } = await getApiClient().get<Label[]>('label/labels', {
    params: toLabelsQueryParams(pagination),
    headers: { 'x-total-count': true },
  })
  return { values: data, totalRecords: Number(headers['x-total-count'] ?? 0) }
}
