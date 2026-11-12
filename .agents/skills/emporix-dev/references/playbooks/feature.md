# Feature

**New or changed behaviour. Plan it with the user, design it twice, build against the design, ship through `emporix-feature`.**

1. Explore in plan mode: `emporix-feature` `references/explore.md`, plus § Plan rules. Run `how` over an unfamiliar subsystem. Another repository involved → decide the model with `references/multi-repo.md` (dependency change or multi-product ticket).
2. Draft: `emporix-feature` `references/draft.md`, plus § Plan rules. Hard stop (`ExitPlanMode`, or *approve · change X · cancel*). Feedback → `update`, then publish again.
3. Approve: `emporix-feature` `references/approve.md` (Jira comment, plan in `{RUN_FOLDER}`). Then come back to this list. Do not start `emporix-feature` implement on your own.
4. Other repositories: `references/multi-repo.md`. Dependency change → `skip: dependency change via {workflow}` (its foundation todo runs in step 7). Multi-product ticket → dev-plan and repositories (§ After approve). Neither → `skip: single repo`.
5. Worktrees: `references/worktrees.md` (one ticket checkout per affected repository, a sibling worktree or the branch in place as the worktree mode decides; all before architect).
6. Architect: `references/architect.md`. Skip only for a trivial change (one function, obvious placement, no new type, public signature, or module), with `skip: trivial — {why}`.
7. Implement: `emporix-feature` `references/implement.md` with `references/build.md` (scaffold, then fail-first tests, then bodies; the sketch is the contract).
8. Review: `emporix-feature` `references/review.md` with `references/build.md` § Review.
9. Run **Open a PR** (`references/playbooks/open-a-pr.md`).

**Reply:** what was built, for whom, and what changes for them. The design candidates and the pick as a table, deviations with their diagnoses, the review verdict, the PR URL(s), and open decisions, and the principles that changed a decision.

## Plan rules

What steps 1–2 (and `update`) add to `emporix-feature`'s explore, draft,
and update. Each runs the `emporix-feature` file **as written** (plan
mode, key rules, plan location, quality gate, hard stop) plus these rules.
Only the numbered steps above go into the todo list.

### `draft`

Header: replace the `**Source:**` line with

```markdown
**Source:** emporix-dev
**Playbook:** feature
```

A plan with no `**Playbook:**` line (written by `/emporix-feature`) is also a
feature plan.

Scope through `experience-first.md`: name who consumes the change (end
user, API or library caller, next maintainer) and keep only the Scenarios,
options, and parameters that user would recognise as needed. Error, empty,
and loading states are Scenarios, not polish. A UI change with open layout
or flow questions settles them in a mockup (`emporix-design`) before
approve, not in code.

**Approach** names decisions and contracts, not class designs. Types,
signatures, and module layout are architect's job. Leave them out of the
plan so the perspectives are not anchored on a shape.

### `update`

Write `**Source:** emporix-dev` and `**Playbook:** feature` (a plan taken over from `/emporix-feature` gets both now, `SKILL.md` § Rules; an `emporix-dev` plan keeps them). A change to **Acceptance criteria**,
**Seams**, or **Todos** marks the design sketches it touches `stale`
(`SKILL.md` § Rules).
