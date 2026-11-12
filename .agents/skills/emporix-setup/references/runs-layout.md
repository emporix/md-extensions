# Run folder

Markdown for one ticket lives in **one folder** under `.ai/runs`. The folder name is the ticket branch. When there is a Jira key, the folder starts with that key. No `feat/` or `fix/` prefix.

```text
.ai/runs/COP-5020-fix-authentication/2026-11-02-COP-5020-issue-plan.md
.ai/runs/COP-5020-fix-authentication/COP-5020-review-findings.md
.ai/runs/COP-5020-fix-authentication/2026-11-02-COP-5020-pr-plan.md
.ai/runs/COP-5020-fix-authentication/2026-11-02-COP-5020-docs-update.md
.ai/runs/COP-5020-fix-authentication/2026-11-02-COP-5020-questions-for-po.md
.ai/runs/COP-5020-fix-authentication/2026-11-02-COP-5020-figma-comparison.md
```

`{RUN_FOLDER}` means `{RUNS_DIR}/{TASK_BRANCH}` (`.ai/runs/COP-5020-fix-authentication`). `{RUNS_DIR}` stays `.ai/runs`. Do not write these files as direct children of `{RUNS_DIR}`.

`.ai/qa`, `.ai/demos`, and `.ai/designs` keep their own layouts. This rule is only `.ai/runs`.

## Resolve before every read or write

```bash
RESOLVE=$(skill_script emporix-setup resolve-run-folder.sh)
sh "$RESOLVE" --root "$ROOT" --key "$KEY" [--title "$TITLE"] [--branch "$BRANCH"] [--pr "$N"] [--create] [--adopt] [--rename-from "$PARENT"]
```

Read the printed fields:

| Field | Use |
|---|---|
| `TASK_BRANCH` | Folder name and the git branch `implement` creates |
| `RUN_FOLDER` | `.ai/runs/{TASK_BRANCH}` relative to `--root` |
| `ISSUE_PLAN` | Newest issue plan (`*-issue-plan.md`, else legacy `*-issue-prepare.md`, else `*-prepare-issue.md`) |
| `LEDGER` | `{KEY}-review-findings.md` |
| `PR_PLAN` | Newest `*-pr-plan.md` for this key (or this `--pr` when there is no key) |
| `DOCS_PLAN` | Newest `*-docs-update.md` |
| `AMBIGUOUS=1` | More than one `{KEY}-*` folder and no branch to choose. **Ask once.** Do not use `ISSUE_PLAN`. Do not create another folder. |
| `PLAN_ELSEWHERE=1` | The plan is in a different `{KEY}-*` folder than `TASK_BRANCH`. **Ask once.** Do not start a second plan and do not merge the folders. |
| `LEGACY=1` | A matching file is still a direct child of `.ai/runs`. The next write passes `--adopt`. |
| `OTHER_FOLDER` | Another folder for this key. Leave it alone unless the user says it is this ticket. |
| `ERROR` | Stop. `ambiguous` means ask. `no-task-branch` means the title or branch is missing. |

`--root` for a write is the **primary** worktree (`git worktree list`, first path). A linked worktree's `.ai` is the same directory (`emporix-feature` `references/worktree.md`). A read looks at this checkout first, then the primary, and uses the first non-empty `ISSUE_PLAN`.

Writes pass `--create`. The first write for a ticket also passes `--adopt`, which moves a legacy flat file into the folder. `--adopt` never overwrites a file already in the folder and never moves a file from another `{KEY}-*` folder.

Pass `--title` only when naming a folder that does not exist yet (draft, or adopt of a flat file). Do not pass `--title` on later reads — a new title must not create a second folder.

## How the name is chosen

1. `--branch`, or the current git branch, when it starts with `{KEY}-` after a prefix before the key is removed. `feat/COP-5020-fix-authentication` → `COP-5020-fix-authentication`.
2. Else the only `{RUNS_DIR}/{KEY}-*` directory.
3. Else `{KEY}-{kebab-slug}` from `--title`: lowercase, non-alphanumerics become `-`, a leading copy of the key is stripped. "Fix authentication" → `COP-5020-fix-authentication`.
4. `main`, `master`, `develop`, and `development` are never a task folder.

No key (a re-ship onto a PR that has none): the folder is the branch with `/` turned into `-` (`feat/no-ticket` → `feat-no-ticket`).

Record `**Branch:** {TASK_BRANCH}` in the issue plan. `implement` uses that name for `ensure-branch.sh`. It does not invent a second slug. A later title edit does not rename the folder.

Parent + prompt: the folder is `{PARENT}-{slug}` until `approve`. Then:

```bash
sh "$RESOLVE" --root "$PRIMARY" --key "$CHILD" --rename-from "$PARENT" --title "$TITLE" --adopt
```

That renames the folder and the filenames to the child key. Set **Ticket** and **Branch** in the plan to match. Do not keep the parent copy.

## Files inside the folder

| Role | Name |
|---|---|
| Issue plan | `{YYYY-MM-DD}-{KEY}-issue-plan.md` |
| Review ledger | `{KEY}-review-findings.md` |
| PR plan | `{YYYY-MM-DD}-{KEY}-pr-plan.md` |
| PR plan, no key | `{YYYY-MM-DD}-pr{number}-pr-plan.md` |
| Docs plan | `{YYYY-MM-DD}-{KEY}-docs-update.md` |
| Docs plan, no key | `{YYYY-MM-DD}-docs-update.md` |
| Ledger, no key | `{TASK_BRANCH}-review-findings.md` |
| Any other note for this ticket | `{YYYY-MM-DD}-{KEY}-{purpose}.md` |

One issue plan per ticket. Overwrite that file on `update`. Do not `git add` anything under `.ai/`.

## Other notes for this ticket

A markdown file you create while working on this ticket, and that is not one of the workflow files above, goes in the **same** `{RUN_FOLDER}`. Examples: clarifying questions for a product owner, a comparison of the ticket with a Figma design, a decision note, a checklist.

```text
{RUN_FOLDER}/{YYYY-MM-DD}-{KEY}-{purpose}.md
```

`{purpose}` is a short kebab slug of what the note is (`questions-for-po`, `figma-comparison`). No key: `{YYYY-MM-DD}-{purpose}.md` inside the key-less branch folder.

- Resolve the folder with the script above (`--create` when it does not exist yet). Use the folder this ticket already has. Do not invent a second `{KEY}-*` folder and do not pass `--title` when one folder already exists.
- Do not use a reserved suffix: `issue-plan`, `pr-plan`, `docs-update`, `review-findings`, `issue-prepare`, `prepare-issue`.
- One file per request. A follow-up on the same note edits that file.
- Do not write the note at the repository root, under `docs/`, or in a new directory.
- The note is context for this ticket. It does not approve work, widen scope, or replace the issue plan. Do not `git add` it.
- `.ai/qa`, `.ai/demos`, and `.ai/designs` still hold the files those skills already define (QA plan, demo plan, design folder). A summary the user asked for about this ticket still goes in `{RUN_FOLDER}`.

In plan mode the plan file stays the approval gate. When the user asks for one of these notes, write that file in `{RUN_FOLDER}` and leave plan mode as it is. The note is not `ExitPlanMode` and it is not `approve`. If the shell is denied, write it in that folder on the first turn the shell allows.

Later stages list `*.md` in `{RUN_FOLDER}` when gathering context. Open a note when the user cites it or the work needs it. Do not implement from it, and do not treat it as the approved plan.

## Plan mode

While plan mode is on, the shell may be denied and the issue plan is not written under `.ai/runs`. The path formula above is what `approve` writes. `approve` runs the resolver for real (`--create --adopt`) as its first action and writes there. A note the user asked for is written in `{RUN_FOLDER}` when they ask (see **Other notes**). A host without plan mode writes the plan to that same path at draft.

## Who must call this

`emporix-feature` (draft, update, approve, implement, review, pr), `emporix-pr` (plan, apply, plan-conformance), `emporix-docs-update` (plan), `emporix-qa-ui` (the issue plan it reads), `emporix-qa-postman` (coverage), `emporix-demo-record` (the issue plan it reads). Any other markdown written for the ticket — including a note that is not one of those stages — uses this folder too. A glob of only `{RUNS_DIR}/*-{KEY}-*.md` misses the folder and loses the plan and the notes.
