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
  },
  "models": {
    "analyst":   { "claude-code": ["opus", "sonnet"] },
    "explorer":  { "claude-code": ["sonnet", "haiku"] },
    "architect": { "claude-code": ["opus", "sonnet"] },
    "coder":     { "claude-code": ["sonnet", "opus"] },
    "reviewer":  { "claude-code": ["opus", "sonnet", "haiku"], "cursor": ["gpt-5.4-medium"] }
  }
}
```

## Keys

| Key | Values | Unset |
|---|---|---|
| `worktree.mode` | `ALWAYS_WORKTREE` · `WORKTREE_ON_DIRTY_BRANCH` · `ASK_USER` · `IN_PLACE` · `CURRENT_BRANCH` (any case) | The calling skill's default: `emporix-dev` → `ALWAYS_WORKTREE`; `emporix-feature` → a branch in this checkout (`--worktree` for a sibling) |
| `sonar.enabled` | `true` · `false` | `true`: `emporix-feature` `sonar-scan` runs a local SonarQube in Docker on Java repositories. `false` skips it (`sonar: SKIP \| reason=disabled`; the PR's Sonar comment says so). `EMPORIX_SONAR=off` does the same for one shell |
| `models.<role>` | a slug, a JSON array of slugs, or `{"<host>": slug \| [slugs]}` | The built-in default for this host — § Model roles |
| `models.<role>.<host>` | a slug or a JSON array of slugs | `models.<role>` when it is a slug or an array, else the built-in default — § Model roles |
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

## Model roles

Which model each kind of `emporix-dev` subagent runs on. One ordered list per
role: the first slug is the one used, the rest are fallbacks (or, for panels,
the next members).

| Role | `emporix-dev` uses it for | How the list is read |
|---|---|---|
| `analyst` | The requirements review at the start of explore (Feature, Bugfix) — `emporix-dev` `references/requirements-review.md` | First slug; the next one when it is unavailable |
| `explorer` | Read-only codebase sweeps delegated during explore, draft, and Investigation, and the `explore` subagent `how` launches | First slug; the next one when it is unavailable |
| `architect` | Design perspectives (`references/architect.md`) | The first N available (`--models N`, default 2); later slugs fill a gap |
| `coder` | The coder subagent of every build phase (`references/build.md`) | First slug; the next one when it is not offered or fails to start or errors. Sticky: later phases stay on the fallback |
| `reviewer` | The review panel for Review, re-ship, and PR comments (`references/review-loop.md`) | The first N eligible (`--review-models N`, default 2) after the independence rules; the rest fill gaps |

**Value shapes.** A slug is `[A-Za-z0-9._:/-]+` (`opus,sonnet` is refused: use the array). A slug (`"opus"`, the same as `["opus"]`) or an array applies
on every host. An object maps a host to a slug or an array:
`{"claude-code": ["sonnet", "opus"], "cursor": "gpt-5.4-medium"}`. Hosts are
`[a-z0-9-]+`; the skills pass `claude-code` on Claude Code and `cursor` on
Cursor. Use the slugs or aliases the host takes for a subagent model (Claude
Code: `opus`, `sonnet`, `haiku`, `fable`), never a dated version id.

**Precedence**, first match wins:

1. A flag on the run (`--models`, `--coder-model`, `--review-models` / `--review-model`); `analyst` and `explorer` have none.
2. `models.<role>.<host>`, then `models.<role>` when it is a slug or an array.
3. The built-in default for the host (below).
4. Nothing: the calling skill uses its own heuristics (the host's default subagent model, the reviewer pick order).

**Built-in defaults** exist for `claude-code` only, because other hosts name
their models per account:

| Role | `claude-code` |
|---|---|
| `analyst` | `opus`, `sonnet` |
| `explorer` | `sonnet`, `haiku` |
| `architect` | `opus`, `sonnet` |
| `coder` | `sonnet`, `opus` |
| `reviewer` | `opus`, `sonnet`, `haiku` |

The reviewer panel never includes a model the coder ran on, so with the
default coder it is `opus` + `haiku`.

**Commands.**

- `local-settings.sh models <role> [--host HOST]` prints the resolved list, one slug per line; empty means "use the heuristics". Without `--host` the host is `claude-code` when `CLAUDECODE=1`, else none (only slugs and arrays apply).
- `local-settings.sh init-models` writes the built-in defaults for every role that is not set yet and never touches one that is. Every full `/emporix-setup` run (fresh or redo) runs it, step 0c.
- `local-settings.sh set models.<role> <value>`: a value starting with `[`, `{`, or `"` is parsed as JSON, anything else is one slug (so `false` or `42` is a slug, never a boolean or number). It replaces whatever the role held, a host map included.
- `local-settings.sh set models.<role>.<host> <value>` (unsetting included) refuses when the role holds a slug or an array for every host: unset it first (`set models.<role> ''`) or set the whole map on `models.<role>`.
- An empty value removes the key, and a host map it leaves empty.
- A stored role that is not one of the shapes above is an error when it is read (`models <role>` exits 1 with the reason), never a silent fallback; other roles still resolve. `set models.<role> …` or `set models.<role> ''` replaces it and so repairs it. A `set` checks only the role it writes (a host-level set refuses a malformed target role), so another malformed role never blocks it. A stored `null` role is one of these malformed roles, not a missing one: `init-models` warns and leaves it as is.
- A `models` key that is present but not an object (`null` included) is an error for `models`, `init-models`, and every `get` or `set` of a `models` or `models.*` key (other keys still read and write); fix or remove it in the file by hand.
