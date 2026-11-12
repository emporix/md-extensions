# Plan-conformance gate (apply step 4)

Run after the test gate on **every** apply, before Bugbot and before ship. The goal: the fixes address the review comments and nothing else — behaviour the approved issue plan describes is intact, and no change can influence other parts of the system unless the plan says so.

## Plan source (first match wins)

1. `**Issue plan:**` in the PR plan header, when the file still exists.
2. A `Plan:` line reported earlier in this conversation (feature approval).
3. `ISSUE_PLAN` from `emporix-setup/references/runs-layout.md` in this checkout, then in the primary worktree (`git worktree list`, first path). The resolver still returns a legacy flat file and older `*-issue-prepare.md` / `*-prepare-issue.md` names. `AMBIGUOUS=1` or `PLAN_ELSEWHERE=1` → ask once; do not treat a guessed file as the boundary.
4. The PR body's **Technical context** / **Business context** sections (written by the `emporix-feature` `pr` stage).

Use the **Approved plan** section as the boundary (legacy: **Implementation plan**). Honour **Out of scope** (legacy **Do not touch**). A plan file whose `**Status:**` is `draft` is not approved → treat as no plan.

No plan anywhere → the baseline is the PR body plus the diff as it stood before this apply. Say so in the report and review conservatively: any behaviour change beyond the literal comment fixes is a deviation.

## Diff to review

Everything this apply touched: the tree now vs the step-1 snapshot (pre-fix HEAD plus any pre-existing uncommitted work). Include non-ignored untracked files as additions. Do not `git add` to make files visible.

## For each changed hunk

1. **Traceable?** Maps to a triage row from the PR plan (a Fix / Nit, its failing test, or a knowledge update the fix made necessary), or to the issue plan. Untraceable edits are deviations.
2. **Planned behaviour intact?** Nothing the issue plan's Scenarios, Requirements, or todos describe is removed, weakened, or altered. Watch for: changed function contracts, altered validation or defaults, removed error handling, a test edited to pass instead of the code (a test that encoded planned behaviour and now encodes something else is a deviation).
3. **Blast radius in scope?** `AGENTS.md` **Layout** and `ai-project-knowledge/modules/*.md` boundaries. Shared modules, public / exported APIs, DB schemas or migrations, configuration, event contracts, or anything imported outside the PR's stated scope are deviations unless the issue plan names them.

A reviewer asking for a change does **not** make it conform: a human comment can request a deviation, and the user still has to accept it here.

## Outcome

- **Clean** → record `Plan conformance: clean` in the plan's Apply block; continue.
- **Deviation(s)** → hard stop. The message must state explicitly:

  ```text
  Plan conformance: deviation
  We will deviate out of the plan:
  - {file}:{lines} — {what changed} — {why it deviates (behaviour / blast radius / untraceable)} — asked by {comment ID}
  Accept or reject each (or all).
  ```

  Wait for the user — also inside `auto`. **Accept** → record it (`deviation accepted: …`) in the PR plan's Apply block **and amend the issue plan** (below), then continue. **Reject** → revert those hunks from the step-1 snapshot (keep the rest), re-run the test gate; the originating comment gets a reply in step 9 that the fix was rejected as out of plan. Nothing shippable left → stop the apply (and the auto chain).

Never downgrade a deviation to a nit to keep the loop moving. Never ship an unaccepted deviation.

## Amend the issue plan on accept

The approved issue plan is the boundary every later reader uses (`emporix-feature review`, `emporix-docs-update`, the PR body). An accepted deviation that lives only in the PR plan would make that boundary wrong: the next `review` would flag the accepted code as beyond-plan.

When the issue plan is a local file (`plan-conformance.md` § Plan source 1–3), append inside its **Approved plan** section, after **Open questions**:

```markdown
### Accepted deviations

- {ISO date} — PR #{number} — `{file}` — {what changed} — asked by {reviewer login / comment ID} — accepted by the user in `emporix-pr apply`
```

One bullet per accepted deviation; create the heading once. Do not change **Status**, **Approved**, or any other section. Do not `git add`. The `emporix-feature` `pr` stage reads this section into the PR body's **Technical context** and names it in the Jira pointer, so the ticket's copy of the plan is corrected on the same push. When the plan source was Jira or the PR body only (no local file), say so in the report: the deviation is recorded in the PR plan and the self-review summary, and the user should run `/emporix-feature update {KEY}` → `approve` to re-post the plan.
