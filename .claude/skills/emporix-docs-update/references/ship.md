# Same branch and docs PRs

Product code and documentation are **different git remotes**. Correlate them by **branch name** and the Jira key. One PR per docs repo that changed.

All git / `gh` commands below run with cwd = that docs checkout. Pass `--repo {owner}/{name}` from the target’s `repo`.

## Branch name

1. If the product repo’s current branch matches `^[A-Z][A-Z0-9_]+-[0-9]+-` (or equals `{KEY}`), reuse that exact name.
2. Else `TASK_BRANCH` from `emporix-setup/references/runs-layout.md` (the folder the issue plan is in, or `**Branch:**` in that plan).
3. Else `{KEY}-{kebab-slug}` from the plan title (same rule as the `emporix-feature` implement stage). No `docs/` / `feat/` prefix — the branch must start with the ticket key.
4. No key: ask once. Do not open a docs PR without a key unless the user insists; then use a `docs-{kebab-slug}` branch and say there is no Jira pointer.

Sanitize; never interpolate raw ticket text into the shell.

## Create or reuse (before writing)

For each docs repo the plan will edit:

1. **default-branch** in that repo (`gh repo view --repo {repo}` or its `origin/HEAD`).
2. **search-prs** `--repo {repo}` for this branch and `{KEY}`. Reuse that branch name when a PR exists. Do not open a second PR later.
3. **ensure-worktree** in that docs checkout (same script as product
   `emporix-feature` `references/worktree.md`):

   ```bash
   ENSURE=$(skill_script emporix-feature ensure-worktree.sh)
   sh "$ENSURE" --root "$DOCS_ROOT" --branch "$DOCS_BRANCH" --base "$DOCS_BASE" --key "$KEY"
   ```

   All later edits, commits, and `gh` for this repo use cwd = `WORKTREE`.
   Do **not** `git checkout -B` in the primary docs folder.

Unrelated dirty files **in that worktree** → **stop** and ask. Do not stash or discard.

## Commit (after the author ships)

Stage only the planned documentation files (`SUMMARY.md`, pages, OpenAPI, changelog entry, assets). Do not `git add -A`. Do not stage `.cursor/` inbox shots or secrets.

Commit **as the GitHub token owner**. Do not plain `git commit`. Do not `git config user.*`.

```bash
# skill_script was defined by the loader sourced in the product repo; the
# path it returns is absolute, so it works with cwd = the docs checkout.
SCRIPT=$(skill_script emporix-feature git-commit-as-user.sh)
sh "$SCRIPT" "{KEY} docs: {one-line summary}"
```

Run the script with cwd = the docs repo (it calls `git commit` in `$PWD`). Message starts with `{KEY}`. After commit, `git log -1 --format='%an <%ae>'` must be the token owner.

Already committed and unpushed as the token owner → skip a new commit. Agent-authored unpushed commits → soft-reset onto one script commit. Agent-authored **pushed** commits → stop.

Nothing to commit and nothing unpushed → no PR for that repo.

```bash
git push -u origin "$(git branch --show-current)"
```

Do not push to that repo’s default branch.

## PR body

Title: `{KEY} docs: {one-line summary}` (or `--title` that still starts with the key). Ready unless `--draft`.

**search-prs** in `{repo}` for this branch and `{KEY}`. Exists → **update-pr**. Else **create-pr** `--repo {repo}` `--base "$DOCS_BASE"`.

```markdown
<!-- Copilot: documentation for Jira {KEY}. Product change is in a separate repository. -->

## Ticket

{KEY} — {browseUrl}

**Summary:** {Jira summary}

## Why these docs

{from the approved docs plan}

## What changed

{pages / OpenAPI / changelog paths in this repo only}

## Product change

Product PR: {url or "not opened yet"}
Product branch: {name} (same branch name as this PR)
```

No `Fixes #n` for a Jira key.

## Jira

On `{KEY}` only, after every docs PR is open or updated:

- **comment-issue** preamble `🤖 emporix-docs-update`, body: each docs PR URL + repo + branch.
- **register-issue** only if **get-issue** had no `registeredFeatureId`.

Do not comment on a parent. Do not merge.
