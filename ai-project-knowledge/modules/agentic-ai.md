# Agentic AI

Last scanned: da99643 (2026-11-02)
Sources: `agentic-ai/README.md`, `agentic-ai/src/RemoteComponent.tsx`, `agentic-ai/src/types/`, `agentic-ai/src/services/`, `agentic-ai/src/utils/constants.ts`, `agentic-ai/src/utils/validation.ts`, `agentic-ai/src/utils/agentChatHelpers.ts`, `agentic-ai/src/utils/agentTriggerValidationHelpers.ts`, `agentic-ai/src/utils/agentTemplateBundles.ts`, `agentic-ai/src/utils/agentVersionHelpers.ts`, `agentic-ai/src/utils/agentCollaborationHelpers.ts`, `agentic-ai/src/utils/agentFilterDslHelpers.ts`, `agentic-ai/src/utils/agentToolsHelpers.ts`, `agentic-ai/src/utils/toolConfigHelpers.ts`, `agentic-ai/src/utils/mcpValidationHelpers.ts`, `agentic-ai/src/utils/mcpHelpers.ts`, `agentic-ai/src/utils/slackRoutingHelpers.ts`, `agentic-ai/src/utils/teamsRoutingHelpers.ts`, `agentic-ai/src/utils/teamsInstallCallback.ts`, `agentic-ai/src/hooks/useAgentConfig.ts`, `agentic-ai/src/hooks/useAgents.ts`, `agentic-ai/src/hooks/useAgentChat.ts`, `agentic-ai/src/hooks/useDeleteConfirmation.ts`, `agentic-ai/src/hooks/useHelperAgentProvisioning.ts`, `agentic-ai/src/components/agent/AgentsView.tsx`, `agentic-ai/src/components/agent/AgentDetailPage.tsx`, `agentic-ai/src/components/chat/AgentChatPage.tsx`, `agentic-ai/src/components/tool/ToolsPage.tsx`, `agentic-ai/src/components/mcp/McpTypeSection.tsx`, `agentic-ai/src/components/log/LogsPage.tsx`

Management Dashboard extension for tenant AI agents. Host passes `tenant`, `language`, `token`, and `contentLanguage` (`agentic-ai/src/types/common.ts`, `agentic-ai/src/RemoteComponent.tsx`). UI language is `en` or `de`; anything else becomes `en`. API base is `VITE_API_URL`, default `https://api.emporix.io`. Calls send `Authorization: Bearer` (host token), `Emporix-tenant`, and `Content-Language` / `Accept-Language` `*` (`agentic-ai/src/services/apiClient.ts`). `.env*` files were not opened. Teams app zip is chosen by Vite `MODE`: `dev`/`development` → dev, `stage` → stage, otherwise prod (`agentic-ai/src/utils/teamsAppPackageUrl.ts`). `README.md` still describes a time trigger and an older folder layout; selectable triggers in code are endpoint, commerce events, Slack, and Teams (`agentic-ai/src/utils/constants.ts`).

Hash routes (`agentic-ai/src/RemoteComponent.tsx`): `/` → `/agents`; `/agents`, `/agents/add`, `/agents/:agentId/edit`; `/assistants`; `/tools`, `/tools/add`, `/tools/:toolId/edit`; `/tokens` and `/tokens/:tokenId/edit`; `/oauth` and `/oauth/:oauthId/edit`; `/mcp` and `/mcp/:mcpServerId/edit`; `/logs` → `/logs/requests`; `/logs/jobs`, `/logs/sessions`, plus request, job, and session detail routes.

## Feature gates and scopes

Toggles come from `GET /feature-toggle/{tenant}/features` (page size 1000). Codes: `ms-teams`, `emporixHosting`, `ai-agent-chat`. A failed load is treated as all off (`agentic-ai/src/services/featureToggleService.ts`). Teams trigger and Teams tool type are hidden unless `ms-teams` is on; an existing Teams selection stays visible (`agentic-ai/src/components/agent/agent-config/TriggersSection.tsx`, `agentic-ai/src/components/tool/ToolTypeSection.tsx`). Dynamic MCP is hidden unless `emporixHosting` is on, same exception (`agentic-ai/src/components/mcp/McpTypeSection.tsx`). The agent Test button is shown only when `ai-agent-chat` is on, and only for a saved enabled agent; it opens `#/assistants?agent={id}` (`agentic-ai/src/components/agent/AgentDetailPage.tsx`).

Scope catalog: `GET /iam/{tenant}/scopes` (page size 1000). Caller scopes: `GET /iam/{tenant}/users/me/scopes`, split on whitespace, `tenant=` tokens dropped (`agentic-ai/src/services/iamScopesService.ts`). Chat list: callers with `ai.agent_manage` see every custom agent; others see only agents whose tags include `chat` (case-insensitive). Edit-from-chat needs that manage scope (`agentic-ai/src/utils/agentChatHelpers.ts`).

## Agents

Actor: dashboard user for the current tenant.

List shows custom agents and predefined templates. Template cards that are bundle helpers are hidden (`agentic-ai/src/utils/agentTemplateBundles.ts`, `agentic-ai/src/components/agent/AgentsView.tsx`). Complaint copies also create `complaint-categorization` and `complaint-audit` when missing. Anti-fraud copies `anti-fraud-scoring` and `anti-fraud-audit`. Helpers are created with the template id, then enabled. A missing helper template fails the copy (`agentic-ai/src/services/agentService.ts`). Template enable switches in the UI change local state only; they do not call the API (`agentic-ai/src/hooks/useAgents.ts`).

Create from a template: user supplies id, localized name and description, and user prompt. `POST /ai-service/{tenant}/agentic/templates/{templateId}/agents`. Localized fields are kept only for languages in `localStorage` key `config` (`languages`); if none, English (`agentic-ai/src/hooks/useLanguages.ts`, `agentic-ai/src/services/agentService.ts`). Blank template copy does not auto-enable. Dialog steps: form, loading, success, error (`agentic-ai/src/hooks/useAddAgentDialog.ts`).

Create or update a custom agent: `PUT /ai-service/{tenant}/agentic/agents/{id}`. Id pattern is 1–66 letters, digits, underscores, or hyphens (`agentic-ai/src/utils/validation.ts`). HTTP 409 on save is shown as id already exists. A response detail of type `disableable` asks the user to save with `enabled` false (`agentic-ai/src/hooks/useAgentConfig.ts`). New agents save without a change note; updates send an optional note on metadata (`agentic-ai/src/components/agent/AgentDetailPage.tsx`). Enable toggle is `PATCH` replace `/enabled`. An enabled agent cannot be deleted from the list. Delete is `DELETE` the agent; a response detail of type `force` asks for `?force=true` (`agentic-ai/src/hooks/useDeleteConfirmation.ts`).

Detail tabs: general, model, triggers and constraints, tools, collaboration. Versions appear when editing. Conversations appear only when `hasConversations` is true for that agent (`agentic-ai/src/components/agent/AgentDetailPage.tsx`). Save requires a name and description in some language, a user prompt, a model, at least one trigger, valid collaborations, valid output JSON Schema when set, and valid additional-params JSON. Create also requires an id, and a token unless the provider is Emporix OpenAI or self-hosted (`agentic-ai/src/hooks/useAgentConfig.ts`).

Versions load with `?allVersions=true`. Rows are the live version plus snapshots, newest first. Rollback builds a full agent from the chosen snapshot and the live metadata version, then upserts. It is refused in the client when name, user prompt, triggers, or model and provider are missing. Missing recursion becomes 20, memory false, enabled false. The change note defaults to a rollback label when the user leaves it blank (`agentic-ai/src/utils/agentVersionHelpers.ts`, `agentic-ai/src/components/agent/agent-versions/AgentVersionsTab.tsx`). Versioned fields include prompts, LLM config, triggers, MCP, native tools, collaborations, scopes, memory, recursion, and output format.

Collaboration rows need both agent id and description, or neither. The current agent and already chosen agents are omitted (`agentic-ai/src/utils/agentCollaborationHelpers.ts`). Empty rows are dropped on save.

Export from a custom-agent card posts `{ agentIds: [id] }` and downloads JSON `{ exportedAt, data, checksum }` (`agentic-ai/src/components/agent/CustomAgentCard.tsx`). Import accepts a `.json` file and posts the parsed body. Result states: `ENABLED`, `DISABLED`, `TO_CREATE`, `EXISTS`, `FAILED`. Detail codes: `MISSING_FUNCTION`, `MISSING_TOKEN`, `NOT_IMPORTABLE`, `ALREADY_EXISTS`, `AGENT_IMPORTED_DISABLED`, `IMPORT_FAILED` (`agentic-ai/src/types/common.ts`, `agentic-ai/src/components/agent/ImportAgentDialog.tsx`).

## Triggers and LLM

Trigger values: `endpoint`, `commerce_events`, `slack`, `teams`. At least one is required. Slack or Teams requires exactly one native tool of that type (`agentic-ai/src/utils/agentTriggerValidationHelpers.ts`). An agent may attach at most one Slack tool and at most one Teams tool. Unchecking the last allowed operation on Slack is blocked; Teams can be reduced in the helper without that floor (`agentic-ai/src/utils/slackRoutingHelpers.ts`, `agentic-ai/src/utils/teamsRoutingHelpers.ts`). Slack defaults: `sendMessage`, `createChannel`, `inviteParticipants`, `collaborateOnChannel`. Teams adds `createChat` and `collaborateOnChat`.

Commerce trigger config is `{ events, filter?, eventScopes? }`. At least one event is required. Events come from `GET /ai-service/{tenant}/agentic/commerce-events`. Event scopes are IAM scopes. Filter DSL leaves use `$eq`, `$ne`, `$in`, `$notIn`, `$exists`, `$notExists`, `$isEmpty`, `$notEmpty`. Compounds are `$and` / `$or`. Exists and empty operators take no value; `in` / `notIn` need a non-empty list (`agentic-ai/src/utils/agentFilterDslHelpers.ts`). Event schema catalog is `GET /webhook/{tenant}/event-subscriptions`.

Providers: `anthropic`, `openai`, `google`, `emporix_openai`, `self_hosted_ollama`, `self_hosted_vllm` (`agentic-ai/src/types/Agent.ts`). Catalog `GET /ai-service/{tenant}/agentic/models` covers OpenAI (also Emporix OpenAI), Anthropic, and Google. Self-hosted providers are free-text models plus a required URL and optional `baseProvider` (`anthropic`, `google`, `openai`). Auth is either an OAuth id or an authorization header name plus token id. Optional file-processing flag `useResponsesApi` and `extraModelKey` (`agentic-ai/src/hooks/useAgentConfig.ts`, `agentic-ai/src/utils/llmModelHelpers.ts`). Temperature slider is 0.0–1.0 in 0.1 steps and is omitted from the payload when disabled. Recursion slider is 1–100; a non-numeric value is saved as 20. Max tokens are a free number; a non-numeric value is saved as 0. Memory is a boolean. Emporix OpenAI does not send a token.

Output format, when non-blank, must be a JSON object that is a JSON Schema and includes a recognized root keyword (`agentic-ai/src/utils/validateJsonSchema.ts`).

## Tools

Tool types: `slack`, `teams`, `rag_custom`, `rag_emporix`, `search` (`agentic-ai/src/components/tool/ToolTypeSection.tsx`). CRUD: list/get/put/patch/delete `/ai-service/{tenant}/agentic/tools`. Delete and disable can be forced. Enabling a tool does not use the force prompt (`agentic-ai/src/hooks/useTools.ts`).

Slack save needs `teamId`, at least one allowed operation, and `botToken` on create. Install opens Slack OAuth v2 with scopes for mentions, channels, chat, groups, and users, using `clientId` and `state` from `GET .../agentic/oauth/installations/slack` (`agentic-ai/src/components/tool/SlackInstallSection.tsx`).

Teams save needs `teamId`, `tenantId`, and at least one allowed operation. Install data: `GET .../oauth/installations/teams` (`providerTenantId`, `toolId`, `toolPersisted`). Status values: `pending`, `ready`, `missing`. The UI polls status for up to 5 minutes every 2.5 seconds (`agentic-ai/src/utils/teamsInstallCallback.ts`). Graph consent returns on `teamsGraphConsent` (`success`, `error`, or `unknown`) and is applied when creating or when the tool is Teams. The app package is a bundled zip, not a secret.

`rag_emporix`: prompt, at least one indexed field, valid filter keys (`^[a-zA-Z0-9_.-]+$`). Custom mixin keys must start with `mixins.`. Indexed keys cannot overlap a selected parent or child path. Entity types: `product` (default), `order`, `customer`, `legal-entity`, plus custom schema ids. Embedding providers: `emporix_openai` (no extra fields), `openai` (model, dimensions 128–4096, token), `self_hosted_ollama` (those plus URL). Nested `emporixNativeToolConfig` is merged onto the form on load (`agentic-ai/src/utils/toolConfigHelpers.ts`, `agentic-ai/src/utils/ragEmporixToolHelpers.ts`). Reindex is offered from the tools list: `POST /indexing/{tenant}/reindex-jobs` with `{ entityType, rag: true }` when an entity type is set. Jobs in `IN_PROGRESS`, `PENDING`, or `PUBLISHED` block another reindex for that type until `SUCCESS` or `FAILURE` (`agentic-ai/src/components/tool/ToolsPage.tsx`, `agentic-ai/src/hooks/useReindexJobs.ts`). Field catalogs: `GET /ai-rag-indexer/{tenant}/{entityType}/rag-metadata` and `.../filter-metadata`. A separate indexer reindex `POST .../{entityType}/reindex` exists in `aiRagIndexerService.ts`; the tools page uses the indexing service.

`rag_custom`: prompt, max results 1–100 (default 5), Qdrant URL, collection, database token, embedding model and token. Default entity type on the database config is `product` (`agentic-ai/src/types/Tool.ts`).

`search`: entity type `customer` or `legal-entity` (default customer), max results integer 1–10 (default 5), optional prompt.

## MCP servers

Managed types: `custom` and `dynamic`. Agent attachments also use `predefined` (`agentic-ai/src/types/Agent.ts`, `agentic-ai/src/types/Mcp.ts`). CRUD: `/ai-service/{tenant}/agentic/mcp-servers`. Same force-delete and force-disable pattern as tools. A dynamic server cannot be enabled when it has no enabled tool (`agentic-ai/src/hooks/useMcp.ts`).

Custom: id, name, URL. Transport `sse` or `streamable_http` (draft default streamable HTTP). Optional authorization header name and token id (`agentic-ai/src/utils/mcpHelpers.ts`).

Dynamic: id, name, at least one tool. An enabled server needs an enabled tool. Tool names match `^[A-Za-z0-9_]+$` and are unique ignoring case. Enabled tools need prompt, JSON Schema input, function id, and HTTP method (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`). Args location is `body` or `query`. Disabled tools skip field checks. Default new tool is POST body and schema `{"type":"object"}` (`agentic-ai/src/utils/mcpValidationHelpers.ts`). Optional `requiredScopes` are filtered to the IAM catalog when a generated draft is applied (`agentic-ai/src/utils/mcpToolFromFunctionAssistantHelpers.ts`). Functions: `GET /automation/{tenant}/projects/functions` (404 is an empty list, 403 means hosting disabled). Deployments: `.../functions/{id}/deployments` (`github` or `media`). Media zips download from `GET /media/{tenant}/assets/{mediaId}/download`, capped at 20 MB (`agentic-ai/src/services/hostingFunctionsService.ts`, `agentic-ai/src/constants/zipLimits.ts`). Hosting UI link is `/administration/hosting` (`agentic-ai/src/constants/paths.ts`).

On an agent, predefined domains are customer, order, product, frontend, extensibility, and import tool, each with a fixed tool id list (`agentic-ai/src/utils/constants.ts`). Checking a tool adds `{ type: 'predefined', domain, tools }`. Custom and dynamic servers attach by id. A dynamic attachment with no tool list means all currently enabled tool names (`agentic-ai/src/utils/agentToolsHelpers.ts`).

## Tokens and OAuth

Tokens: id, name, and value required on create. Later saves send name only, so the secret is not rewritten from the form (`agentic-ai/src/hooks/useTokenConfig.ts`). `PUT /ai-service/{tenant}/agentic/tokens/{id}`. Delete supports `force`.

OAuth: id, URL, client id, grant type. The only enum value is `client_credentials`. Scope and client-secret token id are optional. Enabled defaults to true (`agentic-ai/src/utils/oauthHelpers.ts`, `agentic-ai/src/services/oauthService.ts`). Patch and delete support `force`.

## Chat

`/assistants` streams `POST /ai-service/{tenant}/agentic/chat-stream` with `{ agentId, message }` and optional header `session-id`. Events: `token`, `thinking`, `tool_start`, `tool_end`, `error`, `done` (done carries `sessionId`). Empty text is an error. HTTP 400, or an error whose message contains `error code: 400`, falls back to `POST .../agentic/chat` (`agentic-ai/src/hooks/useAgentChat.ts`, `agentic-ai/src/utils/errorHelpers.ts`). The user can stop the stream. Switching agent with an existing transcript asks for confirmation (`agentic-ai/src/components/chat/AgentChatPage.tsx`).

Before send, two gates can be confirmed one at a time. If `requiredScopes` is exactly `customer`, the client patches in `employee`. If there is no `endpoint` trigger, it patches one in (`agentic-ai/src/utils/agentChatHelpers.ts`).

Recommended prompts use helper agent `emporix-chat-recommended-prompts-assistant`. Other helpers, created from templates and then enabled: `agentic-commerce-events-filters-creator-assistant`, `json-schema-assistant`, `log-analysis-assistant`, `mcp-tool-from-function-assistant` (`agentic-ai/src/constants/agentConstants.ts`). If create returns 409, the client enables the existing agent (`agentic-ai/src/hooks/useHelperAgentProvisioning.ts`).

## Logs, jobs, conversations

Request logs, sessions, and jobs use cursor headers. Request list fields omit message bodies. Severity filter is exact (`INFO`, `WARNING`, `ERROR`). Session list defaults to `metadata.modifiedAt` descending (`agentic-ai/src/services/logService.ts`). Jobs: `/ai-service/{tenant}/jobs`, types `import`, `export`, `agent_chat`, statuses `success`, `failure`, `in_progress`, `skipped` (`agentic-ai/src/constants/logConstants.ts`). Job detail may load the matching request log by `requestId`. Session detail is a timeline of that session (`agentic-ai/src/components/log/SessionFlowPage.tsx` route only; grouping rules not fully read).

Analytics: `GET /ai-service/{tenant}/agentic/analytics?agentId=`. Cached 5 minutes. Dashboard uses session severity, session error trend, and requests-per-session (`agentic-ai/src/services/analyticsService.ts`).

Conversations: `GET /ai-service/{tenant}/agentic/conversations`, default sort `lastMessageAt` descending, optional `agentId` and `toolId`. Total count is read from response headers (`agentic-ai/src/services/conversationsService.ts`).

Custom entity labels for RAG: `GET /schema/{tenant}/custom-entities` page size 2000 (`agentic-ai/src/services/schemaService.ts`).

## Not yet scanned

Chat rich-content rendering (Markdown, Mermaid, Vega-Lite, CSV), log-analysis and JSON-schema assistant prompt bodies, MCP-from-function zip parsing, session-flow grouping, reindex poll interval, conversations tab UI, OAuth/token/MCP page chrome, slider CSS, translations, styles, and test bodies beyond the rules cited above.
