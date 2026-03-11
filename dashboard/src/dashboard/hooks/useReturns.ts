import type { ReturnApiResponse } from '../api/returns.api'
import { fetchReturns } from '../api/returns.api'
import { getOrLoad } from '../helpers/requestCache.helpers'
import { useAsyncResource } from './useAsyncResource'

export type UseReturnsResult = {
  returns: ReturnApiResponse[]
  total: number | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

const PAGE_SIZE = 50

const returnsCacheKey = (tenant: string) => `returns:${tenant}:1:${PAGE_SIZE}`

export const useReturns = (
  tenant: string | undefined,
  token: string | undefined
): UseReturnsResult => {
  const tenantValue = tenant ?? ''
  const tokenValue = token ?? ''

  const { value, loading, error, refetch } = useAsyncResource<{
    returns: ReturnApiResponse[]
    total: number | null
  }>({
    enabled: Boolean(tenant && token),
    initialValue: { returns: [], total: null },
    loadValue: () =>
      getOrLoad(returnsCacheKey(tenantValue), () =>
        fetchReturns({
          tenant: tenantValue,
          token: tokenValue,
          pageNumber: 1,
          pageSize: PAGE_SIZE,
        })
      ),
    errorMessage: 'errors.failedToLoadData',
    deps: [tenant, token],
  })

  return {
    returns: value.returns,
    total: value.total,
    loading,
    error,
    refetch,
  }
}

export type UseLastReturnsResult = {
  returns: ReturnApiResponse[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export const useLastReturns = (
  tenant: string | undefined,
  token: string | undefined
): UseLastReturnsResult => {
  const tenantValue = tenant ?? ''
  const tokenValue = token ?? ''

  const { value, loading, error, refetch } = useAsyncResource<{
    returns: ReturnApiResponse[]
    total: number | null
  }>({
    enabled: Boolean(tenant && token),
    initialValue: { returns: [], total: null },
    loadValue: () =>
      getOrLoad(returnsCacheKey(tenantValue), () =>
        fetchReturns({
          tenant: tenantValue,
          token: tokenValue,
          pageNumber: 1,
          pageSize: PAGE_SIZE,
        })
      ),
    errorMessage: 'errors.failedToLoadData',
    deps: [tenant, token],
  })

  return { returns: value.returns, loading, error, refetch }
}
