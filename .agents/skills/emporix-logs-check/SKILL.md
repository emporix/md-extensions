---
name: emporix-logs-check
description: >-
  Query Google Cloud Logging for one or more Emporix services with the hosted
  Cloud Logging MCP tool list_log_entries
  (https://logging.googleapis.com/mcp). Maps dev, stage, and prod, and accepts
  an Emporix Hosting project such as eh-zgraiffeisen. Use when the user asks
  to check, tail, or search logs. Ask which project when the prompt does not
  say. If the tool is missing, show references/cursor-setup.md in Cursor or
  references/claude-code-setup.md in Claude Code.
---

# Check Cloud Logging for a service

Read recent logs for **one or more** services in **one** project. The only query path is the hosted Cloud Logging MCP at `https://logging.googleapis.com/mcp`, tool `list_log_entries`. Do not use a local Logging script, `gcloud logging read`, or curl.

## Ask, then query

1. **Project.** If the prompt already names one, use it. Otherwise ask. Do not guess.

| What they say | `resourceNames` |
| --- | --- |
| `dev` | `projects/develop-297605` |
| `stage` | `projects/stage-282713` |
| `prod` | `projects/prod-282713` |
| `eh-<tenant>` | `projects/eh-<tenant>` |

`eh-zgraiffeisen` is the GCP project id. A bare tenant name gets the `eh-` prefix. Any other project id they type is used as given. One project per check.

2. **Services.** Read [references/query.md](references/query.md) and resolve which services they mean before querying. A prompt can name as many as they list. Match what they said (container, `jsonPayload.application`, or repo) and use the folders open in the workspace as a hint. Ask only when that is still ambiguous, and let them pick any number. The filter uses the Kubernetes container name.

3. **One server.** Call `list_log_entries` on the hosted Logging server already in this session. In Cursor that server is `cloud-logging`. Claude Code can expose the same tool under its own MCP name. If the tool is present, use it. Do not stop only because `mcp.json` is absent. If the tool is missing, show the setup for the client they use: [references/cursor-setup.md](references/cursor-setup.md) in Cursor, [references/claude-code-setup.md](references/claude-code-setup.md) in Claude Code (CLI or desktop app). Do not look for `cloud-logging-dev`, `cloud-logging-stage`, or `cloud-logging-prod`, and do not fall back to `gcloud` or curl.

4. **One query per service.** Same project. Default window is the last hour. Default severity is `ERROR` and above unless they ask for a wider search or a text match. Each service is its own call on that one server. Build the filter from [references/query.md](references/query.md).

- `resourceNames`: `["projects/PROJECT_ID"]` — the one project from the table, or the project id they gave
- `orderBy`: `timestamp desc`
- `pageSize`: `50`
- `filter`:

```
resource.type="k8s_container" AND
resource.labels.container_name="SERVICE" AND
severity>=ERROR AND
timestamp>="TIMESTAMP"
```

`TIMESTAMP` is UTC `RFC3339`. Do not add namespace, pod, or cluster clauses unless they ask.

## Rules

- Never print access tokens, client secrets, or refresh tokens.
- One project per check. `resourceNames` contains that one project.
- Do not change `x-goog-user-project` during a query unless they ask.
