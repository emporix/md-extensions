# Prerequisites — GitBook API Sandbox

## Pinned ids (default)

| Resource | Value |
|---|---|
| Organization id | `z8MNPigQv25NZe33g3AV` |
| Space id | `tUdmqvwo2mTd4qEbqojs` |
| Space title (must match) | `API Sandbox` |
| App URL | https://app.gitbook.com/o/z8MNPigQv25NZe33g3AV/s/tUdmqvwo2mTd4qEbqojs/ |
| Draft change requests | https://app.gitbook.com/o/z8MNPigQv25NZe33g3AV/sites/site_pI0Kt/s/tUdmqvwo2mTd4qEbqojs/~/change-requests?status=draft |

Live API Documentation space id `d4POTWomuSS7d3dnh4Dg` is **forbidden** for this skill.

## Where the preview appears

The OpenAPI preview is **not** on the live API Sandbox home page. This skill
always opens a **GitBook change request** (draft) and inserts the computed
OpenAPI page there. After the skill runs:

1. Open the **Preview URL** from the skill result (preferred), or
2. Open **Change requests** (draft) for API Sandbox:
   https://app.gitbook.com/o/z8MNPigQv25NZe33g3AV/sites/site_pI0Kt/s/tUdmqvwo2mTd4qEbqojs/~/change-requests?status=draft
   and select the CR whose subject starts with `Sandbox:`.

Default after review: leave the CR as draft, or discard/archive it. Merge into
**API Sandbox** only when someone explicitly wants the page on the Sandbox
space itself — never into the live API Documentation space.

## MCP authentication (not stored in the skill)

Credentials are **never** committed in this skill or the skills repo. Cursor
loads GitBook MCP from the operator’s machine.

### Team pattern (shared GitBook account)

Engineers without personal GitBook seats use the shared Emporix GitBook
account’s PAT. They do **not** create their own token.

1. In **1Password**, look up the item **Gitbook API Sandbox Token** and copy
   the shared PAT.
2. Paste it into your **local** Cursor MCP config only — **never** into the
   skill, never into a committed project file.

Maintainers (not every user) create or rotate that PAT while signed in as the
shared account at
[Developer settings](https://app.gitbook.com/account/developer), update the
**Gitbook API Sandbox Token** item in 1Password, and ensure the account can
edit **API Sandbox**.

**Where to place the token in Cursor** (user-level, on each machine):

File: `~/.cursor/mcp.json` (macOS/Linux) — **not** the repo’s
`.cursor/mcp.json` unless that file is gitignored and never pushed.

```json
"gitbook-mcp": {
  "type": "streamable-http",
  "url": "https://mcp.gitbook.com/mcp",
  "headers": {
    "Authorization": "Bearer <PAT_FROM_1PASSWORD>"
  }
}
```

Reload MCP after editing. Do not put the PAT in git or chat. If it leaks,
rotate it on the shared account and update **Gitbook API Sandbox Token** in
1Password.

Optional for the REST helper script: export the same value as
`GITBOOK_TOKEN` (or `GITBOOK_API_TOKEN`) in the shell. The script also reads
the Bearer header from `~/.cursor/mcp.json` when the env var is unset.

GitBook attributes writes to the shared account; that is expected for this
pattern. Prefer personal OAuth/PATs when teammates have their own seats.

### Why the script (not MCP) uploads the YAML

Large OpenAPI files and nested `insert_computed_page` payloads often break
agent MCP tool-argument JSON. The skill therefore **requires**
[`scripts/gitbook-api-preview.sh`](scripts/gitbook-api-preview.sh), which
calls `https://api.gitbook.com/v1` with the PAT and upserts either a local
`.yml` (`source.text`) or a public raw URL (`source.url`).
That avoids “authentication” dead-ends that are actually tool-plumbing
failures, and always creates a **parent overview page** so each service’s
endpoints sit under a clear title.

### Individual accounts

- Namespace: `user-gitbook-mcp`, server `gitbook-mcp` →
  `https://mcp.gitbook.com/mcp` (write-capable — not a published-docs
  `~gitbook/mcp` endpoint).
- Auth options ([GitBook MCP docs](https://gitbook.com/docs/docs-as-code/gitbook-mcp)):
  1. **OAuth** — sign in as yourself when Cursor prompts. Do not mix a bearer
     header with OAuth.
  2. **PAT** — same `headers.Authorization` shape as above, created on that
     user’s developer settings. Needs ability to create OpenAPI specs and
     edit API Sandbox (`openapi:write` / `space:write` when using OAuth
     scopes).
- If tools fail with auth/unauthorized: run `mcp_auth` once, then retry.
- If `mcp_auth` reports success but calls return HTTP 401 (`Invalid token`):
  reconnect GitBook in Cursor Settings → MCP → `gitbook-mcp`, then re-run.
- If **reads** work but **writes** fail with HTTP 403 `requires user auth`:
  OAuth session is incomplete — switch to a PAT as above. Do not fall back
  to another space.
- MCP is **optional** for this skill. Previews run through the REST helper with
  `GITBOOK_TOKEN` / `GITBOOK_API_TOKEN` or the Bearer in `~/.cursor/mcp.json`.
  Missing MCP alone is not a stop — only a missing token is. Connect MCP when
  you want light reads (`getSpaceById`, list CRs) in the agent.

## Verify before writing

The REST helper **always** GETs space `tUdmqvwo2mTd4qEbqojs` and requires title
`API Sandbox` before any write. That check satisfies the write prerequisite —
you do not need a separate MCP verification step when using the script.

Optional MCP double-check (reads only):

1. `invoke_operation` → `getSpaceById` with `spaceId: tUdmqvwo2mTd4qEbqojs`.
2. Confirm the returned title is exactly `API Sandbox` (trim; case-sensitive).
3. Mismatch or not found → **stop**. Do not guess another space. Do not use the live API Documentation space.

## Smoke-test sample

When no `api-references` checkout or target `.yml` is available, use:

`fixtures/minimal-api.yml`

relative to this skill folder (`info.title`: **Sandbox Sample API**). Register
it with the same sandbox naming as any other preview:
`sandbox-sample-{branch}-{digest}` (resolve the branch from this skills repo;
see workflow for sanitize + digest). CR subject and page title:
`Sandbox: sample ({branch})`.
