# Reports

Write `{QA_DIR}/postman/{KEY}/report.md`. This file is the Jira comment.
Lead with the pull request URL when one exists. No secrets.

## Pass (pull request open)

```markdown
# Postman coverage {KEY}

**Verdict:** PASS

**Pull request:** {prUrl}

**Branch:** {KEY}-api-tests → develop

**Collection:** {relative path}

**Folder:** {scenario folder}

**Review:** QA reviews and merges into develop.

## Runs

- Regression (`origin/develop`, folders: {names}, or `--all`, or none): PASS
- Draft: PASS

## Contract

{routes and fields the draft asserts}
```

With `--self-review`, set **Review** to: the ticket assignee reviews and
merges this pull request.

## Fail

```markdown
# Postman coverage {KEY}

**Verdict:** FAIL

**Stage:** regression

**Collection:** {relative path}

## Findings

### 1. {request name}

- Kind: product
- Expected: {status and field from the plan or the existing test}
- Observed: {status and assertion name}

The service needs a fix. Then run `/emporix-qa-postman {KEY}` again.
```

`Stage` is `regression` or `draft`. `Kind` is `product` when the API does
not match the plan, or `draft` when the assertion was wrong and the one
allowed fix still failed. List request names only. Do not paste bodies that
may contain tokens.

On draft FAIL, say the worktree is uncommitted and there is no pull request.

## Session report

```text
QA: {PASS|FAIL|skipped}
Coverage: {none|gap}
Regression: {folder names|all|none}
Stage: {regression|draft|pr}
Collection: {relative path}
Folder: {name or none}
Branch: {KEY}-api-tests
Worktree: {path}
PR: {number} (link: {prUrl})
Issue: {KEY} (link: {browseUrl})
Jira comment: {commentId}
Ready: {yes|no}
```

Omit `Branch` / `Worktree` / `PR` when no branch was created. `Ready: yes`
on PASS and on `Coverage: none`. `Ready: no` on FAIL. On `Coverage: none`
add `Next: /emporix-qa-local-api {KEY}`.
