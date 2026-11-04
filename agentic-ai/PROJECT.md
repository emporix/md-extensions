# Agentic AI

React extension in the Emporix Management Dashboard for creating and configuring AI agents (LLM, tools, MCP, triggers) and for chat, logs, tokens, and OAuth. Source: `README.md`.

Platform context (callers, deployment, cross-service conventions): ask Emporix
AI Buddy `get_service_context` with `service: "Agentic AI"`. This repository's own
knowledge is below; open only what the task needs.

## Knowledge files

| File | What it answers | Last scanned |
|---|---|---|
| `ai-project-knowledge/domain.md` | Concepts, rules, states, calculations | `c043b34` 2026-11-02 |
| `ai-project-knowledge/ui.md` | Hash routes, providers, client-side rules | `c043b34` 2026-11-02 |
| `ai-project-knowledge/integrations.md` | Outbound REST/SSE, env names, error behaviour | `c043b34` 2026-11-02 |
| `ai-project-knowledge/modules/agents.md` | Agent list, editor, triggers, import, versions | `c043b34` 2026-11-02 |
| `ai-project-knowledge/modules/chat.md` | Assistant chat, conversations, session flow | `c043b34` 2026-11-02 |
| `ai-project-knowledge/modules/tools.md` | Native tools, RAG, Slack, Teams | `c043b34` 2026-11-02 |
| `ai-project-knowledge/modules/mcp.md` | Custom and dynamic MCP servers | `c043b34` 2026-11-02 |
| `ai-project-knowledge/modules/access.md` | AI tokens and OAuth client-credentials | `c043b34` 2026-11-02 |
| `ai-project-knowledge/modules/logs.md` | Request logs, jobs, sessions | `c043b34` 2026-11-02 |

## Not yet scanned

- Agent config UI beyond triggers and tools, version diff, rich chat renderers (`src/utils/richContent/**`), Slack/Teams/RAG section bodies, MCP connection sections, log table and detail bodies — budget. Run `/emporix-setup --rescan <module>`.
- No `data-model.md` or `api.md`: this folder has no database and no OpenAPI contract. Persistence and the HTTP API live in the AI service.

## Maintenance

Update the matching file in the same PR when a change alters business rules,
data model, API, UI behaviour, or integrations. Refresh everything with
`/emporix-setup --rescan`.
