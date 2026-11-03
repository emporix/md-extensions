# Module: access

Last scanned: c043b34 (2026-11-02)
Sources: `src/types/Token.ts`, `src/types/OAuth.ts`, `src/types/Agent.ts` (`GrantType` only), `src/services/tokensService.ts`, `src/services/oauthService.ts`, `src/services/apiClient.ts` (`put` serializes with `JSON.stringify`), `src/utils/tokenHelpers.ts`, `src/utils/validation.ts` (`validateToken`, `validateOAuth`, id rules), `src/hooks/useTokens.ts`, `src/hooks/useTokenConfig.ts`, `src/hooks/useOAuths.ts`, `src/hooks/useOAuthConfig.ts`, `src/hooks/useAgentTokensCatalog.ts`, `src/hooks/useAgentOAuthCatalog.ts`, `src/components/token/TokenGeneralSection.tsx`, route greps in `TokenDetailPage.tsx`, `TokensPage.tsx`, `OAuthDetailPage.tsx`, `OAuthsPage.tsx`, `OAuthGeneralSection.tsx`, `OAuthCard.tsx`, test titles in `src/utils/tokenHelpers.test.ts`.

## Responsibility

Two small credential catalogs stored by id, referenced by other modules (RAG tool embedding/database, custom MCP auth header, OAuth client secret, agent LLM config). This module does not show secret values after create.

Tokens: `{ id, name, value? }`. `value` is optional on the type and is not rendered on edit.

OAuth clients: `{ id, url, clientId, grantType, scope?, enabled?, clientSecretToken?: { id } }`. The only grant type in `GrantType` is `client_credentials`.

Tokens have no `enabled` flag and no list toggle. OAuth rows can be enabled and disabled.

## Main flows

1. Tokens list (`/tokens`) loads `GET /ai-service/{tenant}/agentic/tokens` in API order (no client sort). Add goes to `/tokens/add`. Configure goes to `/tokens/{id}/edit`.
2. Token create requires id, name, and value. PUT body is `{ name, value }` only (id is the path). `validateToken` checks id format and name; it does not require `value`. The form does. After create, replace-navigate to the edit route.
3. Token edit: id is read-only. Value field is not rendered. `useTokenConfig` adds `value` only when creating, so the object passed to PUT has `value: undefined`. `apiClient.put` uses `JSON.stringify`, which drops undefined keys. The edit request body is `{ name }` only. Whether the API treats a missing `value` as “leave the secret unchanged” was not verified.
4. Token delete uses `useDeleteConfirmation`, including a force retry with `?force=true` when the shared delete hook requests it. There is no force-toggle dialog because there is no toggle.
5. OAuth list (`/oauth`) loads `GET .../agentic/oauths` in API order. Add `/oauth/add`, edit `/oauth/{id}/edit`.
6. OAuth create/edit: id sanitized like other ids and read-only after create. Required on the form: url, clientId, grantType, and id while creating. Scope and client-secret token are optional. Default grant type on a new form and when the loaded record has a falsy grant type: `client_credentials`. Loaded `enabled !== false` becomes checked (missing enabled is treated as on).
7. OAuth save PUT body: trimmed url and clientId, grantType, `enabled` default true, scope only when non-blank after trim, `clientSecretToken: { id }` only when an id is chosen. `validateOAuth` requires id, URL, clientId, and grantType before the request. If the response is not an object, the hook returns the request object.
8. OAuth enable/disable patches `REPLACE /enabled`. Force confirm only when disabling and `ApiClientError.force` is set. Other errors roll the switch back. Success reloads the list.
9. OAuth delete supports the same force path as tokens.
10. `useAgentTokensCatalog` and `useAgentOAuthCatalog` are read-only lists for agent screens. They skip the fetch and return an empty list when `tenant` or `token` is missing. Errors clear the list and store `error.message`. They do not toast.

`toolsService.getTokens` is a second token list used by the tool form (id and name). It is not this module's hook.

## Key files

| Path | Role |
|---|---|
| `src/components/token/TokensPage.tsx` | List and navigation |
| `src/components/token/TokenDetailPage.tsx` | Create/edit shell |
| `src/components/token/TokenGeneralSection.tsx` | Id, name, value only while creating |
| `src/hooks/useTokens.ts` / `useTokenConfig.ts` | List and save |
| `src/services/tokensService.ts` | GET/PUT/DELETE; PUT body is name + value |
| `src/components/oauth/OAuthsPage.tsx` | List, toggle, delete |
| `src/components/oauth/OAuthDetailPage.tsx` | Create/edit shell |
| `src/components/oauth/OAuthGeneralSection.tsx` | URL, client id, grant type, secret token |
| `src/hooks/useOAuths.ts` / `useOAuthConfig.ts` | List, patch enable, save |
| `src/services/oauthService.ts` | GET/PUT/PATCH/DELETE; PUT omits empty scope and missing secret |
| `src/hooks/useAgentTokensCatalog.ts` | Agent picker catalog |
| `src/hooks/useAgentOAuthCatalog.ts` | Agent picker catalog |
| `src/utils/tokenHelpers.ts` | Empty token; badge label from id substring |

Card badge for a token is not the stored type. `getTokenTypeLabel` lowercases the id and returns OpenAI if it contains `openai`, else Anthropic if `anthropic`, else Emporix if `emporix`, else a generic API label. OAuth cards badge the grant type via `getOAuthGrantTypeLabel` (function body not opened).

## Module-specific rules

- Id pattern for both, enforced by `validateId` on save: `^[\w-]{1,66}$`. The input strips other characters and slices to 66 before save, so the format error is for values that bypass the field (catalog records, direct service calls).
- Token name is required on create and edit. Token value is required only on create and is a `Password` field with mask toggle and no strength meter.
- Edit token save does not send the previous secret. `JSON.stringify` omits the undefined `value`, so the body is name only. The UI has no field to rotate the secret.
- OAuth scope is omitted from PUT when blank, not sent as an empty string.
- OAuth client secret is a reference to a token id, not a raw secret field.
- OAuth `enabled` defaults to true on save when missing (`oauth.enabled ?? true` in the service, and the form's `enabled` state).
- Disabling an OAuth client can require force. Enabling does not open the force dialog.
- Neither list sorts. Tools and MCP lists do; do not copy that assumption here.
- Catalog hooks do not expose refresh. Token and OAuth management hooks do (`refreshTokens`, `refreshOAuths`).

## Tests that pin behaviour

`tokenHelpers.test.ts` only:

- `createEmptyToken` returns id, name, and value as empty strings.
- Id containing `openai` → OpenAI label; `anthropic` → Anthropic; `emporix` → Emporix; any other id → API token label.

No tests were found for `tokensService`, `oauthService`, `useTokenConfig`, `useOAuthConfig`, or the token/OAuth components. Secret-not-sent-on-edit and optional scope omission are from the hook and service, not from a test.

## Not yet scanned

`TokenCard.tsx`, `TokenDetailPage.tsx` body beyond route and title, `TokenDetailSection.tsx`, `TokenRequiredMark.tsx`, `OAuthCard.tsx` beyond the grant-type badge, `OAuthDetailPage.tsx` body, `OAuthGeneralSection.tsx` grant-type option list, `OAuthDetailSection.tsx`, `OAuthRequiredMark.tsx`, `getOAuthGrantTypeLabel`. Agent screens that consume the catalogs. Server behaviour when token PUT omits `value`.
