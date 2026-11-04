# UI

Last scanned: c043b34 (2026-11-02)

Sources: `src/RemoteComponent.tsx`, `src/main.tsx`, `src/App.tsx`, `src/constants/paths.ts`, `src/contexts/AppStateContext.tsx`, `src/contexts/FeatureTogglesContext.tsx`, `src/contexts/IamScopesContext.tsx`, `src/contexts/ToastContext.tsx`, `src/hooks/useMyIamScopes.ts`, `src/hooks/useIamScopes.ts`, `src/hooks/useAgentConfig.ts`, `src/hooks/useToolConfig.ts`, `src/hooks/useMcpConfig.ts`, `src/hooks/useDynamicMcpConfig.ts`, `src/hooks/useTokenConfig.ts`, `src/hooks/useOAuthConfig.ts`, `src/hooks/useReindexJobs.ts`, `src/hooks/useDeleteConfirmation.ts`, `src/utils/validation.ts`, `src/utils/mcpValidationHelpers.ts`, `src/utils/mcpHelpers.ts`, `src/utils/toolConfigHelpers.ts`, `src/utils/agentChatHelpers.ts`, `src/utils/agentTriggerValidationHelpers.ts`, `src/utils/agentFilterDslHelpers.ts`, `src/utils/validateJsonSchema.ts`, `src/utils/constants.ts`, `src/utils/communicationRoutingHelpers.ts`, `src/utils/teamsAppPackageUrl.ts`, `src/services/featureToggleService.ts`, `src/types/Agent.ts`, `src/types/Mcp.ts`, `src/types/Tool.ts`, `src/components/agent/AgentsView.tsx`, `src/components/agent/AgentDetailPage.tsx`, `src/components/agent/CustomAgentCard.tsx`, `src/components/agent/agent-config/TriggersSection.tsx`, `src/components/agent/agent-versions/AgentVersionsTab.tsx`, `src/components/chat/AgentChatPage.tsx`, `src/components/tool/ToolsPage.tsx`, `src/components/tool/ToolDetailPage.tsx`, `src/components/tool/ToolTypeSection.tsx`, `src/components/tool/TeamsInstallCallbackHandler.tsx`, `src/components/token/TokensPage.tsx`, `src/components/oauth/OAuthsPage.tsx`, `src/components/mcp/McpPage.tsx`, `src/components/mcp/McpDetailPage.tsx`, `src/components/mcp/McpTypeSection.tsx`, `src/components/mcp/McpToolInvocationSection.tsx`, `src/components/log/LogsPage.tsx`, `src/components/log/LogDetailsPage.tsx`, `src/components/log/JobDetailsPage.tsx`, `src/components/log/SessionFlowPage.tsx`, `src/components/shared/BasePage.tsx`, `src/components/shared/MetricsPanel.tsx`, `src/components/shared/AnalyzeLogsDialog.tsx`, `src/translations/en/index.ts`

Router is a `HashRouter` inside the remote. Paths below are hash paths (`#/agents`), not host browser paths.

## Shell

`src/main.tsx` mounts `App`. Standalone `App` asks for tenant, token, language, and content language, stores them in `localStorage`, then renders `RemoteComponent`. Host embed passes the same four fields on `appState`. Language is `en` or `de`; anything else becomes `en`.

No in-extension sidebar. Area switching is host navigation plus in-page links. `src/constants/paths.ts` only defines the host path `/administration/hosting`, opened from a dynamic MCP tool form.

## Provider order

`AppStateProvider` → `FeatureTogglesProvider` → `IamScopesProvider` → `ToastProvider` → `HashRouter`.

`TeamsInstallCallbackHandler` sits inside the router on every route. It reads a Teams Graph consent return on the page URL and replaces the hash route with the matching tool add or edit path.

Toasts are success, error, info, warning. They do not call a backend.

## Feature flags

Loaded once per tenant from the feature-toggle list. A failed load treats every flag as off and does not cache, so the next sync tries again. A success is cached for that tenant even if the token changes.

| Flag code | UI effect |
|---|---|
| `ms-teams` | Teams tool type and Teams agent trigger stay in the pickers. An already-saved Teams tool or trigger still shows when the flag is off. |
| `emporixHosting` | Dynamic MCP server type stays in the picker. An already-saved dynamic server still shows when the flag is off. |
| `ai-agent-chat` | Agent edit shows Test. It opens `#/assistants?agent=<id>` and is disabled while the agent is new or disabled. |

`isToggleValid(code)` exists on the toggles context. Call sites use the three named flags above.

## Client permission checks

Routes are not wrapped in a permission gate.

Chat (`/assistants`) loads the signed-in user's scopes. Scope id `ai.agent_manage` shows every custom agent and enables Edit (hash link to `/agents/:id/edit`). Without that scope, the picker shows only agents tagged `chat`, and Edit stays disabled.

Before send, chat may ask to change the agent: customer-only required scopes get an `employee` scope added; a missing `endpoint` trigger gets one added. Accept patches the agent, then sends. That patch is not limited to `ai.agent_manage` in the chat page.

Required-scope choices on the agent form are fixed: `anonymous`, `customer`, `employee`, `integration`. UI copy says anonymous needs no extra chat scope, customer needs `ai.agentexecution_manage_own`, employee and integration need `ai.agentexecution_manage`, and commerce events skip that check. The extension does not enforce those execution scopes itself.

Commerce-event scope picker uses the signed-in user's scopes, and only while the commerce trigger is selected. Dynamic MCP tools pick required scopes from the tenant scope catalog (`useIamScopes`), not from the signed-in user list.

## Routes

`/` redirects to `/agents`. Unknown paths: unknown — not found in `src/RemoteComponent.tsx` (no catch-all).

### `/agents`

List of the tenant's custom agents and visible predefined templates. User can enable or disable, open edit, delete (with a second confirm when the API marks the delete as force), export one agent as a JSON download, import a JSON export, add a template copy, or open a blank agent at `/agents/add`. A card can jump to `#/logs/sessions?agentId=<id>`.

### `/agents/add` and `/agents/:agentId/edit`

Create or edit one agent. Save stays disabled until the form is valid and dirty. Create saves immediately. Edit asks for an optional change note. HTTP 409 shows an id-already-exists message. If the API marks the save as disableable, the user can save the same agent disabled.

Tabs: General, Model, Triggers and constraints, Tools, Collaboration. Edit also has Versions (list, diff, rollback by saving that version). Conversations appears only when this agent already has at least one conversation; rows open `#/logs/sessions/:sessionId`.

General: localized name and description, id (create only), prompt, optional output JSON Schema, tags, icon. A helper can draft the schema.

Model: provider `anthropic` | `openai` | `google` | `emporix_openai` | `self_hosted_ollama` | `self_hosted_vllm`, model, temperature (optional per provider), max tokens, recursion limit, memory, extra JSON params. Non-Emporix cloud providers need a token on create. Self-hosted needs a URL and either an OAuth client or a header name plus token, plus optional file-processing options.

Triggers: at least one of `endpoint`, `commerce_events`, `slack`, `teams` (Teams gated). Commerce needs at least one event and a valid filter when a filter is present. Slack or Teams trigger is valid only with exactly one matching native tool, and that tool must have allowed operations. Commerce can open a helper that writes the filter.

Tools: pick MCP servers and native tools.

Collaboration: other agents this agent may call. Incomplete rows block save.

Versions rollback writes the chosen version back through the agent save API.

### `/assistants`

Chat with an enabled agent. Query `agent` preselects one when it is enabled and the transcript is empty. User sends text, stops a stream, sees thinking and tool activity, and downloads ready image or file artifacts. Recommended prompts appear when the recommendations helper agent is enabled. Agents hidden by the chat scope rule are not in the picker.

### `/tools`

List tools. Enable or disable (force confirm when the API asks), delete (same force confirm), open edit, add. RAG tools can start a reindex; the list polls until success or failure and blocks another reindex for that entity type while one is active. Missing entity type is an error toast.

### `/tools/add` and `/tools/:toolId/edit`

Create or edit. Type picker: `slack`, `teams` (flag), `rag_custom`, `rag_emporix`, `search`. Type `file` is not in the picker; an existing file tool still opens a settings note and is treated as valid. Id is sanitized to letters, digits, underscore, hyphen, max 66. One Slack workspace or one Teams team+tenant cannot be reused by another tool.

Slack: team id, bot token on create, at least one allowed operation, install redirect to Slack. Teams: team id, tenant id, allowed operations, install status polling, Graph admin consent, local app package by Vite mode. RAG custom: prompt, max results 1–100, database URL, collection, tokens, embedding model. RAG Emporix: prompt, indexed fields, optional filter fields, embedding provider (Emporix OpenAI, OpenAI, or self-hosted Ollama) with model, dimensions, URL, and token as that provider requires. Search: entity `customer` or `legal-entity`, max results 1–10.

Conversations tab for Slack or Teams only, and only when conversations exist.

After a Teams save, the editor reloads agents. A Teams consent return replaces the route with this tool's add or edit path.

### `/tokens`, `/tokens/add`, `/tokens/:tokenId/edit`

List, add, edit, delete (force confirm when the API asks). No enable switch. Save checks id and name. Token value is sent on save and is not checked by `validateToken`. Id input is sanitized like other ids.

### `/oauth`, `/oauth/add`, `/oauth/:oauthId/edit`

List, add, edit, enable or disable, delete. Force confirms when the API asks. Save requires id, URL, client id, and grant type. The only grant type in the model is `client_credentials`. Optional scope and a client-secret token reference. Id input is sanitized.

### `/mcp`, `/mcp/add`, `/mcp/:mcpServerId/edit`

List, add, edit, enable or disable, delete. Force confirms when the API asks.

Type `custom`: id, name, URL, transport `sse` or `streamable_http`, optional auth header and token. Type `dynamic` (hosting flag): id, name, transport fixed to `streamable_http`, and at least one tool. An enabled server needs at least one enabled tool. Enabled tools need a name matching `^[A-Za-z0-9_]+$`, unique names, prompt, JSON Schema input, cloud function id, and HTTP method. A helper can draft a tool from a function. The function picker links to host `/administration/hosting`. Hosting functions 403 surfaces as feature disabled. Scopes come from the tenant catalog.

### `/logs` → `/logs/requests`

`/logs` redirects to `/logs/requests`. One page, three tabs, each with its own path. Filters, sort, and cursors live in the query string and reset when the tab changes. Optional `agentId` titles the page with the agent name and shows Back to agents. Refresh reloads the active tab. A metrics panel shows resolution efficiency, session severity, and session error trend for that agent or for all agents.

Requests: cursor list of request summaries. A row opens `/logs/requests/:logId`.

Jobs: cursor list. A row opens `/logs/jobs/:jobId`. Log tables can open an analyze-logs helper.

Sessions: cursor list. A row opens `/logs/sessions/:sessionId`.

### `/logs/requests/:logId`

Read-only request: agent, session, request id, duration, token counts, message timeline. Back keeps the list query.

### `/logs/jobs/:jobId`

Read-only job, plus the request log for the job's request id when that lookup works. A failed log lookup is logged and leaves the log empty.

### `/logs/sessions/:sessionId`

Session timeline. A message click resolves the request id to a request log and opens `/logs/requests/:logId`, remembering which message to scroll to.

## Area to service

| Area | Calls |
|---|---|
| Agents list, import, export, enable, delete | `agentService` |
| Agent form catalogs | `agentService` (commerce events), `modelsService`, `tokensService`, `oauthService`, `toolsService`, `mcpService`, `iamScopesService` (current user) |
| Agent versions | `agentService` |
| Agent conversations tab | `conversationsService` |
| Chat and helpers (schema, filter, log analysis, MCP-from-function, recommendations) | `agentService` chat and template copy; recommendations also `fetchEventSubscriptions` |
| Chat artifacts | `apiClient` media download |
| Tools list and reindex | `toolsService`, `indexingService` |
| Tool form | `toolsService`, `schemaService`, `aiRagIndexerService`, `agentService` |
| Tokens | `tokensService` |
| OAuth | `oauthService` |
| MCP | `mcpService`, `hostingFunctionsService`, `iamScopesService` (catalog), `tokensService`, `agentService` (helper) |
| Logs, jobs, session flow | `logService`, `jobService`, `analyticsService`, `agentService` (names) |
| Flags and scopes at startup | `featureToggleService`, `iamScopesService` |

## Not yet scanned

Slack and Teams allowed-operation catalogs, commerce filter operator rules beyond “a present filter must be valid”, collaboration row rules, import dialog field checks, add-from-template wizard steps, rich chat renderers (Mermaid, Vega, CSV, JSON), log table columns and filters, and host dashboard menu entries (not in this repo).
