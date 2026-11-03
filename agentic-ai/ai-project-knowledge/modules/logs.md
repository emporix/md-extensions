# Module: logs

Last scanned: c043b34 (2026-11-02)
Sources: `src/types/Log.ts`, `src/types/Job.ts`, `src/services/logService.ts`, `src/services/jobService.ts`, `src/services/analyticsService.ts`, `src/utils/logHelpers.ts`, `src/utils/logListQuery.helpers.ts`, `src/utils/logAnalysisAssistantHelpers.ts`, `src/utils/constants.ts` (`CACHE_TTL` only), `src/hooks/useAgentLogs.ts`, `src/hooks/useJobs.ts`, `src/hooks/useSessions.ts`, `src/hooks/useSessionFlow.ts`, `src/hooks/useLogAnalysisAssistant.ts` (through provisioning), route and tab greps in `src/components/log/LogsPage.tsx`, `SessionsTab.tsx`, `SessionFlowPage.tsx`, `LogDetailsPage.tsx`, `JobDetailsPage.tsx`, `LogCard.tsx`, `src/components/shared/MetricsPanel.tsx` (import only), `src/components/shared/AnalyzeLogsDialog.tsx` (import only), test titles in `logHelpers.test.ts`, `logListQuery.helpers.test.ts`, `logAnalysisAssistantHelpers.test.ts`, `useSessionFlow.test.ts`.

## Responsibility

Read-only operations view for one tenant: request logs, background jobs, and sessions, plus a session timeline and a dashboard snapshot. Nothing here creates or edits agents. Optional `agentId` query param scopes all three lists and the back button returns to `/agents`.

Request log severity on the type: `INFO | ERROR | WARNING`. `SessionLogs.severity` is a plain string. Job status: `success | failure | in_progress | skipped`. Job type: `import | export | agent_chat`.

## Main flows

1. `LogsPage` picks the tab from the path: requests, jobs, or sessions (`/logs/sessions`). Tab change keeps the current search string and switches path. Shared `agentId` is outside the per-tab prefixes.
2. Each tab reads its slice of the query string (`r`, `j`, or `s`), fetches a cursor page, and writes the next/prev cursor back with `replace`. Filter, sort, or page-size changes drop that tab's cursor. A cursor that returns zero rows is abandoned and the cursor params are cleared so the first page loads.
3. Request list: `GET /ai-service/{tenant}/agentic/logs/requests`. List asks only for `id,triggerAgentId,requestId,sessionId,severity,metadata,duration,collaborationAgents` so message bodies stay off the list. Summaries then count `messages` locally, which is 0 whenever the list projection omits them. `messageCount` and `errorCount` on the list are therefore not the full log. Detail `GET .../logs/requests/{id}` returns the full `RequestLogs`.
4. Session list: `GET .../agentic/logs/sessions`. Default API sort `metadata.modifiedAt` DESC when the hook falls through, and the query helper's default sort field is the same. Row click opens `/logs/sessions/{sessionId}` and keeps the search string.
5. Session flow loads `GET .../logs/sessions/{sessionId}` and builds timeline nodes from `session.messages`. Nodes are business logs, plus the extracted inbound line and the extracted response line if they are not already business logs. Display text for those two is the captured payload, not the raw log line. Nodes sort by timestamp ascending. Clicking a node stores `scrollToMessage` in `sessionStorage` and navigates to the request log; `LogDetailsPage` reads that key. Agent filter on the timeline is client-side.
6. Jobs: `GET /ai-service/{tenant}/jobs` (not under `/agentic/logs`). Detail `GET .../jobs/{id}`. Summary copies `metadata.createdAt` to `createdAt`. Import/export payloads stay on the summary (`importResult`, `exportResult`).
7. Metrics panel (all tabs) calls `AnalyticsService.getDashboardSnapshot`. One bundle `GET .../agentic/analytics?agentId=` when an agent is selected. In-memory cache, 5 minutes, key `bundle_{agentId}` or `bundle_all`. `forceRefresh` bypasses the cache. Session severity in the snapshot is `success | warning | error` counts, not the request-log `INFO` enum. Also returns resolution efficiency (requests per session, totals) and session error trend (date, error sessions, total sessions, error rate).
8. Log analysis is a dialog (`AnalyzeLogsDialog` → `useLogAnalysisAssistant`), not a separate route. It provisions a helper agent, then sends one initial user message built from the visible log entries. Display of assistant/error JSON prefers `formatErrorPayloadMessage`. The dialog body and the rest of the hook after provisioning were not opened.

Lookup by request id exists on `LogService` (`getRequestLogs`, `getAgentLogsByRequestId`) as `q=requestId:{id}`. Both return the first element when the body is an array, else null. Call sites were not traced.

## Key files

| Path | Role |
|---|---|
| `src/components/log/LogsPage.tsx` | Three tabs, shared agent filter, metrics |
| `src/hooks/useAgentLogs.ts` | Request cursor list, namespace `r` |
| `src/hooks/useJobs.ts` | Job cursor list, namespace `j` |
| `src/hooks/useSessions.ts` | Session cursor list, namespace `s` |
| `src/services/logService.ts` | Requests and sessions |
| `src/services/jobService.ts` | Jobs |
| `src/utils/logListQuery.helpers.ts` | URL ↔ table filters |
| `src/hooks/useSessionFlow.ts` | Timeline nodes |
| `src/utils/logHelpers.ts` | Inbound and response extraction |
| `src/services/analyticsService.ts` | Cached dashboard bundle |
| `src/utils/logAnalysisAssistantHelpers.ts` | Truncate logs before the analysis prompt |
| `src/components/log/SessionFlowPage.tsx` | Timeline, agent filter, jump to request |
| `src/components/log/LogDetailsPage.tsx` | Request detail; reads `scrollToMessage` |
| `src/components/log/JobDetailsPage.tsx` | Job detail |

## Module-specific rules

Query string:

- Namespaces: `r` requests, `j` jobs, `s` sessions. Keys look like `r.severity`, `j.sort`, `s.next`.
- `agentId` is shared and is not cleared when one namespace is rewritten (`clearNamespacedListParams` keeps it).
- Page size allowed values: 10, 25, 50, 100. Anything else, including missing, becomes 10. 10 is omitted from the URL.
- Default sort is descending and omitted from the URL. Requests default field `lastActivity`. Jobs `createdAt`. Sessions `metadata.modifiedAt`. Unknown sort fields fall back to that default.
- Dates in the URL are `YYYY-MM-DD` from the local calendar date. Impossible dates (`fromDateParam` rejects overflow) become an empty filter. The test name is “ignores invalid date and rows”.
- Cursor: `r.next` wins over `r.prev` when both are set (`readListCursor` returns next if present). Writing a cursor deletes the other direction. Rewriting filters drops the cursor.
- Request filters: agent id → API `triggerAgentId`, request id, session id, last activity → API `metadata.createdAt` (not modifiedAt), duration, severity (equals). Exact-match fields in the service: `severity`, `duration`. UUID exact: `requestId`, `sessionId`.
- Job filters: id, agent id, type (equals, passed through `convertJobTypeToApi` — that mapper was not opened), status (equals), created at → `metadata.createdAt`. Service exact-match: `type`, `status`.
- Session filters: session id, trigger agent, agents, created at, modified at, severity. Service exact-match: `severity`. UUID exact: `sessionId`. Default service sort if callers omit it: `metadata.modifiedAt` DESC.

List stale-response guard: each fetch bumps a request id and ignores older responses. Tenant or token change refetches.

Extraction (`logHelpers`):

- Inbound is the first line that starts with one of: `Agent receive streaming request:`, `Agent receive request:`, `Processing Slack message for user:`, `Processing routed Slack message`, `Processing Teams message for conversation`. Nested copies inside a streaming payload do not count because the check is `startsWith`.
- If any line starts with the streaming marker, the response is the last `LLM ended (run #N) for agent: '…' with response:` capture. Otherwise the response is the last line starting with `Agent final response:`, `Slack routed message sent successfully`, `Slack message sent successfully:`, or `Teams message sent successfully`.
- Same log line means same timestamp, message, and agent id.
- `formatAgentIdWithVersion`: missing version is the id alone; a number becomes `id (vN)`.

Session flow (`buildSessionFlowNodes`): keep `isBusinessLog`, the inbound entry, and the response entry. Response/inbound nodes show extracted text. Streaming LLM-ended response is included even when it is not a business log. A response that is already a business log is not duplicated.

Analysis prompt (`buildLogAnalysisInitialMessage`):

- Truncate before send. Caps: tool output 600 chars, LLM prompt without an AI turn 800, any line 1200, with a truncation marker. Failure-shaped tool output is not truncated (pattern covers `is_success": false`, HTTP 4xx/5xx, “not found”, “disabled”, “failed”, “exception”).
- LLM-started lines that contain prompts keep only the last `AI:` turn. Inline “AI” in system text is not a turn. Escaped newlines are normalized first.
- The prompt tells the model to review runtime failures only, to treat WARNING and ERROR as primary, and that a later “Agent execution completed successfully” INFO line does not cancel earlier WARNING/ERROR. It includes counts of ERROR, WARNING, and INFO.

Analytics cache is static on the class, so it survives remounts and is shared across instances. It is not cleared on tenant change inside the service; the cache key does not include tenant. That is a cross-tenant leak if two tenants are used in one page lifetime. Not confirmed against `MetricsPanel` keying.

`LogCard` shows the first 8 characters of `sessionId` plus `...`.

## Tests that pin behaviour

- `logHelpers.test.ts`: inbound and response captures for agent, Slack, routed Slack, and Teams; first inbound and last response when several match; streaming uses last LLM-ended line and ignores a nested “Agent final response”; undefined and empty messages return undefined; version suffix.
- `logListQuery.helpers.test.ts`: empty search is defaults; round-trip keeps `agentId`; writing jobs leaves other namespaces; empty filters and default sort/rows omitted; invalid date and rows ignored; session date aliases; local date conversion; cursor is not a filter; rewriting filters drops the cursor; clearing a namespace keeps `agentId`.
- `useSessionFlow.test.ts`: business logs stay; inbound/response use extracted text; streaming LLM-ended included when not a business log; no duplicate when the response is already a business log.
- `logAnalysisAssistantHelpers.test.ts`: escaped newlines; last AI turn kept; long prompts without an AI marker truncated; failure tool output kept; large success tool JSON truncated; initial message includes severity counts and the “success does not cancel WARNING/ERROR” rule.

No tests were found for `LogService`, `JobService`, or `AnalyticsService`.

## Not yet scanned

Full `LogsPage` column renderers, `SessionsTab` beyond filters, `SessionFlowPage` chart grouping, `LogDetailsPage` and `JobDetailsPage` bodies, `MetricsPanel` refresh button, `AnalyzeLogsDialog`, `useLogAnalysisAssistant` after the helper-agent setup, `dataTableHelpers` (`convertSeverityFiltersToApi`, `convertJobTypeToApi`), `apiHelpers.buildQueryParams`, `listLoad.helpers.ts`, `SessionSeverityChart`, `SessionErrorTrendChart`. Whether job import/export detail is rendered. `LogService.getRequestLogs` callers.
