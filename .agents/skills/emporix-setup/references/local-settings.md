# Local settings (`~/.emporix/settings.json`)

Per developer, per machine, for every repository. Never committed and never
written into `ai-setup.json` (that file is the team's). Override the path
with `EMPORIX_SETTINGS_FILE`. Manage it with `scripts/local-settings.sh`, or
with `/emporix-setup --set-local key=value`.

```json
{
  "worktree": {
    "mode": "ASK_USER",
    "repos": { "cockpits": { "mode": "IN_PLACE" }, "indexing": { "mode": "CURRENT_BRANCH" } }
  }
}
```

## Keys

| Key | Values | Unset |
|---|---|---|
| `worktree.mode` | `ALWAYS_WORKTREE` · `WORKTREE_ON_DIRTY_BRANCH` · `ASK_USER` · `IN_PLACE` · `CURRENT_BRANCH` (any case) | The calling skill's default: `emporix-dev` → `ALWAYS_WORKTREE`; `emporix-feature` → a branch in this checkout (`--worktree` for a sibling) |
| `worktree.repos.<repo>.mode` | same values | `worktree.mode`. `<repo>` is the origin repository name (`emporix/cockpits` → `cockpits`), else the main checkout's folder name. Set with `--repo <repo>` (`local-settings.sh set worktree.mode IN_PLACE --repo cockpits`); names with dots are fine |

Precedence, first match wins: `EMPORIX_WORKTREE_MODE` (env var, one shell or one run) → `worktree.repos.<repo>.mode` → `worktree.mode` → the calling skill's default. A present `worktree`, `worktree.repos`, or `worktree.repos.<repo>` that is not an object is an error, never a silent fallback.

## `worktree.mode`

Where `emporix-dev` and `emporix-feature` put a ticket branch in each
repository the ticket touches. Each repository is checked by
`emporix-feature` `scripts/resolve-checkout.sh`, the moment implement
(or `emporix-dev`'s Worktrees step) first needs the branch:

| Mode | Sibling worktree `{basename}-{KEY}` | Branch in the checkout itself |
|---|---|---|
| `ALWAYS_WORKTREE` | always | never (the classic `emporix-dev` behaviour) |
| `WORKTREE_ON_DIRTY_BRANCH` | any affected repository's checkout is **not** on its base branch (`master` / `main`, the resolved `baseBranch`), or has uncommitted changes — then **every** affected repository gets one | every affected checkout is clean on its base branch |
| `ASK_USER` | the user picks, **one question per repository** | the user picks |
| `IN_PLACE` | never | always: create or check out the ticket branch in the checkout itself (`ensure-branch.sh`) |
| `CURRENT_BRANCH` | never | never switched: work on whatever branch is checked out now (`DECISION=current`). Refused (exit 1) on a detached HEAD, on the base branch, and on a branch named for another ticket (`feat/COP-7-x` while working on COP-8); a branch without a key is fine |

Rules shared by every mode:

- A ticket branch that is already checked out somewhere is reused there, with no question (resume). The one exception: `ALWAYS_WORKTREE` (or `--worktree`) with the branch in the main checkout — git cannot add a worktree for it, so the user is asked to move it or continue in place (`emporix-feature` `references/worktree.md` § Branch in the main checkout).
- `emporix-feature --worktree` forces a sibling worktree for that run, whatever the mode.
- `WORKTREE_ON_DIRTY_BRANCH` decides for the whole ticket: on a multi-product ticket one checkout that is not clean on base sends all repositories to worktrees (`resolve-checkout.sh --group-worktree`). A ticket branch already in a checkout still stays there.
- `IN_PLACE` and `CURRENT_BRANCH` are never pulled into a worktree by `--group-worktree`: only repositories whose own mode is `WORKTREE_ON_DIRTY_BRANCH` follow the group.
- `CURRENT_BRANCH` keeps the run folder `.ai/runs/{TASK_BRANCH}` but commits and pushes the checked-out branch, recorded as `**Working branch:**` in the issue plan; `review` and `pr` stop when another branch is checked out (`emporix-feature` `references/worktree.md` § Current branch).
- `ASK_USER` decides per repository, one question each, so a multi-product ticket can end up with a worktree in one repository and the branch in place in another.
- Nothing stashes, commits, or discards the user's changes to make room for a branch.
