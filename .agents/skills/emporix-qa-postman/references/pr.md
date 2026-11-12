# Pull request

Run this only when the draft exited 0 and regression passed (`Regression: none`
counts as passed). Cwd = the Postman worktree. Repo: `qa.postman.repo` (expect `emporix/postman-collections`).

## Commit

Use the absolute `$COMMIT` resolved in the product checkout (`SKILL.md`).
Do not look the script up again from this directory.

Stage:

- the `*.postman_collection.json` this run changed
- a `*.postman_environment.json` **only when it is new** versus
  `origin/develop` (`git status` untracked, or
  `git diff --name-status origin/develop` shows `A`)

Before staging that new template, confirm `api-url`, `tenant`, `client_id`,
and `client_secret` are empty. A template that already exists on
`origin/develop` stays unstaged, including any edit. Also leave unstaged:
`.ai/`, Newman HTML, and the generated env under `{QA_DIR}/postman/env/`.
Unrelated dirty files → stop and ask.

Stage those paths first. Then commit only when the index changed:

```bash
if git diff --cached --quiet; then
  echo "Draft matches HEAD; skip commit."
else
  sh "$COMMIT" "{KEY} add API tests for {scenario}"
fi
```

An empty index after that staging means this rerun did not change the
collection or a new template. Do not treat `Nothing staged` as a failure
and do not call `$COMMIT` again. The message, when used, starts with
`{KEY}`. No `feat:` / `fix:` prefix. Do not `git config user.*`. Do not add
an agent `Co-authored-by` trailer.

Then, including when the commit was skipped:

- `git log -1 --format='%an <%ae>'` must be the `gh` user before any push.
  An agent author → do not push.
- HEAD is already on `origin/develop` (nothing was ever committed for this
  draft) → stop. Do not push and do not open an empty pull request.
- HEAD is a user commit that `origin/develop` does not contain → continue
  to push and reuse or update the pull request.
- Unpushed agent commits that are not on the remote → soft-reset onto one
  script commit. Agent commits already on the remote → stop and say so.

## Push

```bash
git push -u origin HEAD
```

The current branch must be `{KEY}-api-tests`. Refuse a push when it is
`develop`, `master`, or `main`.

## Open or reuse

**search-prs** in `emporix/postman-collections` for `{KEY}-api-tests` and for
`{KEY}`. One pull request per key.

Title: `{KEY} {one-line summary}`.

Base: `develop`. Ready for review (omit `--draft`).

```bash
gh pr create --repo "$POSTMAN_REPO" --base develop --title "{KEY} …" --body-file "$BODY_FILE"
```

An open pull request for this branch → push, then **update-pr** title and body.
Do not open a second one. Do not merge.

## Body

```markdown
## Ticket

{KEY} — {browseUrl}

## Contract

{routes / fields this draft asserts, from the product diff}

## Tests

- Collection: {path}
- Folder: {folder name}
- Newman against the local service: regression pass, draft pass

## Review

QA reviews and merges into develop.
```

With `--self-review`, replace the Review section with: the ticket assignee
reviews and merges this pull request.

No secrets, tenant values, or generated env contents. Do not write
`Fixes #n` for a Jira key.
