# Module: mcp

Last scanned: c043b34 (2026-11-02)
Sources: `src/types/Mcp.ts`, `src/services/mcpService.ts`, `src/utils/mcpHelpers.ts`, `src/utils/mcpValidationHelpers.ts`, `src/hooks/useMcp.ts`, `src/hooks/useMcpConfig.ts`, `src/hooks/useDynamicMcpConfig.ts`, `src/components/mcp/McpPage.tsx` (routes), `src/components/mcp/McpDetailPage.tsx` (type switch and which hook saves), `src/components/mcp/McpToolsEditor.tsx` (add/remove/expand), `src/components/mcp/McpToolCard.tsx` (remove button), test titles in `src/utils/mcpHelpers.test.ts`. JSON Schema and MCP-tool-from-function draft rules are in `tools.md` (`validateJsonSchema.ts`, `mcpToolFromFunction*`).

## Responsibility

Tenant catalog of MCP servers agents can attach. Two managed types: `custom` (remote URL) and `dynamic` (tools this app defines, each invoking a cloud function). Transport enum: `sse | streamable_http`. Dynamic servers are still stored with a transport; save forces `streamable_http`.

API: `/ai-service/{tenant}/agentic/mcp-servers`. List sorted by name, case-insensitive. Save is PUT of a trimmed payload from `buildMcpServerUpsertPayload`, not the raw form object. Enable/disable is JSON Patch `REPLACE /enabled`, with `?force=true` only when disabling and the API sets `ApiClientError.force`. Delete uses the same force pattern. Optimistic toggle rolls back on other errors, then the list reloads.

## Main flows

1. List (`/mcp`) loads servers, toggles enabled, deletes with confirm.
2. Add (`/mcp/add`) picks a type. Switching type during create keeps id, name, and enabled and resets everything else (`switchMcpServerType`). Custom and dynamic forms are separate hooks; the page copies id/name across when the type changes.
3. Edit loads one server and binds `useMcpConfig` only when `type !== 'dynamic'`, and `useDynamicMcpConfig` only when `type === 'dynamic'`. Type cannot be switched once the server exists (`McpDetailPage` returns early unless `isCreating`).
4. Save validates with `validateMcpServer`, then upserts. Create replace-navigates to `/mcp/{id}/edit`.
5. Dynamic tools: editor starts with one empty tool. Add appends another and expands it. Remove is disabled when only one tool remains (`mcp_tool_remove_last_disabled`). Validation also rejects an empty `tools` array with that same message.
6. Generate-from-function fills a dynamic tool from cloud-function source. Draft rules are in `tools.md`. This scan did not open `GenerateMcpToolFromFunctionDialog.tsx` or the rest of `useMcpToolFromFunctionAssistant`.

Enabling a dynamic server from the list is refused locally when every tool is disabled (`mcp_validation_enabled_tool_required`), before the patch is sent.

## Key files

| Path | Role |
|---|---|
| `src/components/mcp/McpPage.tsx` | List, add, configure, delete/force |
| `src/components/mcp/McpDetailPage.tsx` | Type choice, custom vs dynamic save |
| `src/hooks/useMcp.ts` | List sort, patch enable, dynamic enable guard, force |
| `src/hooks/useMcpConfig.ts` | Custom URL form |
| `src/hooks/useDynamicMcpConfig.ts` | Dynamic tool list form |
| `src/services/mcpService.ts` | GET/PUT/PATCH/DELETE; PUT uses upsert payload |
| `src/utils/mcpHelpers.ts` | Empty models, payload, labels, counts |
| `src/utils/mcpValidationHelpers.ts` | Save-time throws (`ValidationError`) |
| `src/components/mcp/McpToolsEditor.tsx` | Tool cards; last tool cannot be removed |

Ids use `sanitizeIdInput` (word characters and hyphen, max 66). `validateCustomMcpServer` / `validateDynamicMcpServer` also require `isValidIdFormat` (`^[\w-]{1,66}$`).

## Module-specific rules

- `isDynamicMcpServer` is `type === 'dynamic'`. Missing type is treated as custom.
- Empty custom server: type `custom`, transport `streamable_http`, `config.url` empty string, enabled. Empty dynamic server: same transport, no `config`, one empty tool. `createEmptyMcpDraft` has no type and no config; the test says it is the untyped draft. Detail create uses the typed empties via `switchMcpServerType` (call site in the page was not line-read).
- Custom form valid when name and URL are non-blank, plus id when creating. Save still runs `validateMcpServer`, which also checks id format and `new URL(url)`.
- Custom PUT payload: trimmed name, `enabled` default true, `type: 'custom'`, transport, `config.url` trimmed. Authorization header name is omitted when blank. Token is sent only as `{ id }` when an id is set. Tools are not sent.
- Dynamic form valid when name is set, id is set while creating, `tools.length > 0`, every tool passes `isToolValid`, and if the server is enabled (`enabled ?? true`) at least one tool has `enabled !== false`.
- A disabled dynamic tool skips field checks. An enabled tool needs: name matching `^[A-Za-z0-9_]+$` (no spaces, hyphens, or other symbols), non-blank prompt, non-blank input schema that passes `validateAgentOutputJsonSchema` (see `tools.md`; blank schema is invalid here even though the validator treats blank text as valid), function id, and HTTP method.
- Tool names must be unique case-insensitively among tools that have a name. Disabled tools are still included in the duplicate check because `validateMcpTool` returns early but the name set still records `tool.name`.
- Empty dynamic tool defaults: enabled, `requiredScopes: []`, `inputSchema` `'{"type":"object"}'`, invocation `POST` + `body` + empty `functionId`. Loaded tools with `enabled !== false` become enabled. Missing schema/method/args become those defaults.
- Dynamic PUT: `type: 'dynamic'`, transport default `streamable_http` (the hook always sets that), no `config`. Each tool: trimmed name, description only if non-blank, prompt trimmed (empty string kept), `enabled` default true, `inputSchema` trimmed, `requiredScopes` only if at least one non-empty entry, invocation `functionId` trimmed, method default `POST`, `argsLocation` omitted when falsy.
- `getEnabledDynamicToolNames` skips `enabled === false` and empty names. `undefined` tools yield `[]`. `getDynamicMcpToolCounts` treats missing `enabled` as enabled.
- Badge: dynamic servers show the dynamic tag; custom servers show the transport label. Unknown transport labels are `String(transport).toUpperCase()`. Description for custom is URL and authorization header name, or the generic custom label when both are empty. Dynamic description is enabled/total counts.
- Invocation methods: `GET | POST | PUT | PATCH | DELETE`. Args location: `body | query`.
- `useMcpConfig.handleSave` returns immediately if the loaded server is dynamic. `useDynamicMcpConfig` always writes `type: 'dynamic'` and `config: undefined`.

## Tests that pin behaviour

`mcpHelpers.test.ts`:

- Untyped draft has no connection config.
- Empty custom server shape; empty dynamic server has one tool.
- Custom upsert payload has no `tools`. Dynamic upsert payload has no `config`.
- Omitted tool `enabled` becomes true in the payload.
- Known transports translate; unknown transport is uppercased; both options exist.
- Type switch keeps id and name; switching back to custom resets dynamic fields.
- Enabled names skip disabled tools and blank names; undefined tools yield `[]`.
- Name pattern allows letters, digits, underscore; rejects whitespace, hyphen, other symbols.

No component test for MCP was found under `src/components/mcp/`. No test file for `mcpValidationHelpers.ts`. Duplicate-name and “at least one enabled tool” rules are in the validator and the dynamic hook, not in `mcpHelpers.test.ts`.

## Not yet scanned

`McpGeneralSection.tsx`, `McpConnectionSection.tsx`, `McpTypeSection.tsx`, `McpAuthTokenSelect.tsx`, `McpToolForm.tsx`, `McpToolInvocationSection.tsx`, `McpToolInputSchemaField.tsx`, `McpToolRequiredScopesField.tsx`, `GenerateMcpToolFromFunctionDialog.tsx`, `mcp-servers/McpServersList.tsx`, `mcp-servers/McpServerForm.tsx`, `McpRequiredMark.tsx`. How agents attach managed servers (`agentToolsHelpers.ts` was not opened). Cloud-function picker loading and IAM scope catalog inside the tool form. Full generate-from-function hook after the provisioning setup.
