# Refactor

**Change the structure, keep the behaviour. Pin every contract, put a safety net under it, design the target twice, then move in small steps that keep the suite green.**

A behaviour change found on the way is not part of this playbook. Note it as a follow-up **Bugfix** or **Feature** ticket.

1. Explore in plan mode: `emporix-feature` `references/explore.md`, plus § Plan rules → explore. That covers the motivation, every contract the target touches, the tests covering each, and the target structure. Offer `how` once for an unfamiliar subsystem.
2. Draft: `emporix-feature` `references/draft.md`, plus § Plan rules → draft (Requirements only, a **Safety net** table, the `safety-net` todo first, then `step-…` todos). Hard stop. Feedback → `update`.
3. Approve: `emporix-feature` `references/approve.md`. Then come back to this list.
4. Other repositories: `references/multi-repo.md`. Dependency change → `skip: dependency change via {workflow}` (its foundation todo runs in step 7). Multi-product ticket → dev-plan and repositories (§ After approve). Neither → `skip: single repo`.
5. Worktrees: `references/worktrees.md` (one ticket checkout per affected repository, a sibling worktree or the branch in place as the worktree mode decides; all before architect).
6. Architect: `references/architect.md`, always. The explore target is the brief, and the chosen sketch is the target structure. For internals the sketch wins over **Approach**. A shape that would move a pinned contract is rejected.
7. Implement: `emporix-feature` `references/implement.md` with `references/build.md`, in this order:
   - Tests first: the `safety-net` todo, all green on the **unchanged** code.
   - Cleanup: subtract first.
   - Scaffold the new shapes **unwired**, so the suite stays green.
   - Pin: `skip: no new Scenario`.
   - Bodies: the `step-…` todos, with the full suite green after each.
8. Review: `emporix-feature` `references/review.md` with `references/build.md` § Review. A broken Requirement is an in-plan fix. A repair that would change behaviour is beyond the plan and stops the loop.
9. Run **Open a PR** (`references/playbooks/open-a-pr.md`).

**Reply:** the structure that changed, the contracts it held and the safety net that proves it, and the steps taken. Then what got simpler for the next maintainer, in layers to trace and state to hold (`minimize-reader-load.md`), the follow-up tickets for bugs found on the way, the review verdict, the PR URL(s), and the principles that changed a decision. No new behaviour.

## Plan rules

What steps 1–2 (and `update`) add to `emporix-feature`'s explore, draft,
and update. Each runs the `emporix-feature` file **as written** (plan
mode, key rules, plan location, quality gate, hard stop) plus these rules.
Only the numbered steps above go into the todo list.

A refactor needs a Jira key like any other plan (`emporix-feature`
`references/draft.md` § Jira key). No ticket yet → ask once for the parent
key; parent + prompt mode then creates the child at `approve`.

### `explore` — adds to `emporix-feature` `references/explore.md`

1. **Target and motivation.** What moves, and why now: a feature that needs
   the new shape, duplication, a module too large to change safely, a seam
   in the wrong layer. The motivation decides the target structure; a
   refactor with no reason is the first question. Pure performance work with
   measurable goals fits `emporix-improve-service-performance` better — say
   so once.
2. **Current structure.** Read the target and its callers. For an
   unfamiliar subsystem, offer `/how` once for a walkthrough.
3. **Contracts.** Everything observable from outside the target that must
   stay the same: HTTP requests and responses, events and their payloads,
   persisted data shape (old documents must stay readable), exported
   module or package API, configuration keys, UI behaviour. Each one becomes
   a Requirement.
4. **Coverage.** For each contract, the existing tests that would fail if it
   changed. Name the test files. A contract with no such test is a gap the
   safety net fills.
5. **Target structure.** The shape after the refactor and an order of steps
   in which each step leaves the code compiling and the suite green.
6. **Behaviour change found?** A bug or a desired behaviour change in the
   target is not part of this refactor. Note it for a separate
   `/emporix-dev --playbook bugfix` or `feature` ticket; do not plan it here.

Explore's quality gate also needs: every contract listed with its covering
tests or as a gap, and a target structure tied to the stated motivation.

### `draft` — adds to `emporix-feature` `references/draft.md` and `references/plan-shape.md`

Another repository involved → decide the model with `references/multi-repo.md`;
a multi-product ticket also follows its § Plan shape.

Header: replace the `**Source:**` line with these two:

```markdown
**Source:** emporix-dev
**Playbook:** refactor
```

Section rules:

- **Acceptance criteria.** Requirements only, one per contract from explore:
  `**Requirement** — {contract} is unchanged for the same input.` No
  Scenario: nothing new is observable. `plan-shape.md`'s "N/A — no behaviour
  change" does **not** apply; the Requirements are the boundary review
  checks against. For `emporix-feature`'s rule that a plan needs a seam, a
  Scenario, and a todo, these Requirements stand in for Scenarios.
- **Approach.** Before and after structure (a Mermaid diagram when it helps),
  the motivation, and the ordered steps. State plainly: `Any observable
  behaviour change is out of scope.`
- Add a section right after **Seams** (it goes to Jira with the plan):

  ```markdown
  ### Safety net

  | Requirement | Covered by (existing) | Gap to fill before moving code |
  |---|---|---|
  | 1 — {contract} | {test file(s)} | {none / what the new test asserts} |
  ```

- **Out of scope.** Always includes: behaviour changes; bug fixes found on
  the way (listed as follow-ups); public API, event, or schema changes;
  dependency upgrades; formatting outside touched files.
- **Project knowledge.** Behaviour rules do not change. Knowledge files that
  name moved modules, types, or paths go under **Update after
  implementation**; otherwise `none`.
- **Risks.** Contracts the safety net covers only partly; reflection,
  serialization, or configuration that reaches the moved code by name.
- **Todos.**

  ```markdown
  1. `safety-net` — Requirements 1–N: add or extend characterization tests for every gap in **Safety net**, and at least one test overall; run them and the full suite against the unchanged code — all green before any production edit.
  2. `step-{name}` — {one behaviour-preserving move}; full suite green after it.
  3. …
  N. `knowledge-update` — only when a knowledge file names moved code.
  ```

  The `safety-net` todo is mandatory, and it must add or extend at least one
  test even when coverage looks complete: `emporix-feature`
  `references/tests.md` does not accept a production-only diff. Each `step-…`
  todo keeps the code compiling and the suite green on its own.

In parent + prompt mode, the business description says there is no
user-visible change and states the engineering outcome (what becomes
possible or cheaper).

The draft's quality gate also fails when: a contract from explore has no
Requirement, **Safety net** is missing or names no test file, the first todo
is not `safety-net`, or any todo changes observable behaviour.

### `update` — `emporix-feature` `references/update.md`

Keep **Safety net**, the Requirements, and the `**Playbook:**` line. A new
contract adds a Requirement and a **Safety net** row together.
