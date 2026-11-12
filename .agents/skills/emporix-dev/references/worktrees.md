# Worktrees

Ticket work in `emporix-dev` runs in one **ticket checkout** per affected
repository: `emporix-feature`'s linked sibling worktree, or the repository's
own checkout on the ticket branch. The developer's **worktree mode** picks
which, per repository. The mechanics are `emporix-feature`'s and are not
repeated here: `references/worktree.md` § Choose (`resolve-checkout.sh`, the
per-repository question), § Worktree (`ensure-worktree.sh`, the
`{basename}-{KEY}` folder, reuse, the `.ai` link, what not to do, cleanup),
§ In place (`ensure-branch.sh`), and § Report line. This file adds only what
`emporix-dev` requires on top.

## Worktree mode

`worktree.mode` in `~/.emporix/settings.json` (or `EMPORIX_WORKTREE_MODE`),
set with `/emporix-setup --set-local worktree.mode=…`
(`emporix-setup` `references/local-settings.md`):

| Mode | Per repository |
|---|---|
| `ALWAYS_WORKTREE` (unset = this) | Always a sibling worktree. The main checkout is never edited for a ticket. |
| `WORKTREE_ON_DIRTY_BRANCH` | **All at once**: when any affected repository's checkout is not on its base branch (`master` / `main`) or has uncommitted changes, every affected repository gets a sibling worktree. Only when all of them are clean on base does the branch go in place everywhere. |
| `ASK_USER` | The user decides, one question per repository. |
| `IN_PLACE` | The ticket branch in the repository's own checkout. |
| `CURRENT_BRANCH` | The branch already checked out, never switched (`emporix-feature` `references/worktree.md` § Current branch). Refused on the base branch, a detached HEAD, or another ticket's branch. |

Each repository may override the mode under `worktree.repos.<repo>.mode`
(`/emporix-setup --set-local worktree.mode=… --repo`), so one ticket can
mix modes across repositories.

`emporix-dev` always calls `resolve-checkout.sh` with
`--fallback ALWAYS_WORKTREE`, and with `--force-worktree` when the user
passed `--worktree`. Print `Worktree mode: {MODE} ({MODE_SOURCE})` once per
run; when the source is `default`, add `— set yours with /emporix-setup --set-local worktree.mode=…`.

## When

The playbook's Worktrees step, after approve and **before architect**.
Every later step (implement, Review, Open a PR, PR comments, Watch PR) runs
with cwd = that repository's ticket checkout. The `emporix-feature` stage
files it runs get `--worktree` only when that checkout is a worktree.

## Which

- One ticket checkout per affected repository: this one for a single-repo plan or a dependency change (the dependency's own workflow owns its checkout); every row of **Repos** for a multi-product ticket (`references/multi-repo.md`).
- Branch: the open PR's branch for `{KEY}` in that repository (**search-prs**), else the plan's `**Branch:**` (`TASK_BRANCH`). Multi-product: the same `TASK_BRANCH` in every repository.
- Decide every repository first: run `resolve-checkout.sh` in each (cwd and `--root` = that repository's main checkout, `--base` = its own resolved `BASE_BRANCH`, `--key {KEY}`, and `--working-branch` = that repository's recorded working branch when the plan has one).
- `WORKTREE_ON_DIRTY_BRANCH` with more than one repository: the decision is for the ticket, not per repository. When any repository returned `DECISION=worktree` with `REASON` `not-on-base`, `uncommitted-changes`, or `reuse-worktree`, run the script again with `--group-worktree` in every repository that returned `clean-base`; each now returns `worktree` (`REASON=other-repo-not-clean`). Print `Worktree mode: all repositories get a worktree — {repo} {reason}` naming the repository that triggered it. A repository whose ticket branch is already in its checkout (`branch-in-checkout`) stays there; never move an existing branch.
- `DECISION=move` (`REASON=branch-in-primary`) in a repository → ask now, before creating anything (`emporix-feature` `references/worktree.md` § Branch in the main checkout). **Move** stops the whole ticket until the user resumes; **Continue in place** makes that repository's main checkout its ticket checkout. A plan that already has `Worktree exception: main checkout` for this ticket → in place, no question.
- `DECISION=ask` in one or more repositories → ask now, **one question per repository** (`emporix-feature` `references/worktree.md` § Ask the user), before creating anything. Batch them into one prompt when the host allows (AskUserQuestion: up to 4 questions), still one question each. A **Stop** answer stops the whole ticket before any branch is made. Auto does not answer these for the user.
- `DECISION=current` → nothing to create; that repository's main checkout on `CURRENT` is its ticket checkout. A non-zero exit from the resolver is `CURRENT_BRANCH` refusing: quote it and stop the whole ticket.
- Then create or reuse **all** of them (`ensure-worktree.sh` or `ensure-branch.sh`), and check each is on its ticket branch (`CURRENT` for `current`), before the first edit in any repository. One missing → stop; no partial start. Per repository print `Repo {id}: {worktree created | worktree reused | in place created | in place reused} — {REASON}` and then `Worktree: {path}` or `Branch: {TASK_BRANCH} in {main checkout path}`; with `MODE=CURRENT_BRANCH` (`current`, or `in-place` on the ticket branch) also `Working branch: {CURRENT}`, and write it as `**Working branch:**` in the issue plan (multi-product: one per repository in **Repos**) before architect.
- A script failure → quote its stderr and stop. Never fall back silently to the other kind of checkout.

## Edit gate

From the Worktrees step until the PR merges:

- Product and test edits, formatters, and test commands run only with cwd = that repository's ticket checkout and paths under it.
- A repository whose ticket checkout is a worktree: its main checkout is read-only for the ticket.
- A repository on the branch in place or on its current branch: the main checkout **is** the ticket checkout. Do not switch its branch, stash, or reset it while the ticket is open; another `/emporix-dev` on a different key in that repository gets its own decision (under `WORKTREE_ON_DIRTY_BRANCH` that ticket now gets worktrees in all its repositories, since this checkout is no longer on base).
- The host can edit only inside the folder it has open, and a worktree is outside it → stop before the first edit. Ask the user to open the worktree (or add it to the workspace), then resume with `/emporix-dev implement {KEY}`.
- Subagents (coder, reviewer) get the absolute ticket checkout path as their only writable root.

## Branch in the main checkout

`DECISION=move` (`REASON=branch-in-primary`): the ticket branch is already
checked out in the main checkout and a worktree is wanted (`ALWAYS_WORKTREE`
or `--worktree`); typically a ticket started under `/emporix-feature`, whose
default puts the branch there. The question and both answers are
`emporix-feature` `references/worktree.md` § Branch in the main checkout;
**Move** resumes with `/emporix-dev {KEY}`.

Under `WORKTREE_ON_DIRTY_BRANCH` and `ASK_USER` (without `--worktree`) the
same state is `REASON=branch-in-checkout`: the branch is already where an
earlier run (or the user) put it, so work continues in place without a
question.
