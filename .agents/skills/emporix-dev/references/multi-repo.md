# Other repositories

A ticket whose change reaches beyond this repository uses one of two
models. Explore decides which, says so once, and the plan records it.

| | **Dependency change** (default) | **Multi-product ticket** |
|---|---|---|
| When | This repository needs something a shared dependency owned by another repository lacks (a library method, a component, a client) | The ticket itself ships product changes in several repositories (a service and its helm chart, an API and the cockpit that calls it, a producer and its consumers) |
| Plan | One ordinary plan. The other repository's change is a **foundation todo** naming the workflow `AGENTS.md` **Code style** prescribes for that dependency, plus any release this change waits for | One plan with **Repos** and a **Merge plan**; every todo tagged with its repository |
| Owner of the other repository's change | That workflow (for example the library contribution in `emporix-frontend-standards`), its worktree, and its release | `emporix-dev`: a ticket checkout, implement, review, and PR per repository |
| Rules | `emporix-feature` `references/explore.md` (ask during explore, record the decision), `references/draft.md` (the foundation todo), `references/implement.md` (an unplanned change in another repository is a deviation: stop and ask) | The rest of this file |
| PRs | The PR for this repository, plus whatever that workflow ships | One per repository, shipped in **Merge plan** order |

**Dependency change** needs nothing beyond `emporix-feature`'s rules. In
`emporix-dev`, the playbook's other-repositories step is `skip: dependency
change via {workflow}`. The Worktrees step covers this repository only
(`references/worktrees.md`). Architect treats the dependency's new or
changed API as a **boundary contract** in the in-repo sketch, and does not
design the dependency's internals.

**Multi-product ticket** is the rest of this file. When unsure, ask once.
A library or component that several products use is a dependency change,
even when this ticket is its first user.

## Multi-product ticket

One Jira key whose change ships product code in more than one repository.
`emporix-feature` handles one repository per run, so `emporix-dev` keeps a
**dev-plan** for the whole change and gives each repository an ordinary
single-repo **slice** of it. Every owner stage then runs per repository,
unchanged: one branch, one review ledger, one PR per repository, all with
the same key.

```text
explore/draft (one plan, Repos + Merge plan) ──> approve (one Jira comment)
  ──> dev-plan ──> architect: Cross-repo layer ──> in-repo sketches ──> slices
  ──> per repo, Merge plan order: implement + build ──> review
  ──> one PR question ──> per repo, Merge plan order: emporix-feature pr ──> Watch PR per PR
```

### Plan shape (draft and update, any playbook)

Explore names a second repository that ships product changes → confirm
once that the ticket is a multi-product ticket. Then the plan adds, on top of the playbook's rules:

- Header line after `**Ticket:**`: `**Repos:** {id}, {id}, …`
- Inside **Approved plan**, right after `### Seams`:

  ```markdown
  ### Repos

  | Id | Path hint | Role |
  |---|---|---|
  | {id = checkout folder name} | {folder, relative to the launch checkout's parent} | primary · producer · consumer · deploy · docs |

  ### Merge plan

  1. {id} — {why first}
  2. {id} — {depends on 1 because …}

  Risks: {reverse order; partial land; compat window; deploy coupling}
  ```

- Every todo carries its repository: `` `scenario-x` [repo: {id}] — … ``.
- Each Scenario names the repository whose black-box test asserts it: `(tested in: {id})`.

The draft's quality gate also fails when: a todo has no `[repo: …]`, a
listed repository has no todo, a Scenario has no `tested in`, or the
**Merge plan** has no order or no risks.

### Resolve the repositories

Before architect (and on every later stage):

1. The **launch checkout** is the one this conversation runs in. Resolve each `Path hint` against its parent folder (`dirname(launch)/{hint}`) and the open workspace folders. Missing → ask once for the path. Never clone.
2. Each repository needs `ai-setup.json`, `AGENTS.md`, and `PROJECT.md`. Missing → stop; `/emporix-setup` in that repository first.
3. Source the shared loader **per repository** (cwd = that checkout): `RUNS_DIR`, `BASE_BRANCH`, `VALIDATION_COMMANDS`, and `APP_KIND` differ between repositories.
4. One ticket checkout **per repository**, all decided, created or reused, and verified before the first edit in any of them (`references/worktrees.md`). The worktree mode decides: a sibling worktree branched from the checkout above (which then is not edited), the ticket branch in that checkout itself, or (`CURRENT_BRANCH`) the branch already checked out there. Each repository may have its own mode (`worktree.repos.<repo>.mode`). `WORKTREE_ON_DIRTY_BRANCH` decides for all repositories at once (one checkout not clean on base → worktrees everywhere); `ASK_USER` asks one question per repository.

Record `Repo {id}: {absolute path}` lines in every report.

### After approve: the dev-plan

`approve` wrote `{RUN_FOLDER}/{YYYY-MM-DD}-{KEY}-issue-plan.md` in the launch
checkout and posted the whole plan to Jira once. Copy that file to
`{RUN_FOLDER}/{YYYY-MM-DD}-{KEY}-dev-plan.md` in the launch checkout (a ticket note in the same run folder, `runs-layout.md` § Other notes). The
dev-plan is the master: all repositories, the **Merge plan**, the full
design sketch, all `#### Deviations`. Architect and build write there.

Then `references/architect.md` with the Cross-repo layer first.

### Slices

After architect, and again after every change to the dev-plan (a recorded
deviation, a reground, an `update`), write one slice per repository to
`{RUN_FOLDER}/{YYYY-MM-DD}-{KEY}-issue-plan.md` **in that repository**, resolving its run folder with `resolve-run-folder.sh --root {that repository's main checkout} --key {KEY} --branch {TASK_BRANCH} --create` so every repository uses the same folder name (in the
launch checkout this overwrites the approved file; the dev-plan keeps the
master). A slice is the dev-plan with:

- Header line `**Repo:** {id} — slice of {absolute dev-plan path}`.
- **Todos**: only `[repo: {id}]` todos. Each other todo moves to **Out of scope** as `Todo {todo-id} — in {repo} (same key, its own PR)`.
- **Acceptance criteria**: unchanged. Each Scenario `tested in` another repository is added to **Out of scope** as `Scenario N — asserted in {repo}`.
- **Design sketch**: `#### Cross-repo` plus only this repository's `#### Todo {id}` sketches and deviations.
- **Project knowledge**: only this repository's files.

A slice is an ordinary `emporix-feature` plan. That is why
`/emporix-feature review`, `/emporix-feature pr`, and `/emporix-pr` work on
each repository without knowing about the others. Do not hand-edit slices;
change the dev-plan and re-slice. `emporix-pr apply` may append
**Accepted deviations** to a slice — copy those bullets back into the
dev-plan the next time `emporix-dev` runs on the key.

### Implement and review, per repository

In **Merge plan** order, for each repository: cwd = its ticket checkout
(`references/worktrees.md`), then `emporix-feature`
`references/implement.md` (with `--worktree` when that checkout is a worktree) and
`references/build.md`, then `references/review.md` with
`references/build.md` § Review.

- The branch name is `{KEY}-{slug}` with the same slug in every repository (implement derives it from the plan title, which the slices share).
- Repositories with no edge between them in the Cross-repo **System map** may run in parallel, one subagent per repository, each in its own ticket checkout. Dependent repositories run in order.
- A consumer that needs a producer change that is not released follows the sketch's **Compat / merge** (for example tests against the boundary contract). Never publish an artifact, bump a shared version on a registry, or deploy to make it work.
- A deviation that touches a Cross-repo contract stops **every** repository that honours it (`references/build.md` § Deviations).

### The PR question and shipping

When every repository's review is **PASS**: one PR question for all of
them (the `emporix-feature` § Gates review row, naming each repository's
QA options), listing the repositories in **Merge plan** order. A **FAIL** in
one repository → its *fix by hand / waive / stop* question first; its
dependents in the **Merge plan** do not ship until it passes; independent
ones may.

On yes: `emporix-feature` `references/pr.md` **once per repository**, in
**Merge plan** order, cwd = that repository's ticket checkout. Each run makes its own
token-owner commit, push, PR, self-review comment, and Jira pointer, so the
ticket collects every PR URL. `emporix-dev` does not edit PR bodies to
cross-link them.

Report, in **Merge plan** order:

```text
{n}. {repo id} — {PR URL} — review: PASS — merge {first | after {id}}
```

The **Auto** playbook then runs **Watch PR** on each PR in the same order (`references/playbooks/auto.md` step 4).

### Rules

- One key, one branch name, one review ledger and one PR per repository. The same branch name in several repositories is safe: **search-prs** and every PR operation in the `github` descriptor are scoped with `--repo {owner}/{repo}`, so repository B's first ship never sees repository A's PR as a re-ship.
- One `*-{KEY}-issue-plan.md` per repository: the dev-plan and every slice reuse the **approved file's date prefix** and overwrite, never a second date.
- Never clone a repository, never edit one that is not under **Repos**.
- The Cross-repo layer is never skipped and is locked before any in-repo sketch.
- Jira: `emporix-dev` writes nothing. `approve` posts the whole plan once; implement, review, and pr post their usual evidence and pointer once per repository.
