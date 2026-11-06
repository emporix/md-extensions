# Reports

Write `{ARTIFACTS_DIR}/report.md`. Do not commit it. Do not attach it — the
comment body is this file. No tenant, client id, secret, token, or env path
contents.

```markdown
# Local API QA {RUN_ID}

**Verdict:** PASS

**Base URL:** {BASE_URL}

**Collection:** {relative path from postman-collections}

**Folder:** {folder name or (all)}

**Scope:** {KEY or none}

## Requests

### 1. Access Token — PASS

- Expected: 200
- Observed: 200

### 2. … — FAIL

- Expected: 201
- Observed: 400 — {assertion name only}

## Evidence

- Collection: `{basename}.postman_collection.json`
- Newman report: `newman-report.html`
```

## Session report

```text
QA: {PASS|FAIL}
Base URL: {BASE_URL}
Collection: {relative path}
Folder: {name or all}
Artifacts: {ARTIFACTS_DIR}
Issue: {KEY} (link: {browseUrl})
Jira comment: {commentId}
Attached: {n}
Ready: {yes|no}
```

Omit `Issue:` / `Jira comment:` when there is no key or publish was skipped.
`Ready: yes` only on PASS.
