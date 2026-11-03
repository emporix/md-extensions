# Module: tools

Last scanned: c043b34 (2026-11-02)
Sources: `src/types/Tool.ts`, `src/services/toolsService.ts`, `src/services/schemaService.ts`, `src/services/indexingService.ts`, `src/utils/toolHelpers.ts`, `src/utils/toolConfigHelpers.ts`, `src/utils/ragEmporixToolHelpers.ts`, `src/utils/slackRoutingHelpers.ts`, `src/utils/teamsRoutingHelpers.ts`, `src/utils/teamsInstallCallback.ts`, `src/utils/validateJsonSchema.ts`, `src/utils/mcpToolFromFunctionAssistantHelpers.ts`, `src/utils/mcpToolFromFunctionPrompt.helpers.ts`, `src/utils/validation.ts` (id pattern + `validateToken`/`validateOAuth` neighbours), `src/hooks/useTools.ts`, `src/hooks/useToolConfig.ts`, `src/hooks/useReindexJobs.ts`, `src/hooks/useMcpToolFromFunctionAssistant.ts` (through provisioning setup), `src/components/tool/ToolsPage.tsx`, `src/components/tool/ToolDetailPage.tsx` (save/conflict/tabs), `src/components/tool/ToolCard.tsx`, `src/components/tool/TeamsInstallSection.tsx` (poll loop), test titles in `toolHelpers.test.ts`, `toolConfigHelpers.test.ts`, `ragEmporixToolHelpers.test.ts`, `schemaHelpers.test.ts`, `validateJsonSchema.test.ts`, `mcpToolFromFunctionAssistantHelpers.test.ts`, `mcpHelpers.test.ts` (name pattern only), `slackRoutingHelpers.test.ts`, `teamsRoutingHelpers.test.ts`, `teamsInstallCallback.test.ts`, `ToolCard.test.tsx`, `SearchToolSection.test.tsx`. `src/utils/schemaHelpers.ts` is not in the tree.

## Responsibility

Tenant catalog of native tools the agent runtime can call. Types seen in labels and validation: `slack`, `teams`, `rag_custom`, `rag_emporix`, `search`, `file`. Unknown types still save if id, name, and type are present (`isToolFormValid` default branch returns true).

CRUD talks to `/ai-service/{tenant}/agentic/tools`. List is sorted by name, case-insensitive. Create and update are the same PUT of the full tool. Enable/disable and delete support a second `?force=true` attempt when the API returns `ApiClientError.force` on a disable or delete. Force confirm is only offered when turning a tool off, not when turning it on. Optimistic list update rolls back on any other error, then the list reloads after success.

Active tools cannot be removed from the card (`cannot_delete_active_tool`). Slack card text masks `botToken` as eight bullets.

`schemaHelpers.ts` is absent. RAG Emporix entity-type dropdown options are built in `schemaService.buildRagEmporixEntityTypeOptions` and covered by `schemaHelpers.test.ts`.

JSON Schema validation and MCP-tool-from-function draft helpers are listed with this module by the scan brief. The MCP server editor UI is in `mcp.md`.

## Main flows

1. List (`/tools`) loads tools, toggles `enabled` with JSON Patch `REPLACE /enabled`, deletes with confirm, and offers reindex on `rag_emporix` and `search` cards.
2. Add (`/tools/add`) starts from `createEmptyTool` (enabled, empty type). Type change wipes config and applies that type's defaults. Settings tab stays locked until a type is chosen. Save PUT, then replace-navigates to `/tools/{id}/edit`.
3. Edit loads one tool. `rag_emporix` flattens nested `emporixNativeToolConfig` onto the form via `mergeRagEmporixConfigOnLoad` (nested embedding wins field-by-field over top-level). Save shape depends on type (below). Teams save also refreshes the agent list (`onAgentsUpdated`).
4. Slack install data: `GET .../oauth/installations/slack` returns `{ id, clientId }`. Bot token is required only while creating.
5. Teams install: draft and pending state live in `sessionStorage` (`emporix.teamsToolInstallDraft`, `emporix.teamsInstallPending`). Graph consent is read from `teamsGraphConsent` on the hash query or the location search. Status enum: `success | error | unknown`. Consent applies only while creating, or when the loaded type is `teams`, or when the loaded type is blank and the draft type is `teams`. Success writes `providerTenantId` into `config.tenantId` and clears the draft. Error clears the draft. Callback hash `/tools/{id}/edit` returns to that edit route; any other hash returns to `/tools/add`.
6. Teams app install polls `GET .../oauth/installations/teams/status` every 2500 ms for at most 5 minutes. Status enum: `pending | ready | missing`. `ready` with a `toolId` finishes install. `missing` or timeout stops and shows an error. Install URL query may include `providerTenantId`, `toolId`, and `toolPersisted=true`.
7. Reindex (search and rag_emporix only) requires a configured entity type (top-level or nested). It POSTs `/indexing/{tenant}/reindex-jobs` with `{ entityType, rag: true }`. Cards for that entity type (lowercased) stay disabled while a job is `IN_PROGRESS`, `PENDING`, or `PUBLISHED`, or while this page is polling. Poll every 3s until `SUCCESS` or `FAILURE`. There is a second `reindex` in `aiRagIndexerService`; the tools page uses `indexingService.reindex`. Whether the indexer endpoint is still called elsewhere was not traced.
8. MCP tool from function (dynamic MCP editor): load latest function zip source, prompt a helper agent, parse a JSON object (fenced block preferred), apply only valid fields onto the tool. `functionId` is not overwritten by the draft.

## Key files

| Path | Role |
|---|---|
| `src/components/tool/ToolsPage.tsx` | Grid, delete/force, reindex confirm |
| `src/components/tool/ToolDetailPage.tsx` | Create/edit, type sections, team conflict, Teams consent |
| `src/components/tool/ToolCard.tsx` | Type badge, masked Slack token, reindex, block delete while enabled |
| `src/hooks/useTools.ts` | List, patch enable, force disable/delete |
| `src/hooks/useToolConfig.ts` | Form state, defaults, save payloads, dirty baseline |
| `src/services/toolsService.ts` | Tools CRUD, Slack/Teams install, token id/name list for RAG |
| `src/utils/toolConfigHelpers.ts` | Per-type validity and save/default normalizers |
| `src/utils/ragEmporixToolHelpers.ts` | Entity type, field keys, save sanitizer |
| `src/utils/slackRoutingHelpers.ts` / `teamsRoutingHelpers.ts` | Defaults, one-tool-per-team counts, agent attachment rules |
| `src/utils/validateJsonSchema.ts` | Ajv JSON Schema check (empty allowed) |
| `src/utils/mcpToolFromFunction*.ts` | Draft extract/apply and prompt text |

Tool id input is sanitized to `[\w-]` and cut at 66 characters (`sanitizeIdInput`). `validateTool` exists in `validation.ts` but `useToolConfig` does not call it; the form gate is `isToolFormValid` plus team uniqueness.

## Module-specific rules

- New tools start `enabled: true`. Save keeps `tool.enabled ?? true`.
- Slack and Teams: at most one tool per team. Teams uniqueness is the pair `teamId` + `tenantId`. The current tool id is excluded. Save stays disabled until the full tool list has loaded and the count is 0. Empty team id (Slack) or empty team/tenant (Teams) skips the conflict check. UI shows `slack_team_config_conflict` / the Teams equivalent when count > 0.
- Slack required: `teamId`, at least one allowed operation, and `botToken` only when creating. Teams required: `teamId`, `tenantId`, at least one allowed operation. `defaultInboundAgentId` is optional; blank is omitted on save.
- Slack default operations when `allowedOperations` is null: `sendMessage`, `createChannel`, `inviteParticipants`, `collaborateOnChannel`. An empty array is kept and fails validation. Teams defaults add `createChat` and `collaborateOnChat`. On an agent, Slack refuses dropping the last selected operation; Teams allows the subset to change and then requires length > 0 via `teamsNativeToolHasAllowedOperations`. An agent may attach at most one Slack tool and at most one Teams tool; selecting another replaces the previous one of that type.
- Changing tool type replaces config with that type's defaults (empty object for file and rag until their default effects run).
- `file` saves `{}` and is valid with only id, name, and type.
- `search`: entity type is only `customer` or `legal-entity` (`LEGAL-ENTITY` / `LEGAL_ENTITY` normalize to `legal-entity`; anything else becomes `customer` on defaults). `maxResults` integer 1–10, default 5. Prompt optional and omitted when blank.
- `rag_custom`: prompt required; `maxResults` 1–100, default 5 in the validity check when missing; database URL, collection name, and database token id required; embedding model and embedding token id required. Defaults: database type `qdrant`, entity type `product`, unless already set. `RagCustomDatabase.INVALID` exists on the type; the default path does not write it.
- `rag_emporix`: prompt required; at least one indexed field. Field keys must match `^[a-zA-Z0-9_.-]+$`. Custom / `mixins.` keys must be longer than the prefix `mixins.`. Filter keys use the same pattern; empty filter list is valid. Duplicate filter keys and parent/child indexed keys are hidden from the other rows' options, not rejected by `isToolFormValid`. Changing entity type clears indexed and filter fields. Unknown current entity type is appended as its own option. Predefined options: `product`, `order`, `customer`, `legal-entity`, then custom schema types from `GET /schema/{tenant}/custom-entities` (page size 2000). Label is localized name, else id. Missing catalog value falls back to the raw id.
- Embedding provider `emporix_openai` needs no model, dimensions, URL, or token. `openai` needs model, dimensions 128–4096, and a token id. `self_hosted_ollama` needs those plus a URL. Missing provider/entity type defaults to `emporix_openai` and `product` without marking the form dirty (`nextBaselineAfterSilentUpdate`).
- RAG save drops invalid field keys and the `custom` flag; names and descriptions are trimmed and omitted when blank. Entity type is normalized (`PRODUCT` → `product`, and the same for order, customer, legal entity).
- Tokens for RAG pickers come from `toolsService.getTokens` (id and name only), not from the tokens CRUD module.
- `validateAgentOutputJsonSchema`: blank is valid. Otherwise the text must parse as a non-array object that contains one of `$ref`, `$defs`, `definitions`, `type`, `properties`, `items`, `oneOf`, `anyOf`, `allOf`, `not`, `enum`, `const`, `if`, `$schema`, and Ajv `validateSchema` must pass. Error keys: `output_format_invalid_json`, `output_format_invalid_json_schema`. Detail from the first Ajv error is appended in parentheses.
- MCP tool draft apply: `toolName` only if it matches `^[A-Za-z0-9_]+$`. Method must be `GET|POST|PUT|PATCH|DELETE`. `argsLocation` must be `body|query`. `inputSchema` must pass the validator (string or object). `requiredScopes` apply only when `availableScopeIds` is passed (including an empty catalog). Unknown scopes are dropped when the catalog is non-empty; an empty catalog keeps the generated ids; omitted catalog leaves existing scopes. Duplicate scope ids collapse. Applied field count ignores skipped invalid fields.

## Tests that pin behaviour

- `toolHelpers.test.ts`: empty tool has no type; Teams empty tool may carry tenant id; graph consent merges draft id/name and does not copy non-Teams config; consent allowed for create, Teams type, or blank type with Teams draft.
- `toolConfigHelpers.test.ts`: file config empty; Teams needs team, tenant, and non-empty operations, optional inbound agent; Slack needs team and operations, bot token only on create; search accepts customer and legal-entity, rejects other entity types and bad max results, serializes numeric max results and optional prompt.
- `ragEmporixToolHelpers.test.ts`: blank entity type becomes `product`; predefined aliases normalize; custom ids stay trimmed; nested `emporixNativeToolConfig.entityType` is used when top-level is absent; invalid keys dropped; empty filter list valid.
- `schemaHelpers.test.ts`: predefined four types plus custom schemas; German label preferred when language is `de`; missing name falls back to id.
- `validateJsonSchema.test.ts`: empty ok; bad JSON; non-object root; object without schema keywords; valid schema; bad keyword values; unknown keywords do not throw.
- `slackRoutingHelpers.test.ts` / `teamsRoutingHelpers.test.ts`: one communication tool per agent; Slack cannot remove the last operation; Teams agent subset toggle; non-communication tools ignored.
- `teamsInstallCallback.test.ts`: hash and legacy callback URLs; edit route only for `/tools/{id}/edit`; draft ignored when `installStateId` mismatches; pending payload rejected without both ids.
- `mcpToolFromFunctionAssistantHelpers.test.ts`: fenced JSON; functionId kept; catalog filters scopes; empty catalog keeps scopes; undefined catalog skips scopes; invalid toolName skipped.
- `ToolCard.test.tsx`: reindex action on search and rag_emporix.
- `SearchToolSection.test.tsx`: labels bound to entity and max-results controls. No assertion of the 1–10 rule (that lives in `toolConfigHelpers.test.ts`).

## Not yet scanned

Section bodies: `SlackToolSection`, `TeamsToolSection`, `TeamsTeamIdGuide`, `SlackInstallSection`, `TeamsInstallCallbackHandler`, `RagEmporixToolSection`, `RagCustom*`, `RagFilterFieldsSection`, `RagFieldRowLayout`, `ToolGeneralSection`, `ToolTypeSection`, `ToolTokenSelect`, `ToolDetailSection`, `SearchToolSection` beyond its test title. `aiRagIndexerService` request shape. Rest of `useMcpToolFromFunctionAssistant` after helper-agent setup (stream apply, auto-generate). Zip loaders (`functionZipSource.helpers.ts` and siblings) — only test titles in `mcpToolInputSchemaFromZip.test.ts`, and that file does not import an `mcpToolInputSchemaFromZip` module. Agent-config screens that call the Slack/Teams toggle helpers. Whether `validateTool` is used on another screen.
