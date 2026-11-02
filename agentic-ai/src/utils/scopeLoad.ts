const EMPTY_SCOPES: never[] = []

export const scopeIdentityKey = (tenant: string, token: string): string =>
  `${tenant}\0${token}`

export type ScopeLoadState<T> = {
  readonly key: string
  readonly scopes: T[]
  readonly loading: boolean
  readonly failed: boolean
}

export const initialScopeLoadState = <T>(
  tenant: string,
  token: string,
  cached: T[] | undefined
): ScopeLoadState<T> => ({
  key: tenant ? scopeIdentityKey(tenant, token) : '',
  scopes: cached ?? [],
  loading: Boolean(tenant) && cached === undefined,
  failed: false,
})

export const visibleScopeLoad = <T>(
  state: ScopeLoadState<T>,
  tenant: string,
  token: string
): Pick<ScopeLoadState<T>, 'scopes' | 'loading' | 'failed'> => {
  if (!tenant) {
    return { scopes: EMPTY_SCOPES, loading: false, failed: false }
  }
  if (state.key !== scopeIdentityKey(tenant, token)) {
    return { scopes: EMPTY_SCOPES, loading: true, failed: false }
  }
  return {
    scopes: state.scopes,
    loading: state.loading,
    failed: state.failed,
  }
}

export const beginScopeLoad = <T>(requestKey: string): ScopeLoadState<T> => ({
  key: requestKey,
  scopes: [],
  loading: true,
  failed: false,
})

export const applyScopeLoadResult = <T>(
  state: ScopeLoadState<T>,
  requestKey: string,
  currentKey: string,
  result: { readonly ok: true; readonly scopes: T[] } | { readonly ok: false }
): ScopeLoadState<T> => {
  if (requestKey !== currentKey) {
    return state
  }
  if (!result.ok) {
    return { key: currentKey, scopes: [], loading: false, failed: true }
  }
  return {
    key: currentKey,
    scopes: result.scopes,
    loading: false,
    failed: false,
  }
}

export const finishScopeLoad = <T>(
  state: ScopeLoadState<T>,
  requestKey: string,
  currentKey: string
): ScopeLoadState<T> => {
  if (requestKey !== currentKey) {
    return state
  }
  if (!state.loading) {
    return state
  }
  return { ...state, loading: false }
}
