# Ticket branch in this checkout or in a linked worktree

Implement runs on a branch named `{TASK_BRANCH}` (`{KEY}-{kebab-slug}`, the same name as the `.ai/runs` folder). Where that branch lives depends on the developer's **worktree mode** and the `--worktree` flag.

## Choose: the worktree mode

The mode is a local, per-developer setting: `worktree.mode` in `~/.emporix/settings.json`, optionally overridden per repository under `worktree.repos.<repo>.mode` (or `EMPORIX_WORKTREE_MODE` for one run), one of `ALWAYS_WORKTREE`, `WORKTREE_ON_DIRTY_BRANCH`, `ASK_USER`, `IN_PLACE`, `CURRENT_BRANCH` — `emporix-setup` `references/local-settings.md`. Resolve it per repository before the first branch command:

```bash
RESOLVE=$(skill_script emporix-feature resolve-checkout.sh)
sh "$RESOLVE" --root "$CHECKOUT" --branch "$BRANCH" --base "$BASE_BRANCH" --key "$KEY" \
  ${WORKING:+--working-branch "$WORKING"} --fallback "$FALLBACK" ${FORCE_WORKTREE:+--force-worktree}
```

- `--fallback`: the caller's default when no mode is set. `emporix-feature` passes `IN_PLACE` (its classic default: the branch in this checkout); `emporix-dev` passes `ALWAYS_WORKTREE`.
- `--force-worktree`: the user passed `--worktree`.
- `--working-branch`: the issue plan's `**Working branch:**` when it has one (a resumed run in `CURRENT_BRANCH` mode). The resolver then refuses any other checked-out branch, key-less ones included.

Read `MODE=`, `MODE_SOURCE=`, `CURRENT=`, `DIRTY=`, `DECISION=`, `REASON=`. The script changes nothing.

| `DECISION` | Then |
|---|---|
| `worktree` | § Worktree: linked sibling |
| `in-place` | § In place: branch in this checkout |
| `current` | `CURRENT_BRANCH`: § Current branch. A non-zero exit is the mode's refusal (detached HEAD, the base branch, another ticket's branch, or not the plan's `**Working branch:**`): quote it and stop; never fall back to another decision |
| `ask` | `ASK_USER` and the branch is not checked out anywhere yet: § Ask the user, then one of the two |
| `move` | `REASON=branch-in-primary`: a worktree is wanted (`ALWAYS_WORKTREE` or `--worktree`) but the branch is checked out in the main checkout: § Branch in the main checkout. Never run `ensure-worktree.sh` for it; it would hand back the main checkout as if it were a worktree |

Print one line per repository: `Checkout: {worktree | in place} — {MODE} ({MODE_SOURCE}), {REASON}`.

### Ask the user

One question **per repository**, never one answer for several. A host that takes several questions in one prompt (AskUserQuestion: up to 4) may send them together, one question each. The question names the repository and what the checkout is doing now:

> `{repo basename}` is on `{CURRENT}`{ with uncommitted changes}. Where should `{BRANCH}` live?

- Clean, on base (`CURRENT` = `BASE`, `DIRTY=0`): **In place (recommended)** — switch this checkout to `{BRANCH}`; **Sibling worktree** — `{basename}-{KEY}` next to it.
- Clean, on another branch: **Sibling worktree (recommended)** — the checkout stays on `{CURRENT}`; **In place** — switch this checkout from `{CURRENT}` to `{BRANCH}`.
- Uncommitted changes (`DIRTY=1`): **Sibling worktree (recommended)**; **Stop** — the user commits or stashes first and resumes. Never offer in place: `ensure-branch.sh` refuses a dirty switch, and nothing here stashes for the user.

The answer is not stored. The branch it creates is: the next run finds it checked out (`REASON=reuse-worktree` or `branch-in-checkout`) and does not ask again.

### Branch in the main checkout

`DECISION=move`: the ticket branch is already checked out in the main checkout (typically a ticket started in place, now resumed under `ALWAYS_WORKTREE` or with `--worktree`). Git allows a branch in one checkout only, so no sibling can be made for it yet. Do not edit there yet. Ask once:

- **Move to a sibling worktree** (recommended). The user switches the main checkout back to its base branch, keeping their work on the ticket branch, then resumes the same command; `resolve-checkout.sh` then returns `worktree` and `ensure-worktree.sh` creates `{basename}-{KEY}`. Nothing here switches branches, stashes, or commits for them. Stop with `Ready: no` until they resume.
- **Continue in place.** Treat the main checkout as the ticket checkout for this ticket (§ In place; no `Worktree:` line), and record `Worktree exception: main checkout ({reason})` under **Todos** in the plan.

Before asking, read the plan's **Todos**: a `Worktree exception: main checkout` line means the user already chose **Continue in place** for this ticket, so treat `move` as `in-place` without a question (resume and Auto included).

Auto does not answer this for the user.

## In place: branch in this checkout

```bash
ENSURE=$(skill_script emporix-feature ensure-branch.sh)
sh "$ENSURE" --root "$CHECKOUT" --branch "$BRANCH" --base "$BASE_BRANCH"
```

Read `ROOT=` / `BRANCH=` / `CREATED=`. Later git, tests, edits, review, and the PR stay in **`$ROOT`**.

The script refuses:

- a dirty tree that is not already on `$BRANCH`
- `$BRANCH` already checked out in another worktree (`resolve-checkout.sh` reports that as `reuse-worktree`; continue in that folder)

Do not invent a second clone. Do not `git checkout` another agent's dirty branch (the script stops).

## Current branch

`DECISION=current`: no branch is created, checked out, or switched, and no worktree is made. Edits, tests, review, and the PR stay in `$ROOT` on `CURRENT` (the resolver's `CURRENT=`).

- The run folder stays `.ai/runs/{TASK_BRANCH}`. Write `**Working branch:** {CURRENT}` under `**Branch:**` in the issue plan. Write it whenever `MODE=CURRENT_BRANCH`, also when the resolver returned `in-place` (`REASON=branch-in-checkout`: the ticket branch itself is the one checked out), so the later gates always have a branch to compare.
- Every later stage checks it before touching the tree: a resumed implement passes it as `--working-branch` (the resolver refuses a mismatch), and `review` (§ Inputs, **Tree**) and `pr` (§ 1 Preconditions) stop when another branch is checked out, before any diff, commit, or push. Never switch back for the user.
- Uncommitted changes that are not part of this ticket → stop and ask, as in every mode.
- `pr` pushes `CURRENT` and opens the PR from it; the commit and PR title still start with `{KEY}`.

## Worktree: linked sibling

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

- `git checkout` / `gh pr checkout` in the primary when the ticket uses a worktree
- stash or discard another agent's dirty files
- create a worktree inside the repo (`.ai/worktrees/…`)
- clone a second copy of the repo

Remove with `/emporix-worktree-cleanup {KEY}` after the PR is merged or the user is done.

## Report line

Add `Worktree: {absolute path}` to every later report **only** when the ticket uses a worktree (`DECISION=worktree`, or the user picked it). Later skills treat a missing `Worktree:` as "this checkout". With `MODE=CURRENT_BRANCH` (`DECISION=current`, or `in-place` on the ticket branch), keep `Branch: {TASK_BRANCH}` and add `Working branch: {CURRENT}`: the branch that is checked out, committed, and pushed. A later stage reads `Working branch:` (else `Branch:`) as the branch it must find checked out.
