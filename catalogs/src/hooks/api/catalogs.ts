import { useMemo } from 'react'
import {
  createNewCatalog,
  fetchCatalog,
  fetchCatalogs,
  modifyCatalog,
  removeCatalog,
} from '@emporix/api-calls'
import { useDashboardContext } from '../../context/Dashboard.context'
import { toApiPagination } from '../../helpers/apiPagination'
import type { PaginationProps } from '../usePagination'
import type { Catalog } from '../../models/Catalog.model'

/**
 * The api-calls functions put the id into the URL path as is; an id with
 * `/`, `?`, `#` or `%` must be encoded first.
 */
const pathSegment = (id: string) => encodeURIComponent(id)

/** Catalog calls bound to the host tenant. */
export const useCatalogsApi = () => {
  const { tenant } = useDashboardContext()

  return useMemo(
    () => ({
      /** One page; forwards sort, paging and the column filters as query params. */
      getCatalogsPage: (params: Partial<PaginationProps>) =>
        fetchCatalogs(tenant, toApiPagination(params)),
      getCatalog: (id: string) => fetchCatalog(tenant, pathSegment(id)),
      /** Resolves to the new catalog's id. */
      createCatalog: (catalog: Catalog) => createNewCatalog(tenant, catalog),
      // `modifyCatalog` builds the PUT path from the body's id and deletes
      // `status` from the object it gets, so it receives a copy. The id is
      // sent as is (as MD did): encoding it would also change the stored id.
      updateCatalog: (catalog: Catalog) =>
        modifyCatalog(tenant, { ...catalog }),
      deleteCatalog: (id: string) => removeCatalog(tenant, pathSegment(id)),
    }),
    [tenant]
  )
}
