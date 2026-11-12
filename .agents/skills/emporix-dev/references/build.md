# Build overlay — `implement` and `review` against the design sketch

`emporix-feature` `references/implement.md` runs **as written**, with
`--worktree` when the ticket checkout is a worktree: approved plan and
ready gate, mockups, ticket and existing PR, the ticket checkout, the existing suite and
`validation.commands`, project knowledge, the report, then review. This
file replaces only the order in which implement
**applies the plan** (its todos), and adds the sketch to review's
boundary.

Nothing here commits. Implement still ends with an uncommitted tree; the
one commit is made by `emporix-feature` `pr`, as the token owner.

Every edit happens in the ticket checkout under its edit gate
(`references/worktrees.md`).

```text
build progress (where implement applies the plan):
- [ ] B0. load the sketch; playbook first-tests on unchanged code
- [ ] B1. cleanup (only when the sketch subtracts)
- [ ] B2. scaffold — sketched shapes, stub bodies, compiles
- [ ] B3. pin — new Scenario tests, all red on the stubs
- [ ] B4. bodies — no stub left, pinning tests green
- [ ] → implement's test run, knowledge, report … review
```

## B0. Load the sketch and run the first tests

- `### Design sketch` in the plan → the contract for B1–B4. `Skipped: {reason}` → apply the plan as `emporix-feature` implement writes it, still with the playbook rules; skip B1–B4 and § Deviations.
- No `### Design sketch` and the playbook does not skip architect → stop; run `references/architect.md` first. A plan that came only from Buddy has none: same.
- A sketch marked `stale` or `Discarded` → stop; re-run architect for it.
- Multi-product: only the slice's todos, in this repo (`references/multi-repo.md`).

**Tests first.** When the playbook's implement step names tests that run
on the **unchanged** code (Bugfix: the regression test must fail; Refactor:
the safety net must be green), run them now, before any product edit, and
hold the result the playbook asks for. No such tests → `tests-first –`.

Record progress in the plan file after every phase, on the todos and in a
line under **Todos**: `Build: tests-first ✓ · cleanup – · scaffold ✓ · pin ✓ · bodies …`.
A resumed conversation continues from that line.

## Who writes the code

The parent may write each phase itself, or delegate it to **one coder
subagent per phase** (`--coder-model <slug>`, else the host default). A
delegated phase prompt is self-contained: absolute tree path, `{KEY}`, plan
path, the phase name and only its step below, the pending todo ids, the
chosen sketches **verbatim**, `AGENTS.md` style authorities, and the compile
/ test command. The coder: no commit, no `git checkout` / `reset` / `stash`,
no plan edits, no files outside the tree, stop at any deviation and return
`before → after` with evidence. The parent verifies every returned diff
against the sketch; an unreported deviation is still a deviation.

When a coder subagent wrote the code, `review` uses a reviewer that is
**not the coder's model** as well as not this conversation's (pass
`--review-model` when the default would collide). Prefer another family;
on a single-family host, another model of that family; when only one model
is left, `inherit`, recorded in the ledger as `emporix-feature` review does.

## B1. Cleanup (optional)

Only when the sketch removes something: dead code, types the new shape
replaces, callers that move. One pass. No drive-by refactors. Nothing to
remove → skip (`cleanup –`).

## B2. Scaffold

Write every sketched type, class shape, and function signature with
**not-implemented** bodies and the pseudocode as comments. Compile /
typecheck green. No logic.

When the playbook says **unwired** (Refactor), nothing calls a stub yet, so
the suite stays green. Code moves into the shapes in B4.

## B3. Pin

Write the black-box tests for every Scenario and Requirement the pending
todos cover, plus the edge cases the sketch's **Scenario mapping** names,
against the sketched entry points (`emporix-feature` `references/tests.md`
for layer and naming). Do not couple to private helpers or call order
unless that is the contract. When the sketch's **Flow** says what a repeat
does, pin it: run the operation twice, or deliver the event twice, and
assert the same end state. When it says what a run after a crash does, pin
that too, once per recovery point it names: leave the state a crash there
would leave (for example, the database write done and the outbox entry not
yet sent, or the step failed by an injected error after its first write),
run again, and assert the same end state (`make-operations-idempotent.md`).

**Fail-first gate:** run the new tests. Stubs are empty, so **every new
test must fail**. A new test that passes is not exercising the new contract:
fix the test, re-run. Do not start B4 while one passes.

Not part of this gate: the tests-first tests (B0 decided them on unchanged
code) and tests from before this change. No new Scenario to pin →
`pin –`.

## B4. Bodies

Replace every stub with code and every pseudocode step with logic, todo by
todo in plan order, inside **Seams** and **Approach** (`emporix-feature`
`implement.md` § Scope and § Style still apply). A playbook's step todos
(Refactor `step-…`) each keep the full suite green on their own.

Let the types do the checking (`type-system-discipline.md`): match closed
sets exhaustively, with no `default` branch that absorbs new cases, and
never reach green through a cast, `any`, a suppressed warning, or a widened
type. A body that needs one is a deviation (§ Deviations).

Done when no stub, `not implemented`, or pseudocode comment is left in the
diff and the pinning tests are green. Then implement continues as written: the full suite and `validation.commands`, project knowledge, the report, review.

## Deviations — the sketch is the contract

A deviation is any change to the sketched public shape: Cross-repo
ownership, a boundary contract or hop; an in-repo module boundary, type,
class shape, or signature (an extra, removed, or retyped parameter; a
changed return or error; a new public member; a dependency pointing the
wrong way). Private helpers, local variables, and private splits are not
deviations — note them, do not stop.

Never work around one quietly (stuffing data into an existing parameter, a
hidden global, a side lookup, widening a type). On a deviation, **stop
before writing past it** and show:

1. **Sketch said** vs **code needs** — the exact shape before → after.
2. **Diagnosis**, with evidence — one of:
   - **Sketch wrong** — the design missed something the code and plan already imply → re-run architect for that slice (§ Reground); redo its code against the new sketch.
   - **Requirement missed** — the need comes from a contract the plan never stated → `/emporix-dev update {KEY}` (and re-approve) first, then reground.
   - **Overreaching** — the need comes from doing more than the todo asks → drop the extra; conform to the sketch.
3. **Recommendation** and the ripple (callers, tests, later todos, other repos).

Ask which diagnosis holds; act on the answer. Silence is not an answer, also
in `auto`. Record each resolved deviation under `#### Deviations` in the
sketch: date, slice, before → after, diagnosis, the user's answer.

### Throw the sketch out

Keep a friction log per sketch (the deviations above). When the log shows the
design itself is wrong, stop patching it and start over, on any of:

- a second **sketch wrong** on the same sketch;
- one correction that changes two or more sketched signatures or types, a module boundary, or a Cross-repo ownership or contract;
- a correction that brings back a rejected shape;
- fixes that start compensating for each other (an adapter, flag, or special case that exists only to keep the sketch standing).

Then:

1. Stop and announce it with the friction log.
2. Mark the sketch `Discarded: {ISO date} — {reason}`; it stays only as a rejected shape. Remove the code written against it with targeted edits to that slice's files — never `git checkout` / `reset` over files other slices share. Keep the Scenario tests' assertions; retarget them later. A discarded Cross-repo sketch makes every dependent todo sketch `stale`.
3. Redesign from scratch through `references/architect.md` § Reground, with the friction log as evidence and the discarded fingerprint as rejected. Then B2–B4 again for that slice.
4. The same slice thrown out twice → ask once whether the plan needs `update` before a third design.

## Review — the sketch joins the boundary

Run `emporix-feature` `references/review.md` as written. Its scoped plan
already contains `### Design sketch`; classify findings with these extra
rules:

- **In-plan defects** (fixed by the loop): a silent deviation from the sketch (public shape differs and no `#### Deviations` entry covers it); a leftover stub, `not implemented`, `TODO`, or pseudocode body; code left from a `Discarded` sketch; a Scenario from the sketch's **Scenario mapping** with no test.
- **Planned**: shapes recorded under `#### Deviations` with the user's answer, like **Accepted deviations**.
- **Beyond-plan** (the loop stops): a fix that would need a new public shape the sketch does not have — that is a deviation; surface it with § Deviations instead of fixing.

The ledger, cycle cap, visibility lines, Verdict, Jira evidence, and the PR
question are `emporix-feature`'s, unchanged. Add one line to the review
report: `sketch: matches | deviations: {n} (each: diagnosis) | thrown out: {n}`.

## Rules

- B0 before B1, B2 before B3, B3's fail-first gate before B4. No body before the skeleton compiles.
- No commit, push, or PR in any phase. No `git stash`, `reset`, or `checkout` over shared files.
- Stay inside the plan; the sketch narrows how, never widens what.
