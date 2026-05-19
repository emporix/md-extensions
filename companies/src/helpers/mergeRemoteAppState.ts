import type { AppState, ResolvedAppState } from "../models/AppState.model";

/**
 * Known keys merged explicitly (`scopes` is normalized away — see base.userScopes).
 * Keep this list in sync when extending AppState.
 */
const MERGED_APPSTATE_KEYS = new Set([
  "tenant",
  "language",
  "token",
  "currency",
  "contentLanguage",
  "permissions",
  "user",
  "onError",
  "userScopes",
  "scopes",
]);

export function mergeRemoteAppState(
  defaults: AppState,
  incoming?: Partial<AppState> & Record<string, unknown>,
): ResolvedAppState {
  const base: AppState = {
    tenant: incoming?.tenant ?? defaults.tenant,
    language: incoming?.language ?? defaults.language,
    token: incoming?.token ?? defaults.token,
    currency: incoming?.currency ?? defaults.currency,
    contentLanguage: incoming?.contentLanguage ?? defaults.contentLanguage,
    permissions: incoming?.permissions ?? defaults.permissions,
    user: incoming?.user ?? defaults.user,
    onError: incoming?.onError ?? defaults.onError,
    userScopes: incoming?.userScopes ?? incoming?.scopes,
  };

  const out = { ...base } as ResolvedAppState;

  if (!incoming) {
    return out;
  }

  for (const key of Object.keys(incoming)) {
    if (MERGED_APPSTATE_KEYS.has(key)) continue;
    const value = (incoming as Record<string, unknown>)[key];
    if (value !== undefined) {
      out[key] = value;
    }
  }

  return out;
}
