# Stage `draft`

Turn the exploration into **one** plan file. Description + contracts + todos. Not code.

**Goal:** specific enough to implement without re-litigating intent; loose enough that the patch can land without locking line numbers.

## When

The user answered **yes** to the draft question in `explore`, or invoked `/emporix-feature draft {KEY}`. If exploration is still thin: draft what is known, mark open questions as blocking in the plan; do not invent scope.

## Jira key (required)

Resolve `{KEY}` in order:

1. Explicit in the args / prompt
2. The key explore used in this conversation
3. Current branch name if it matches `ABC-123` (or contains it, e.g. `COP-6968-…`)
4. Else ask once — do not write the plan without a key

In **parent + prompt** mode `{KEY}` is the parent until `approve` creates the child. In **existing ticket** mode it is that ticket.

## Where

**In plan mode** (Claude Code, the normal case): the plan-mode plan file named by the system message — `references/plan-mode.md` § Draft. `.ai/runs` is written by `approve` after the plan is accepted. The rest of this section is the path without plan mode.

Resolve the folder on the **primary** worktree (`git worktree list`, first path) with `emporix-setup/references/runs-layout.md`: `--key`, `--title` (the plan title), `--create --adopt`. Write:

```text
{RUN_FOLDER}/{YYYY-MM-DD}-{KEY}-issue-plan.md
```

`{RUN_FOLDER}` is `.ai/runs/{TASK_BRANCH}` (`COP-5020-fix-authentication` for key `COP-5020` and title "Fix authentication"). Set `**Branch:**` to `{TASK_BRANCH}`. Overwrite that file when revising (`update`). Do not put the file directly in `{RUNS_DIR}`. Do not `git add`. `.ai/` is local. `AMBIGUOUS=1` or `PLAN_ELSEWHERE=1` → ask once which folder is this ticket; do not start a second plan.

Open the file so it is a visible tab (`cursor --reuse-window <absolute path>` or the host equivalent).

## Shape

Full body from `references/plan-shape.md`. `**Status:** draft`. In parent + prompt mode also **Title** and **Description** (`references/description.md`) — business language only.

### Include

- Problem, outcome, and non-goals
- **Acceptance criteria** as application contracts (Scenario = `WHEN` / `THEN` / `AND`; Requirement = one normative sentence)
- Behavioural contracts that feed those criteria: inputs, outputs, invariants, failure modes, ordering
- **Seams**: which modules or APIs own the change (type, class, or package names are enough)
- A change in another repository decided in explore (for example a shared library) is a seam in that repository: give it its own foundation todo that names the workflow the code-style rules prescribe for it, and note any release the change here waits for
- Sequencing only when order is a real dependency
- **Project knowledge**: files read, files to update after implementation, statements already stale
- A Mermaid diagram in **Approach** when a flow or dependency is clearer than prose

### Leave out (too sharp → conflicts, duplicate work)

- Line numbers, exact diffs, "replace this block with …"
- Full method bodies or copy-paste code (a tiny signature is fine when the contract *is* the signature)
- A file list when one seam owns the change — name the seam, not every call site
- Micro-steps that force two people to edit the same helper the same way
- Formatting, import order, rename-for-style
- Locking one algorithm or library when several fit, unless explore already decided
- Acceptance wording that names classes, private methods, DB columns, or UI selectors as the pass condition

When unsure: one sentence more on **why / contract**, one sentence less on **how / where exactly**.

### Todo grain

- **Outcome todos** ("enforce the cap on the inline path") rather than patch todos ("edit Reader at a line")
- One todo ≈ one reviewable outcome or one seam
- Prefer 3–8 foundation and seam todos. Scenario todos may go past 8; do not merge Scenarios to stay under 8
- Foundation first, then the Scenario todos that need that seam
- **Every Scenario and testable Requirement has a todo** (`scenario-…` / `requirement-…` ids; `Scenario N (label):` in the text; implement + black-box test). Bundle only when inseparable — then list every Scenario number
- `knowledge-update` is the last todo whenever **Update after implementation** is not `none`

## Quality gate (before writing)

- At least one real seam confirmed in a file you opened, or an explicit greenfield.
- Behaviour change → Acceptance criteria present, every Scenario / testable Requirement has a todo.
- **Project knowledge** present. A change to a rule, state, entity, endpoint, event, route, or integration names at least one file under **Update after implementation** and has a `knowledge-update` todo.
- No invented APIs, files, or Scenarios.
- Description (parent + prompt) promises only outcomes the Scenarios cover, nothing in **Out of scope**.
- Blocking questions are concrete ("which of these two parsers wins?"), not "need more context".

A plan whose approach is "update the service" with no seam is a failed run. Keep exploring, or stop with a blocking question.

## After write — hard stop

**In plan mode:** print the report without the `approve · change X · cancel` line, then call `ExitPlanMode` (`references/plan-mode.md` § Draft). The approval dialog is the stop; its answers map to the table below (approved → approve, rejected with feedback → change X, rejected without → cancel). Do not also ask in chat.

**Without plan mode:** chat is one block: the plan path as a markdown link, todo count and Scenario coverage (`Scenarios 1–3 → scenario-reject-oversize, …`), whether blocking questions remain, then:

> approve · change X · cancel

Do not paste the plan body into chat. **End the turn.** Do not call **create-subticket**, **comment-issue**, or **register-issue**. Do not implement.

| User says | Do |
|---|---|
| approve / looks good / create it / go / yes | `references/approve.md` (read the file from disk first — their edits count) |
| change X / too technical / drop Y / retitle … | `references/update.md` on the same file, open it again, stop |
| change X and approve | apply the edits, then `references/approve.md` |
| cancel / stop | Stop. Leave the file. Nothing is written to Jira |

A file on disk is not approval. Approval is a reply in this conversation after the hard stop.
