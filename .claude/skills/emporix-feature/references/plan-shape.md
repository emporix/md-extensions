# Plan shape

One plan. Same sections in the `.ai/runs` file and the Jira comment. Specificity rules and the quality gate are in `references/draft.md`; this file is the body.

## Acceptance criteria

Required when behaviour changes. These are what implement must prove with tests, however the feature is built.

| Kind | Use for | Shape |
|---|---|---|
| **Scenario** | End-to-end behaviour (black box) | `WHEN` / `THEN` / optional `AND` |
| **Requirement** | A standing invariant that is not one path | One normative sentence |

```markdown
1. **Scenario** — short label
   - WHEN {observable precondition / actor action / request}
   - THEN {observable outcome}
   - AND {further observable outcome}
```

- **Black box** — what a client, operator, or external system can observe (HTTP status and body, event, UI state, a resource via the public API). Do not name internal classes, private methods, storage layout, or “call HelperX”.
- One Scenario = one path (happy path or one failure mode). Split nested conditionals.
- Failures are Scenarios (`WHEN` invalid input → `THEN` 4xx and the error shape).
- Prefer a Scenario when the rule can be exercised. Use a **Requirement** for a standing rule (limit, idempotency, ordering, “must not expose field X”, a compat window).

Unknown behaviour → **Open questions**. Do not invent Scenarios. No behaviour change (docs-only or equivalent) → omit Acceptance criteria and scenario todos, and say N/A.

## Todos

Every numbered **Scenario** and every testable **Requirement** appears in **Todos** with explicit coverage. Implement must be able to tick “this Scenario is done” without guessing.

Prefer **one todo per Scenario** when the path is independently implementable. **Bundle** only when several Scenarios are one inseparable seam change — that todo must list every Scenario number and label. Never leave a Scenario with no todo.

```markdown
## Todos

1. `foundation-soft-cap` — Add the soft-cap config and the shared validation seam.
2. `scenario-reject-oversize` — Scenario 1 (reject oversize): implement + black-box test — WHEN oversize THEN 413 AND no resource.
3. `scenario-accept-under-cap` — Scenario 2 (accept under cap): implement + black-box test — WHEN under cap THEN 2xx and an id.
4. `requirement-inline-only` — Requirement 3: soft cap applies to the inline path only.
```

- Outcome todos (“enforce the cap on the inline path”) rather than patch todos (“edit Reader at a line”).
- One todo ≈ one reviewable outcome or one seam.
- Prefer 3–8 foundation and seam todos. Scenario todos may go past 8. Do not merge Scenarios just to stay under 8.
- Foundation first, then the Scenario todos that need that seam.
- Each Scenario todo includes the product behaviour **and** the matching contract test. Do not add a vague “add tests” todo.
- `id` in backticks, kebab-case, prefer `scenario-…` / `requirement-…`.
- When **Project knowledge → Update after implementation** is not `none`, the last todo is `knowledge-update` — “Update {files} for {what changed}”. Knowledge edits are part of the change, not a follow-up.

## Business description

Parent + prompt only. Full body from `references/description.md`. **How we will know it is done** states the same outcomes as the Scenarios, in product language (no services, APIs, or paths). Omit the Description heading on an existing ticket.

## Plan file

`{KEY}` is the parent key until a child exists. `approve` flips **Status** and adds **Approved**.

```markdown
# Plan: {title}

**Status:** draft | approved
**Approved:** {ISO date — only when approved}
**Source:** emporix-feature
**Mode:** Parent + prompt | Existing ticket
**Parent:** {PARENT} — {one line — parent mode only}
**Ticket:** {KEY}
**Branch:** {TASK_BRANCH}

## Plan quality

- Seams: {names, or “greenfield”}
- Scenarios: {n} → todos {ids}
- Knowledge to update: {files, or none}
- Blocking questions: {none / listed below}

## Title

{outcome in plain language — child summary in parent + prompt mode}

## Description (business — this becomes the ticket body)

{full description.md body — omit this heading for an existing ticket}

## Approved plan

**Parent:** {PARENT} — {one line}
**Ticket:** {KEY}

### Overview

{1–3 sentences: problem and intended approach. Name open questions here too.}

### Context

{What analysis confirmed. Point at seams with repo-relative paths — not line numbers. Existing ticket: what the ticket already says, and the gap this plan fills. Mockups: path or “none yet”. Greenfield: say so.}

### Approach

{Decisions and contracts. Alternatives only when they change todos. Leave room where analysis did not lock a choice.}

### Acceptance criteria

{Scenarios and Requirements, or “N/A — no behaviour change”.}

### Seams

{Modules that own the change, and what must stay stable. Out of scope lives in the next section.}

### Out of scope

- {explicit non-goals}

### Project knowledge

- Read: {`ai-project-knowledge/…` files analysis used, or “none — not yet scanned for this area”}
- Update after implementation: {`ai-project-knowledge/…` — what will change in it (rule, state, field, endpoint, event, route, flow); one line per file. `none` when no behaviour, data, contract, UI, or integration changes.}
- Stale now: {a knowledge statement the code already contradicts, with the path that shows it — or omit}

### Todos

{list above}

### Risks

- {what can break, tied to a seam — omit the section when nothing concrete follows}

### Open questions

- Blocking: {specific ask, or “none”}
- Not blocking: {or omit}

### Accepted deviations

{Not written by draft. `emporix-pr apply` appends one bullet here each time the user accepts a reviewer-requested change that goes beyond this plan: date, PR, file, what changed, who asked. Readers treat these as planned. Omit the heading until the first bullet.}

## After you approve

Include only the active mode.

Parent + prompt:

1. Create one child under {PARENT} with the title and description above.
2. Comment this Approved plan on that child. Register the child. Do not comment on the parent.

Existing ticket:

1. Comment this Approved plan on {KEY}.
2. Register {KEY} unless it is already a workspace feature.

Nothing is written to Jira until you approve. Approval starts implementation on a ticket branch, then the self-review, then asks before opening a PR.
```

**Status**, **Plan quality**, **Title**, **Description**, and **After you approve** are review metadata. The Jira comment is only **Approved plan** (from that heading through **Open questions**, plus **Accepted deviations** when it exists).
