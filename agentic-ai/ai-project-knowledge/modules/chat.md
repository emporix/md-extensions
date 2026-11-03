# Module: chat

Last scanned: c043b34 (2026-11-02)
Sources: `src/components/chat/AgentChatPage.tsx`, `src/components/chat/AssistantMessageContent.tsx`, `src/components/chat/ChatMessageArtifacts.tsx`, `src/hooks/useAgentChat.ts`, `src/hooks/useConversations.ts`, `src/hooks/useSessions.ts`, `src/hooks/useSessionFlow.ts`, `src/hooks/useChatRecommendations.ts`, `src/services/agentService.ts`, `src/services/conversationsService.ts`, `src/utils/agentChatHelpers.ts`, `src/utils/conversationsHelpers.ts`, `src/utils/sseHelpers.ts`, `src/utils/chatArtifacts.ts`, `src/utils/chatRecommendations.ts`, `src/types/Conversation.ts`, `src/constants/agentConstants.ts`, `src/utils/apiHelpers.ts` (`parseTotalCount` only)

## Responsibility

Operator chat with one enabled custom agent, plus the conversation list and the session-log list/flow used beside it. Streaming chat is `POST /ai-service/{tenant}/agentic/chat-stream`. A bad-request stream falls back to `POST .../agentic/chat`. Conversations are `GET .../agentic/conversations`. Sessions and session flow use `LogService` (`src/services/logService.ts`, not opened).

## Flows

1. **Pick an agent.** The page loads custom agents and skips templates. The dropdown is enabled agents except `emporix-chat-recommended-prompts-assistant`. While IAM scopes are loading, the list is empty. A caller with scope `ai.agent_manage` sees every enabled agent. Anyone else sees only agents whose tags include `chat` (trim, lower case). Query `agent` is applied before the first user message when that id is enabled; otherwise the first enabled id is selected. The query is rewritten to the selected id. Changing agent after a user message asks for confirm, then `reset()` and switches. Cancel leaves the transcript. Edit opens `#/agents/{id}/edit` only when an agent is selected and the caller can manage agents.

2. **Gate, then send.** Empty or in-flight input is ignored (`ignored`). Before send, `getChatInvokeGates`: a required-scopes list that is only `customer` needs an employee scope; missing triggers or no `endpoint` trigger needs an API trigger. Gates are confirmed one at a time, employee scope first. Cancel clears the dialog and does not send. Accept builds `REPLACE` patches for `/requiredScopes` and/or `/triggers`, `PATCH`es the agent, refreshes the list, then sends. A patch error does not send. Employee is not duplicated. `endpoint` is appended with `config: null` and existing triggers stay.

3. **Stream.** The user row and an empty assistant row are appended. Status is `streaming` until the request that owns the abort controller finishes. A second send returns `ignored`. `session-id` is sent only when a session is already stored. Tokens replace the assistant text and clear activity. Thinking chunks append until `onThinking(null)`. Tool activity shows the trimmed tool name, then clears on `tool_end`. `done.sessionId` becomes the stored session. `reset` aborts and sets the session to null. Unmount aborts. Stop aborts; abort is result `aborted` and does not toast. Any other failure replaces the assistant row with `role: 'error'`, toasts, and puts the text back in the composer when the send came from the composer, or when a recommendation send failed and the composer is empty.

4. **Empty and artifact replies.** The stream throws `chat_error` when the trimmed text is empty and no artifact event arrived. An artifact with no text is a successful reply. Sync fallback throws when `message` is missing or blank. Sync reads `message` and `sessionId` from the object or from the first array element.

5. **Recommendations.** Loaded only when the recommended-prompts agent is present and enabled, and the selected agent is not that helper. The hook calls sync chat once with a prompt built from the target name, description, user prompt, optional template prompt, and commerce-event schemas. It does not send the transcript. Schemas come from webhook event subscriptions whose type matches the agent’s `commerce_events`, or whose English group plus stemmed action matches. Schema load failure is logged and the recommendation call still runs with no schemas. The helper is not asked to recommend for itself. Zero parsed items show the empty line only when the helper is present, an agent is selected, and loading has finished. The enable button creates that template agent via `createRecommendedPromptsAgent`.

6. **Render the answer.** Assistant text is split by `splitVegaLiteSegments` (`src/utils/richContent/vegaLiteSegments.ts`, not opened) into text, mermaid, csv, code, json, note, or Vega-Lite, including pending and invalid chart text. Text segments go through `formatChatResponseText` (`src/utils/formatHelpers.ts`, not opened) and `RichMarkdown`. Artifacts render beside that text.

7. **Artifacts.** A failed stream artifact (`status: 'failed'`) shows `chat_artifact_image_failed` or `chat_artifact_failed` and does not download. A ready image previews only for `image/png` or `image/jpeg` with an `artifactId`. Other ready artifacts are a file row. Bytes come from `GET /media/{tenant}/assets/{artifactId}/download`, capped at 8 MiB. A failed download uses the same failure keys. Duplicate `artifactId` values are not appended. Download names drop path segments, replace other characters, and cap at 120.

8. **Conversations.** Default page size 10, page 1, sort `lastMessageAt` `DESC`. Scope is optional `agentId` and/or `toolId`. Filter changes reset to page 1. `enabled: false` clears rows and does not call the API. `hasConversations` asks for page size 1. `totalCount` is `x-total-count` via `parseTotalCount` (missing header becomes 0). The row-length fallback runs only when `totalCount` is null. Label order: `conversationName`, `contextRef`, `channelId`, `conversationId`. Channel and id labels truncate at 48 characters. Missing or invalid `lastMessageAt` displays `N/A`.

9. **Sessions.** `useSessions` reads agent id, page size, filters, and sort from the log-list query (`src/utils/logListQuery.helpers.ts`, not opened). Cursors live in that query under the `s` namespace. A cursor that returns no rows is dropped and the list reloads without it. Changing the list key while a cursor is set clears the cursor first. Stale responses are ignored via a request id.

10. **Session flow.** `fetchBySessionId` loads one session. Nodes are business logs, plus the initial message and the response message even when those are not business logs. Initial and response nodes show the extracted text from `findInitialMessageFromLog` / `findResponseFromLog` (`src/utils/logHelpers.ts`, not opened). Other nodes show `message.message`. Order is ascending timestamp. The hook stores one group for that session id.

## Stream frames

`sseHelpers` splits on `\n\n` or `\r\n\r\n`. Lines starting with `:` are dropped (keepalive). Unknown event names are dropped. Invalid JSON becomes `{ type: 'error', code: 'INVALID_FRAME' }`. Mapped events: `token`, `thinking`, `tool_start`, `tool_end`, `error`, `artifact`, `done`. Tool names use `tool_name` / `tool_call_id`. Done uses `agent_id`, `agent_type`, `session_id`, `tools_used`, optional `ttft_ms`. An artifact is dropped unless `kind` is `image` or `file`, `status` is `ready` or `failed`, and filename, mime type, and `size >= 0` are present. `ready` also requires `artifact_id`. `failed` may omit it. `chatWithAgent` throws `Error(event.message)` on an error frame and does not surface `code`.

Transcript follow stops when the reader is more than 80px above the bottom, or on an upward wheel. The card resize keeps the transcript at least 200px and inside the viewport minus 16px.

## Rules

- Chat roles: `user`, `assistant`, `error`. Status: `idle` | `streaming`. Activity: `thinking` or `tool`.
- A selected agent that disappears from the enabled list stays selected after the first user message. Before that, selection moves to the first enabled id.
- Customer-only is exactly one scope, case-insensitive `customer`. Empty scopes do not open the employee gate. `employee` already present does not.
- `isMissingApiTrigger` is true for missing, empty, or non-`endpoint` triggers. Comparison is trim + lower case.
- Recommendation JSON may be fenced. `hasRecommendations: false`, invalid JSON, or a missing array yields `[]`. At most 5 items. Label and prompt must be non-blank. Label is clipped to 40 characters. Icon may be empty.
- Recommendation commerce matching: exact subscription type, else English group equals the event domain or detail, and the stemmed subscription type equals the stemmed detail or the detail with the domain prefix removed. Stems strip `webhook`, version suffixes, and verb variants (`created`/`updated`/`deleted`/`cancelled`).
- Image preview failure and a failed image artifact use the image failure key. File download failure uses the file failure key.

## Tests

Titles only. Assertion bodies were not opened.

| File | Pins |
|---|---|
| `src/utils/agentChatHelpers.test.ts` | Session kept across sends and cleared on reset. Thinking appends and clears. Tool line clears when the name is empty. Activity stays visible after text while a tool is active. Manage scope sees all agents; others see the `chat` tag. Edit needs manage scope and a selection. Query selects an enabled agent before the first enabled fallback and does not override a later choice or a started transcript. Employee gate only for a single customer scope. Endpoint patch appends without duplicating. |
| `src/utils/sseHelpers.test.ts` | Frames split across chunks; keepalive ignored; token, error, done; CRLF; multi-line `data`; invalid JSON; unknown events ignored; ready artifact kept and a malformed one dropped. |
| `src/services/agentService.test.ts` | Same chat cases as the agents module: tokens, empty stream, image-only, session, thinking, abort, stream error, sync message/session. |
| `src/utils/chatArtifacts.test.ts` | Append does not mutate; duplicate id ignored; preview only ready png/jpeg with id; media path and size text; safe filename; image vs file failure keys. |
| `src/utils/chatRecommendations.test.ts` | Five-item cap; `hasRecommendations: false`; fence stripping; prompt not clipped in the outbound message; schemas only for selected commerce events; webhook type match by group and action. |
| `src/utils/conversationsHelpers.test.ts` | Label fallback order; ISO, epoch, and mongo-style timestamps; missing timestamp uses the fallback. |
| `src/services/conversationsService.test.ts` | `toolId` and `agentId` query with page and sort; `hasConversations` false at total 0 and true when total is positive. |
| `src/hooks/useSessionFlow.test.ts` | Business logs kept; extracted text for inbound and response; streaming LLM end included when it is not a business log; no duplicate when the response is already a business log. |

## Not yet scanned

`src/components/chat/VegaLiteView.tsx`, `MermaidView.tsx`, `JsonView.tsx`, `CsvView.tsx`, `CodeView.tsx`, `NoteView.tsx`, `RichMarkdown.tsx`, `ChatSourceBlock.tsx`, `RichFrameDownload.tsx`, `RichResizeHandle.tsx`, `RichBlockStatus.tsx`, `useRichFrameResize.ts`, and their tests. `src/utils/richContent/**`. `LogService`, log list query helpers, and the log pages that render sessions (`src/components/log/`). `useHelperAgentProvisioning` beyond the call in `AgentChatPage`. Test assertion bodies. Styles.
