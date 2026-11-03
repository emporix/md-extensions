# Module: agents

Last scanned: c043b34 (2026-11-02)
Sources: `src/types/Agent.ts`, `src/constants/agentConstants.ts`, `src/services/agentService.ts`, `src/hooks/useAgents.ts`, `src/hooks/useAddAgentDialog.ts`, `src/hooks/useAgentConfig.ts`, `src/hooks/useDeleteConfirmation.ts`, `src/utils/agentHelpers.ts`, `src/utils/agentTemplateBundles.ts`, `src/utils/agentTriggerValidationHelpers.ts`, `src/utils/agentCollaborationHelpers.ts`, `src/utils/agentFilterDslHelpers.ts`, `src/utils/agentToolsHelpers.ts`, `src/utils/agentVersionHelpers.ts`, `src/utils/constants.ts`, `src/components/agent/AgentsView.tsx`, `src/components/agent/AgentDetailPage.tsx`, `src/components/agent/ImportAgentDialog.tsx`, `src/components/agent/agent-config/TriggersSection.tsx`, `src/components/agent/agent-config/ToolsSection.tsx`, `src/components/agent/agent-versions/AgentVersionsTab.tsx`

## Responsibility

Tenant custom agents and the template catalog in the Management Dashboard extension. List, create from a template or blank, edit, enable, delete, import, and roll back a saved version. Chat invoke lives in the chat module; this module only links an enabled saved agent to `#/assistants?agent=`.

## Flows

1. **List.** `useAgents` loads `GET .../agentic/templates` and `GET .../agentic/agents`. Custom agents sort by localized name (content language, then `en`, then first value). Templates render after `filterVisibleAgentTemplates`. Toggling a template card updates local state only. Toggling a custom agent `PATCH`es `/enabled`, then reloads; a failed patch reverts the card.

2. **Create from template.** Dialog steps: `form` → `loading` → `success` | `error`. Save calls `copyTemplateWithBundle`. Complaint and anti-fraud also copy missing helpers (`complaint-categorization`, `complaint-audit`; `anti-fraud-scoring`, `anti-fraud-audit`), then `PATCH` each helper `enabled: true`. The primary copy uses the operator id and edited name, description, and user prompt. Name and description keep only languages present in stored languages, keys lowercased. A missing helper template is `BundleHelperTemplateNotFoundError`. Success refreshes the custom list.

3. **Create blank.** `/agents/add` starts from `createEmptyAgent`: type `custom`, trigger `endpoint`, provider `emporix_openai`, recursion `20`, memory on, enabled. Save is a `PUT` with no change note. A valid save navigates to `/agents/{id}/edit`. HTTP 409 shows the id-already-exists message.

4. **Edit and save.** Tabs: general, model, triggers, tools, collaboration. Versions appear only after create. Conversations appear only when `hasConversations` for that agent id is true; a failed check hides the tab. Updates send a change note only when the note is non-blank. Save is disabled until the form is valid and dirty. `ApiClientError.disableable` asks to save the same payload with `enabled: false`. The Teams trigger already stored on the agent is kept when this agent is the default inbound owner for its Teams tools and the operator removed `teams` from the form (`useAgentConfig`).

5. **Delete.** An enabled agent cannot be deleted. Delete calls `DELETE` without `force`. `ApiClientError.force` opens a second confirm that retries `?force=true`.

6. **Import.** JSON file only (`application/json` or `.json`). Body is posted to `.../agentic/agents/import`. The summary lists agents, tools, and MCP servers from the result. Export exists on the service (`POST .../agents/export` with `agentIds`); the list screen does not call it.

7. **Versions.** `GET .../agents/{id}?allVersions=true`. The live row is `metadata.version` and sorts ahead of a historical row with the same number. Rollback `PUT`s the snapshot fields onto the live id, type, and live metadata version/timestamps. It requires a localized name, non-blank user prompt, at least one trigger, and an LLM model plus provider; otherwise the UI shows a missing-config error and does not call the API. A blank rollback note becomes the rollback i18n note. `modifiedBy.type === 'EXTERNAL'` is labeled as external; other authors use first+last name, else id, else the system label when type is `SYSTEM`.

8. **Test.** With feature toggle `aiAgentChat`, an existing enabled agent opens `#/assistants?agent={id}`. Creating or a disabled agent cannot.

## Rules

### Identity and copy

- Localized name and description must each have one non-blank value. User prompt and model must be non-blank. A new agent also needs an id.
- At least one trigger. Values from `getTriggerTypes`: `endpoint`, `commerce_events`, `slack`, `teams`. `teams` is hidden unless `toggles.msTeams`.
- `requiredScopes` choices in the trigger form: `anonymous`, `customer`, `employee`, `integration`.
- Output format is omitted when blank. Non-blank text must pass `isValidAgentOutputJsonSchema` (`src/utils/validateJsonSchema.ts`, not opened).
- `additionalParams` must be valid JSON. Empty becomes `null`.
- Default recursion limit `20`. Temperature is omitted from `llmConfig` when the operator disables it; otherwise it is a float, `0` when unparsable. Max tokens `0` when unparsable.

### Provider

- Providers: `anthropic`, `openai`, `google`, `emporix_openai`, `self_hosted_ollama`, `self_hosted_vllm`.
- Create requires a token id unless the provider is Emporix OpenAI or self-hosted. Updates do not require a token. Emporix OpenAI and self-hosted do not send `llmConfig.token`.
- Self-hosted requires a URL. OAuth mode sends `selfHostedParams.oauth` and clears header auth. Header mode sends header name and token id only when set. `baseProvider` is `anthropic` | `google` | `openai`, case-insensitive on load; unknown values become empty and are omitted on save.
- `fileProcessingConfig` is sent only when Responses API is on or `extraModelKey` is non-blank.

### Commerce events

- Selecting or clearing `commerce_events` resets events, filter, and event scopes.
- The trigger is valid only with at least one event. A filter may be absent. A present filter must pass `isCommerceFilterValid`.
- Persisted config is `{ events, filter?, eventScopes? }`. `eventScopes` is omitted when empty. `filter` is omitted when null.
- Leaf operators: `$eq`, `$ne`, `$in`, `$notIn`, `$exists`, `$notExists`, `$isEmpty`, `$notEmpty`. UI names: equals, notEquals, in, notIn, exists, notExists, isEmpty, notEmpty. Exists/empty operators drop `right`. `in` / `notIn` need a non-empty string array. Other value operators need a string, number, or boolean `right`. `left` must be a non-blank path.
- Compound operators: `$and`, `$or`, non-empty `conditions`. One leaf stays a leaf (`composeConditions`). Form editing applies to a leaf or a compound whose children are all leaves. Nested compounds fail `filterSupportsFormEditing`.
- Default new leaf is `{ left: '', op: '$ne', right: '' }`.
- Assistant reply JSON is accepted only when the whole trimmed message is one object, or a JSON string of one object (`extractFilterDslJsonFromAgentMessage`).

### Tools

- Predefined MCP is one entry per domain. Checking a tool creates the entry. Unchecking the last tool removes the entry. Tool ids stay sorted.
- Managed MCP is `custom` or `dynamic` with `mcpServer.id`. A disabled catalog server or native tool cannot be newly checked.
- Dynamic attachment with `tools` omitted or empty means every enabled catalog tool. Selecting the full enabled set stores the server without `tools`. Unchecking the last dynamic tool leaves the attachment (`toggleDynamicMcpTool` returns the previous list).
- `normalizeManagedMcpAttachments` upgrades a custom ref whose catalog type is dynamic, and downgrades a dynamic ref whose catalog type is custom, dropping `tools`.
- Native file tools and id `file_generator` are replaced in the picker by one built-in file tool id `file_generator`.
- Slack or Teams trigger is valid only with exactly one native tool of that type. Each selected Slack or Teams tool must have allowed operations (`areSlackAgentToolsValid`, `areTeamsAgentToolsValid`, and the per-tool helpers in `slackRoutingHelpers` / `teamsRoutingHelpers`, not opened). The tools form refuses to uncheck the last allowed operation.

### Collaboration

- A row is saved only when both agent id and description are non-blank. Description is trimmed.
- A selected agent without a prompt, or a prompt without an agent, blocks save. A fully empty row is allowed.
- Options exclude the current agent and agents already used on other rows. The row being edited stays selectable. The form keeps a trailing empty row once the last row has an agent.

### Versions diff

- Compared fields: name, description, icon, tags, enabled, requiredScopes, templatePrompt, userPrompt, llmConfig, triggers, mcpServers, nativeTools, agentCollaborations, maxRecursionLimit, enableMemory, outputFormat. Equal fields are omitted. Object key order does not count as a change. `null` displays as `null`; a missing field displays as empty. Unchanged context is 3 lines; a run is collapsed only when at least 2 lines would be hidden.
- Rollback defaults when the snapshot omits them: collaborations `[]`, recursion `20`, memory `false`, enabled `false`, tags `[]`, scopes `[]`. New agents default memory and enabled to true. That difference is in `buildRollbackAgent` versus `createEmptyAgent`.

### Fixed template agent ids

Copied from the matching template, then enabled: `agentic-commerce-events-filters-creator-assistant`, `json-schema-assistant`, `log-analysis-assistant`, `mcp-tool-from-function-assistant`, `emporix-chat-recommended-prompts-assistant`. Missing template throws that helper’s not-found key.

## Tests

Titles only. Assertion bodies were not opened.

| File | Pins |
|---|---|
| `src/services/agentService.test.ts` | Stream accumulates tokens; empty stream without an artifact throws; image-only reply is accepted; session header and `done.sessionId`; thinking clears on the next token; abort signal; stream `error` throws. Sync chat reads object or array `message`, keeps returned session, throws when message is empty. |
| `src/utils/agentTemplateBundles.test.ts` | Helper order for complaint and anti-fraud; primary vs helper; helpers hidden from the catalog. |
| `src/utils/agentTriggerValidationHelpers.test.ts` | Slack/Teams trigger requires exactly one matching tool; count ignored without that trigger. |
| `src/utils/agentCollaborationHelpers.test.ts` | Complete rows only; self/used agents excluded; trailing empty row; prompt required when an agent is selected. |
| `src/utils/agentFilterDslHelpers.test.ts` | Operator mapping; empty `in` rejected; events, scopes, and filter extracted separately; empty scopes omitted; compound `$and`; message must be a single JSON object. |
| `src/utils/agentToolsHelpers.test.ts` | Domain and native toggles; dynamic subset vs omit-tools; custom/dynamic normalize; file tool collapsed to one choice. |
| `src/utils/agentVersionHelpers.test.ts` | Live row first; rollback keeps live version number and returns null without model config; author fallback; key order ignored; null vs missing; collapse context. |

## Not yet scanned

`src/components/agent/agent-config/` except `TriggersSection.tsx` and `ToolsSection.tsx` (Filter DSL editor, model, basic info, save-note, JSON schema dialog). `src/components/agent/agent-versions/AgentVersionDiffDialog.tsx`, `AgentVersionDiffField.tsx`. Cards, add-agent steps, `ImportAgentDialog` result rendering past the JSON check, `McpServersSelector`, `NativeToolsSelector`, collaboration manager/form/list. `src/utils/slackRoutingHelpers.ts`, `src/utils/teamsRoutingHelpers.ts`, `src/utils/validateJsonSchema.ts`, `src/utils/llmAdditionalParamsHelpers.ts`. Test assertion bodies. Styles.
