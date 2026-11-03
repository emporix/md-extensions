# Integrations

Last scanned: c043b34 (2026-11-02)

Sources: `src/services/apiClient.ts`, `src/services/agentService.ts`, `src/services/toolsService.ts`, `src/services/mcpService.ts`, `src/services/tokensService.ts`, `src/services/oauthService.ts`, `src/services/hostingFunctionsService.ts`, `src/services/indexingService.ts`, `src/services/aiRagIndexerService.ts`, `src/services/conversationsService.ts`, `src/services/jobService.ts`, `src/services/logService.ts`, `src/services/analyticsService.ts`, `src/services/featureToggleService.ts`, `src/services/iamScopesService.ts`, `src/services/schemaService.ts`, `src/services/modelsService.ts`, `src/utils/sseHelpers.ts`, `src/utils/chatArtifacts.ts`, `src/utils/constants.ts`, `src/utils/teamsInstallCallback.ts`, `src/utils/teamsAppPackageUrl.ts`, `src/constants/zipLimits.ts`, `src/components/chat/ChatMessageArtifacts.tsx`, `src/components/tool/SlackInstallSection.tsx`, `src/components/tool/TeamsInstallSection.tsx`, `src/hooks/useReindexJobs.ts`, `src/hooks/useChatRecommendations.ts`, `src/services/featureToggleService.test.ts`, `src/services/iamScopesService.test.ts`, `src/services/conversationsService.test.ts`, `src/services/apiClient.test.ts`

All HTTP uses `ApiClient` unless noted. Direction is outbound from the browser. Tenant goes in the path and in header `Emporix-tenant`. Auth is `Authorization: Bearer` plus the host token. `Content-Language` and `Accept-Language` are `*`. JSON bodies use `Content-Type: application/json`.

Base URL is env `VITE_API_URL`. When unset, the client uses `https://api.emporix.io`. Absolute `http`/`https` paths skip the base. No other env names are read under `src/services`. Vite `MODE` only picks a bundled Teams app zip (`dev` / `development`, `stage`, otherwise `prod`) in `src/utils/teamsAppPackageUrl.ts`.

## Shared error behaviour

No automatic retry in `ApiClient`. Non-2xx throws `ApiClientError` with status, body, and message. Detail entries of type `disableable` or `force` set those flags so the UI can offer save-disabled or force delete/patch. Other detail messages are appended to the error text.

Binary GETs reject a body over the given byte cap (declared `Content-Length` or bytes read). Hosting zips use 20 MB. Chat artifacts use 8 MB.

Several services catch and rethrow `Error` with the same message, which drops `ApiClientError` flags. That applies to tools, MCP, indexing, RAG indexer, schema types, and LLM models. Agents, tokens, OAuth, logs, jobs, conversations, hosting, IAM, and analytics leave `ApiClientError` intact.

## Agent service

Backend prefix `/ai-service/{tenant}/agentic`.

| Call | Method and path | Notes |
|---|---|---|
| Stream chat | POST `/chat-stream` | SSE (`Accept: text/event-stream`). Body `{ agentId, message }`. Optional header `session-id`. Events: `token`, `thinking`, `tool_start`, `tool_end`, `artifact`, `error`, `done`. `done` may carry a session id. Empty text and no artifact throws. Stream `error` throws. Abort signal is forwarded. |
| One-shot chat | POST `/chat` | Same body and optional session header. Reads `message` and `sessionId` from an object or a one-element array. Empty message throws. |
| Templates | GET `/templates` | |
| Agents | GET `/agents`, GET `/agents/{id}`, PUT `/agents/{id}` | PUT is create and update. |
| Versions | GET `/agents/{id}?allVersions=true` | |
| Copy template | POST `/templates/{templateId}/agents` | Body id, localized name and description filtered to languages in storage, user prompt. |
| Bundle copy | templates + agents + copy + patch | Missing helper templates are copied and enabled first. Missing helper template throws `BundleHelperTemplateNotFoundError`. |
| Enable helper | PATCH `/agents/{id}` | `REPLACE /enabled true` after copy. Helpers: commerce-filter DSL, JSON schema, log analysis, MCP-tool-from-function, recommended prompts. |
| Patch | PATCH `/agents/{id}` | JSON Patch ops `REPLACE`, `ADD`, `REMOVE`. |
| Delete | DELETE `/agents/{id}` | `?force=true` when forced. |
| Commerce events | GET `/commerce-events` | `{ events: string[] }`. |
| Export | POST `/agents/export` | `{ agentIds }` → `exportedAt`, `data`, `checksum`. |
| Import | POST `/agents/import` | Raw JSON body. |

Webhook, not ai-service: GET `/webhook/{tenant}/event-subscriptions`. Used when building chat recommendations. Optional abort signal.

## Tools, Slack, Teams

Prefix `/ai-service/{tenant}/agentic`.

| Call | Method and path |
|---|---|
| List / get | GET `/tools`, GET `/tools/{id}` |
| Save | PUT `/tools/{id}` |
| Patch enable | PATCH `/tools/{id}` optional `?force=true` |
| Delete | DELETE `/tools/{id}` optional `?force=true` |
| Slack install data | GET `/oauth/installations/slack` → `id`, `clientId` |
| Teams install data | GET `/oauth/installations/teams` query `providerTenantId`, `toolId`, `toolPersisted` |
| Teams status | GET `/oauth/installations/teams/status` query `installStateId`, `providerTenantId` |

Status enum: `pending` | `ready` | `missing`.

Slack install is a full-page redirect to `https://slack.com/oauth/v2/authorize` with `client_id`, a fixed bot `scope` list, empty `user_scope`, and `state` from the install id. Teams install opens Microsoft Teams and Teams admin URLs, downloads a bundled zip, and polls status every 2.5 s for up to 5 minutes. Graph consent returns to the page; the UI rewrites the hash route. It does not call Slack or Microsoft token endpoints itself.

`toolsService.getTokens` also GETs `/agentic/tokens`. Token screens use `tokensService`.

## MCP

Prefix `/ai-service/{tenant}/agentic/mcp-servers`.

GET list, GET `/{id}`, PUT `/{id}`, PATCH `/{id}` optional `?force=true`, DELETE `/{id}` optional `?force=true`. PUT body is built by `buildMcpServerUpsertPayload`. Errors are rethrown as plain `Error`.

Dynamic tools name cloud functions; the function list is hosting, not this service.

## Tokens

Prefix `/ai-service/{tenant}/agentic/tokens`.

GET list, GET `/{id}`, PUT `/{id}` with `{ name, value }` after `validateToken`, DELETE `/{id}` optional `?force=true`. No patch.

## OAuth clients

Prefix `/ai-service/{tenant}/agentic/oauths`.

GET list, PUT `/{id}` after `validateOAuth`. Body: `url`, `clientId`, `grantType`, `enabled` (default true), optional trimmed `scope`, optional `clientSecretToken.id`. PATCH `/{id}` and DELETE `/{id}` accept `?force=true`. A non-object PUT response falls back to the request object. This stores client-credentials config. It does not perform an OAuth token grant.

## Hosting functions

| Call | Method and path | Notes |
|---|---|---|
| Functions | GET `/automation/{tenant}/projects/functions` | 404 → empty list, feature not disabled. 403 → empty list, `featureDisabled`. Other errors throw. |
| Deployments | GET `/automation/{tenant}/projects/functions/{functionId}/deployments` | |
| Zip | GET `/media/{tenant}/assets/{mediaId}/download` | ArrayBuffer, 20 MB cap. |

## Indexing and RAG

Indexing service, prefix `/indexing/{tenant}/reindex-jobs`:

- GET list, optional `?q=`
- GET `/{id}`
- POST body `{ entityType, rag? }`

Job status: `FAILURE` | `IN_PROGRESS` | `PENDING` | `PUBLISHED` | `SUCCESS`. The tools page loads jobs matching in-progress, pending, or published, then polls each job every 3 s until success or failure. A poll error stops that job as failure. No HTTP retry.

RAG indexer, prefix `/ai-rag-indexer/{tenant}/{entityType}`:

- GET `/rag-metadata` → string keys
- GET `/filter-metadata` → `{ key }[]`
- POST `/reindex` with `{}`

Errors rethrown as plain `Error`. Tool reindex from the list uses the indexing service with `rag: true`, not this POST.

## Conversations

GET `/ai-service/{tenant}/agentic/conversations`. Query: sort default `lastMessageAt` DESC, page size, page number, optional `agentId`, `toolId`, column filters. Response header supplies total count (`X-Total-Count` via `parseTotalCount`). `hasConversations` asks for page 1 size 1 and treats a positive total, or a non-empty page when total is missing, as true.

## Jobs and request logs

Jobs: GET `/ai-service/{tenant}/jobs` and GET `/jobs/{id}`. Cursor via `next` / `prev` query and response cursor headers. List filters include exact `type` and `status`.

Logs, prefix `/ai-service/{tenant}/agentic/logs`:

- GET `/requests` cursor list. Field mask omits full message bodies. Exact match on severity and duration. UUID exact match on request id and session id. Agent filter field is `triggerAgentId`.
- GET `/requests/{logId}`
- GET `/requests?q=requestId:{id}` for session-flow and job detail
- GET `/sessions` and GET `/sessions/{sessionId}`

List endpoints return the cursor pair with the page. No retry.

## Analytics

GET `/ai-service/{tenant}/agentic/analytics` optional `?agentId=`. One payload feeds resolution efficiency, session severity, and session error trend. In-memory cache 5 minutes per agent id, or `all` when no agent. `forceRefresh` skips the cache. No retry.

## Feature toggles

GET `/feature-toggle/{tenant}/features?pageNumber=1&pageSize=1000`. Accepts a raw array or `{ values }`. Codes read: `ms-teams`, `emporixHosting`, `ai-agent-chat`. Success cached per tenant (token ignored) and in-flight calls share one request. Failure logs, returns `[]`, and is not cached, so the next call hits the API again (`featureToggleService.test.ts`).

## IAM scopes

| Call | Path | Use |
|---|---|---|
| Current user | GET `/iam/{tenant}/users/me/scopes` | Scope string split on whitespace. Drops empty tokens and any token starting with `tenant=`. Dedupes and sorts. Cached per tenant+token. Failed load is not cached. Parallel callers share one request (`iamScopesService.test.ts`). |
| Catalog | GET `/iam/{tenant}/scopes?pageNumber=1&pageSize=1000` | Rows with a non-blank id. No cache. Used by dynamic MCP tool scopes. |

## Schema and models

GET `/schema/{tenant}/custom-entities` page 1 size 2000, with total-count headers. Rows without an id are dropped. Failures rethrow as plain `Error`. The UI adds fixed entity labels product, order, customer, legal entity in front of custom types for RAG Emporix.

GET `/ai-service/{tenant}/agentic/models`. Failures rethrow as plain `Error`.

## Not yet scanned

Webhook subscription response shape beyond what recommendations read, import result fields, analytics response fields not shown on the metrics panel, Slack scope string meaning, and any backend outside the paths above.
