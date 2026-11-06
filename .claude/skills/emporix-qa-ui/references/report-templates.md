# Reports

## Plan (hard stop)

```text
QA plan: .ai/qa/{YYYY-MM-DD}-{KEY}-qa-plan.md (draft) | (plan mode) {plan file path}
Scope: {KEY} | PR #{n} | local — {one line: what changed for the user}
Steps: {n} required · {m} optional · Scenarios {1–k} covered
Tenant profile: {alias} · Language: {lang}
Preconditions: none | {count — listed in the file} · Blocking questions: none | {count}
approve · change X · cancel
```

In plan mode drop the last line and call `ExitPlanMode` (`emporix-feature` `references/plan-mode.md`); the approval dialog carries the three choices.

## QA report (run)

Write `{ARTIFACTS_DIR}/report.md` locally. Do not commit it. Do not attach it to Jira — `qa-jira-publish.sh` sends this file's content as the comment body.

Use **this shape** (blank line between facts). Do not use a Markdown table — Jira
will flatten it. Do not write tenant, token, or any secret.

```markdown
# UI QA {RUN_ID}

**Verdict:** PASS

**App:** {BASE_URL}

**Kind:** {app.kind}

**Auth:** cockpit-token

**Scope:** {KEY}

**Plan:** .ai/qa/{YYYY-MM-DD}-{KEY}-qa-plan.md

## Steps

### 1. Open Auto Matching — PASS

- Action: open Auto Matching from the side menu
- Expected: config list loads
- Observed: list loaded
- Screenshot: step-01-auto-matching-list.jpg

### 2. … — PASS

- Action: …
- Expected: …
- Observed: …
- Screenshot: step-02-….jpg
```

`not exercised` is allowed. It is not PASS. Optional steps are marked `(optional)` in the heading and do not change the verdict. Add an `## Observations` list for anything seen outside the plan's steps — never a tenant, token, or secret.

## Session report

```text
QA: {PASS|FAIL}
Plan: .ai/qa/{YYYY-MM-DD}-{KEY}-qa-plan.md
Tenant profile: {alias}
Artifacts: {ARTIFACTS_DIR}
Issue: {KEY} (link: {browseUrl})
Jira comment: {commentId or skipped}
Screenshots attached: {n}
```

On **FAIL**, add `Ready: no` and `Next: fix locally, or say publish to post this fail to Jira`.
`Jira comment: skipped` until they asked to publish.

When `{KEY}` is known and the verdict is **PASS**, **post-qa-report**
(`references/publish.md`) is required. A PASS comment without **inline** JPEG
screenshots is not done. A FAIL is not posted unless they asked.
