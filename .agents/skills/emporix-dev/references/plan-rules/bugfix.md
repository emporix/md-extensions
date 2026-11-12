# Bugfix plan rules

What the **Bugfix** playbook (`references/playbooks/bugfix.md`) steps 1–2, and
`update`, add to `emporix-feature`'s explore, draft, and update. Each runs the
`emporix-feature` file **as written** (plan mode, key rules, plan location,
quality gate, hard stop) plus these rules. Read this file only in those
steps; it never goes into the todo list.

## `explore` — adds to `emporix-feature` `references/explore.md`

Work through these in order. Ask the user only what the code, the ticket,
and the logs cannot answer.

1. **Symptom.** Observed vs expected, in black-box terms: request and
   response, event, UI state. Where (environment, tenant, endpoint or
   screen), since when, how often, for which input. A symptom you cannot
   state as observed vs expected is the first question.
2. **Evidence.** The ticket, its attachments, and what the user pastes.
   When the defect shows in a deployed environment and no log is attached,
   offer `/emporix-logs-check` once; do not query logs unasked.
3. **Reproduction.** The shortest path that shows the defect: an existing
   test to extend, a request against the local service, or a UI path. Plan
   mode cannot run code; derive the path from the code and the evidence. The
   run that proves it is the first implement todo.
4. **Root cause.** Trace from the symptom to the code whose assumption
   breaks. Name the seam (module, type, function) in a file you opened, and
   say why it produces the symptom. Keep the root cause and the place the
   symptom shows apart; the fix goes to the cause. Two plausible causes →
   a blocking question, with what would tell them apart.
5. **Blast radius.** Other callers and paths that share the faulty code;
   data already written wrong; clients that may rely on the wrong behaviour.
   Data repair or a contract change that clients will notice → ask whether
   it belongs in this ticket.
6. **Not a bug?** When the code matches `ai-project-knowledge/`, the API
   reference, or the ticket's own acceptance criteria, say so with the
   source. Suggest `/emporix-dev --playbook feature` for the change the user
   actually wants. Do not draft a bugfix plan for intended behaviour.

Explore's quality gate also needs: a concrete reproduction path, and a root
cause tied to a seam (or a blocking question).

## `draft` — adds to `emporix-feature` `references/draft.md` and `references/plan-shape.md`

Another repository involved → decide the model with `references/multi-repo.md`;
a multi-product ticket also follows its § Plan shape.

Header: replace the `**Source:**` line with these two:

```markdown
**Source:** emporix-dev
**Playbook:** bugfix
```

Inside **Approved plan**, add two sections right after **Context** (they go
to Jira with the plan):

```markdown
### Reproduction

- Observed: {black-box symptom}
- Expected: {black-box correct behaviour, with its source — knowledge file, API reference, ticket}
- Steps: {shortest path: request, input, UI path, or the existing test to extend}
- Environment: {where it was seen; local reproduction path}

### Root cause

{The seam and the broken assumption, in 2–5 sentences. Why the symptom follows from it. Where the symptom shows, if that is somewhere else.}
```

Section rules:

- **Acceptance criteria.** Scenario 1 is the regression:
  `WHEN {reproduction} THEN {expected}`. Add a Scenario for each blast-radius
  path the fix also corrects. Add a Requirement for nearby behaviour that
  must not change when a reviewer could reasonably worry about it.
- **Approach.** The smallest change at the root cause, and one sentence on
  why not at the symptom.
- **Out of scope.** Always includes: `Refactoring beyond the fix — a separate
  refactor ticket` and, unless the user put it in, `Repairing data already
  written wrong`.
- **Risks.** Clients or jobs that may depend on the wrong behaviour.
- **Project knowledge.** A knowledge statement that describes the buggy
  behaviour as intended goes under **Stale now**, and its file under
  **Update after implementation**.
- **Todos.** The first Scenario todo is the regression, test first:

  ```markdown
  1. `scenario-regression` — Scenario 1 (regression): first write the black-box test and run it against the unchanged code; it must fail with the reported symptom (quote the failing assertion in the implement report). If it passes, stop with `Ready: no` — the root cause in this plan is wrong; run `/emporix-dev update {KEY}`. Then fix at the root-cause seam and run it green.
  ```

  Then one todo per further Scenario, then `knowledge-update` when needed.

In parent + prompt mode, the business description's **How we will know it
is done** states the corrected behaviour in product language.

The draft's quality gate also fails when: **Reproduction** has no observed
vs expected, **Root cause** names no seam, Scenario 1 is not the
regression, or the first todo does not run the failing test before the fix.

## `update` — `emporix-feature` `references/update.md`

Keep **Reproduction**, **Root cause**, and the `**Playbook:**` line. A new
root cause rewrites Scenario 1 and the regression todo together.
