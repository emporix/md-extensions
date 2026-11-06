# Ticket branch (default) and linked worktree (`--worktree`)

Implement runs on a branch named `{TASK_BRANCH}` (`{KEY}-{kebab-slug}`, the same name as the `.ai/runs` folder). Where that branch lives depends on the flag.

## Default: branch in this checkout

```bash
ENSURE=$(skill_script emporix-feature ensure-branch.sh)
sh "$ENSURE" --root "$CHECKOUT" --branch "$BRANCH" --base "$BASE_BRANCH"
```

Read `ROOT=` / `BRANCH=` / `CREATED=`. Later git, tests, edits, review, and the PR stay in **`$ROOT`**.

The script refuses:

- a dirty tree that is not already on `$BRANCH`
- `$BRANCH` already checked out in another worktree (use `--worktree`, or continue in that folder)

Do not invent a second clone. Do not `git checkout` another agent's dirty branch (the script stops).

## `--worktree`: linked sibling

A linked worktree keeps the primary folder on its current branch so another agent can keep working there. Path: sibling of the primary checkout, `{basename}-{KEY}` (e.g. `cockpits-COP-123`). Git allows one branch in one worktree only; a second agent on the same key **reuses** that folder.

```bash
ENSURE=$(skill_script emporix-feature ensure-worktree.sh)
sh "$ENSURE" --root "$CHECKOUT" --branch "$BRANCH" --base "$BASE_BRANCH" --key "$KEY"
```

Read `WORKTREE=` / `PRIMARY=`. All later git, tests, edits, review, and the PR for this ticket use **`$WORKTREE` as cwd**. Do not edit files in `$PRIMARY` for this change. If the current folder is already that worktree (or already on `$BRANCH`), the script reprints it (`CREATED=0`).

### Plans and config in a worktree

`/.ai` is local and gitignored. `ensure-worktree.sh` symlinks `$WORKTREE/.ai` to `$PRIMARY/.ai` when the sibling has no `.ai` yet, and adds `/.ai` to that worktree's `info/exclude` when the branch does not already ignore it. `ai-setup.json`, `AGENTS.md`, `PROJECT.md`, and `ai-project-knowledge/` are committed and present in every worktree. Plans, the review ledger, mockups, and QA evidence under `.ai/` are the primary checkout's files via the symlink. Do not run setup again in the sibling.

Draft writes the plan on the primary checkout, under `.ai/runs/{TASK_BRANCH}/`; implement looks there too. The symlink makes that the same directory.

### Do not

- `git checkout` / `gh pr checkout` in the primary when `--worktree` is set
- stash or discard another agent's dirty files
- create a worktree inside the repo (`.ai/worktrees/…`)
- clone a second copy of the repo

Remove with `/emporix-worktree-cleanup {KEY}` after the PR is merged or the user is done.

## Report line

Add `Worktree: {absolute path}` to every later report **only** when `--worktree` was used. Later skills treat a missing `Worktree:` as "this checkout".
