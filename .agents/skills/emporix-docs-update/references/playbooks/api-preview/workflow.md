# Workflow — GitBook OpenAPI preview

Follow these steps after reading `prerequisites.md` and verifying the API Sandbox space.

## Hard rule: do not put YAML or nested page payloads through MCP tools

Cursor agents often fail when:

- stuffing a large OpenAPI `.yml` (tens of KB) into `CallDynamicTool` /
  `invoke_operation` arguments, or
- sending a nested `insert_computed_page` JSON body (MCP reports
  `Failed to parse arguments string as JSON object`).

**Required path for write operations:** run the skill’s REST helper script
[`scripts/gitbook-api-preview.sh`](scripts/gitbook-api-preview.sh). It upserts
the OpenAPI spec (`source.text` from `--yml`, or `source.url` from `--url`),
talks to `https://api.gitbook.com/v1` with the shared PAT, creates/reuses the
change request, inserts a **parent overview page**, then nests the
`builtin:openapi` computed page under that parent.

Use GitBook MCP only for light reads if useful (`getSpaceById`, list CRs). Do
**not** use MCP to upload the OpenAPI body or to call
`updateChangeRequestContent` for the computed page.

Token resolution (script): `GITBOOK_TOKEN` / `GITBOOK_API_TOKEN`, else Bearer
from `~/.cursor/mcp.json` → `gitbook-mcp` (same PAT as **Gitbook API Sandbox
Token** in 1Password).

## 1. Resolve the OpenAPI source

Pass **exactly one** of:

- **`--url`** (preferred for branch/PR review) — public raw URL that GitBook
  can fetch. For the public `emporix/api-references` repo:

  ```text
  https://raw.githubusercontent.com/emporix/api-references/{branch|sha}/{path-to-api.yml}
  ```

  Use the PR head SHA when you need a pinned commit. Unpushed local edits
  cannot use `--url` until they are on GitHub.
- **`--yml`** — local `.yml` / `.yaml` on disk (WIP checkout, smoke fixture, or
  CI workspace file). Script uploads `source.text`.

Infer path/URL from the user argument, recent API reference edits, a
docs PR, or ask once. Smoke test: `references/playbooks/api-preview/fixtures/minimal-api.yml`
(**Sandbox Sample API**) via `--yml`.

## 2. Build a sandbox-only slug

Every OpenAPI spec registered for this skill **must** use the sandbox prefix
and, when available, the git branch where the preview was requested.

Pattern (lowercase, hyphens only; max 100 chars; must match
`^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$`):

```
sandbox-{service}-{branch}-{digest}
```

If there is no branch (detached HEAD, unknown cwd, or sample-only smoke):

```
sandbox-{service}-{short-ref}-{digest}
```

### Sanitize a segment

For each of `{service}`, `{branch}`, and `{short-ref}`:

1. Lowercase.
2. Replace every run of non `[a-z0-9]` with a single `-`.
3. Trim leading and trailing `-`.
4. Reject the segment if it is empty after trim — fall back: service →
   `service`, branch/ref → `nobranch`.

### Digest (collision + run guard)

Compute a 6-hex SHA-256 digest of `{originalRef}\n{runId}` where
`{originalRef}` is the unsanitized branch/ref and `{runId}` is a **fresh
random** per-invocation token (never timestamp alone). Prefer 16+ hex from
`openssl rand -hex 8` or `uuidgen`:

```bash
RUN_ID=$(openssl rand -hex 8)
printf '%s\n%s' "$ORIGINAL_REF" "$RUN_ID" | shasum -a 256 | cut -c1-6
```

### Assemble and validate

1. Length budget: `reserved = len("sandbox") + len(digest) + 3` (= 16).
   `budget = 100 - reserved` for `service` + `branch`.
2. If sanitized `{service}` alone leaves `budget < 2`, **stop**.
3. Truncate `{service}` if needed so `len(service) <= budget - 2`, then fill
   the remainder with `{branch}` / `{short-ref}` (min 1). Trim hyphens again.
4. Validate final length ≤ 100 and
   `^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$`. Fail → stop.
5. Stable cleanup identity (separate from the run-unique slug):

```
preview-id: {repo-or-source}|{service}|{original-ref}
```

## 3–6. Run the REST helper (required)

From the skill directory (or with an absolute path to the script):

Local file:

```bash
references/playbooks/api-preview/scripts/gitbook-api-preview.sh \
  --yml /absolute/path/to/api.yml \
  --slug sandbox-{service}-{branch}-{digest} \
  --service {service} \
  --ref {original-branch-or-ref} \
  --preview-id '{repo}|{service}|{original-ref}' \
  --title 'Sandbox: {service} ({ref})'
```

Public branch/PR (GitBook fetches the URL):

```bash
references/playbooks/api-preview/scripts/gitbook-api-preview.sh \
  --url 'https://raw.githubusercontent.com/emporix/api-references/{branch|sha}/…/api.yml' \
  --slug sandbox-{service}-{branch}-{digest} \
  --service {service} \
  --ref {original-branch-or-ref} \
  --preview-id 'emporix/api-references|{service}|{original-ref}' \
  --title 'Sandbox: {service} ({ref})'
```

What the script does:

1. Verifies space title is **API Sandbox**.
2. `PUT /orgs/{org}/openapi/{slug}` with either `source.url` (`--url`) or
   `source.text` from `--yml` (text streamed via temp file / `@file` to avoid
   `ARG_MAX`).
3. Polls until `processingState=complete` with a version (also when
   `--pages-only` / `--skip-upsert`, so resume and `--merge` never run on a
   failed or unfinished slug).
4. Creates a draft change request (or use `--change-request {id|number}` to
   finish an existing CR).
5. Reuses or inserts a **parent overview page** titled
   `{Service} API ({branch})` with a table of service, branch, slug,
   preview-id, and source path/URL. Page reads that fail (non-404) abort;
   they are not treated as “missing”.
6. Reuses or inserts `insert_computed_page` (`builtin:openapi`,
   `models: true`) **nested under that parent** (`into: parentPageId`).
7. Optional `--merge` only when the user asked; merge HTTP failure exits
   non-zero (does not report a false success).

Finish an interrupted run (spec already uploaded, CR exists, parent and/or
computed page missing). Pass `--change-request` so the script reuses pages
that already match the expected titles (new CRs always insert fresh pages):

```bash
references/playbooks/api-preview/scripts/gitbook-api-preview.sh \
  --pages-only \
  --slug sandbox-… \
  --service media \
  --ref api-test \
  --preview-id 'emporix/api-references|media|api-test' \
  --change-request 7
```

Return the script’s printed Preview URL to the user. Draft list:

https://app.gitbook.com/o/z8MNPigQv25NZe33g3AV/sites/site_pI0Kt/s/tUdmqvwo2mTd4qEbqojs/~/change-requests?status=draft

## 7. Optional `--cleanup`

When the user passed `--cleanup`:

1. List draft/open CRs on API Sandbox (MCP or
   `GET /spaces/{space}/change-requests?status=draft`).
2. Archive older CRs whose description contains the same `preview-id: …`
   line. Do not match on run-unique `slug:` or service alone. Skip the new CR.
3. Best-effort; do not delete org OpenAPI specs unless asked.

## Forbidden

- Passing OpenAPI file contents or nested `updateChangeRequestContent` bodies
  through MCP / `CallDynamicTool` (use the script instead)
- Merging without an explicit user request
- Merging when the script reported the spec was not complete
- Any write to space `d4POTWomuSS7d3dnh4Dg` or any space other than API Sandbox
- Updating OpenAPI slugs that do not start with `sandbox-`
- Editing product or docs git files as part of this skill
- Inserting a bare computed OpenAPI page at the CR root without the parent
  overview page
