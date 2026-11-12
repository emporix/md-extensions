# Project knowledge: `PROJECT.md` and `ai-project-knowledge/`

Long-term memory of **this repository**: what it does for the business, how
its data is shaped, what it exposes, what it calls, and how its main flows
work. Written once by setup, refreshed with `--rescan`, maintained by later
skills when they change behaviour. Committed, so the whole team shares one
memory.

It deliberately excludes environment-level knowledge — which other services
call this one, where it is deployed, platform-wide conventions. That comes from
Buddy `get_service_context` at task time. `PROJECT.md` links to it.

## Progressive disclosure

`PROJECT.md` is a short index. Each knowledge file covers one concern and is
self-contained. Agents read `PROJECT.md`, pick the one or two files the task
needs, and stop. Target sizes: `PROJECT.md` ≤ 80 lines; each knowledge file
≤ 300 lines. When a module file would exceed that, split by sub-area and
list both in the index.

## File set

| File | When | Holds |
|---|---|---|
| `PROJECT.md` | always | Purpose, users, one line per knowledge file with scan date, pointer to Buddy for platform context |
| `ai-project-knowledge/domain.md` | always | Core business concepts, vocabulary, invariants, rules, state machines, calculations |
| `ai-project-knowledge/data-model.md` | when persistence exists | Entities/documents/tables, key fields, relations, lifecycle, migrations, tenancy/multi-site handling |
| `ai-project-knowledge/api.md` | backend / fullstack | Exposed endpoints or events grouped by resource, auth scheme, pagination/filters, error model, versioning, contract source path |
| `ai-project-knowledge/ui.md` | ui / fullstack | Routes/pages and what each lets the user do, state management, backend endpoints called, permission checks, feature flags, form validation rules |
| `ai-project-knowledge/integrations.md` | when found | Outbound calls (other Emporix services, third parties), queues/topics consumed and produced, webhooks, scheduled jobs |
| `ai-project-knowledge/modules/<name>.md` | one per significant module | Responsibility, main flows step by step, key classes/files, rules specific to the module, tests that pin the behaviour |

Each file starts with:

```markdown
# <Title>

Last scanned: <short commit sha> (<YYYY-MM-DD>)
Sources: `path`, `path`, …   (the files this content was derived from)
```

and may contain hand-written sections wrapped in `<!-- keep -->` … `<!-- /keep -->`
that a rescan preserves verbatim.

## What to extract

Business logic, not implementation trivia. For every item: what it is, the
rule, where it lives (path), and the test that pins it when one exists.

- **Concepts and vocabulary** — nouns the code and docs use (cart, order, price list, tenant, site). Define each in one line.
- **Rules and invariants** — validations, preconditions, calculations (totals, taxes, discounts), limits, defaults, idempotency, uniqueness. Quote the condition, not the code.
- **State** — statuses and allowed transitions; who or what triggers them.
- **Data shapes** — entities with the fields that carry business meaning (skip audit/boilerplate), relations, soft delete, versioning, multi-tenancy keys.
- **API surface** — resources, operations, auth, scopes/permissions, pagination, filtering, error model. Prefer the contract file (OpenAPI) as source; reconcile with controllers only where they disagree.
- **Flows** — the 3–10 flows that matter (create order, publish product, checkout, import). Steps, actors, side effects (events emitted, external calls), failure handling.
- **UI behaviour** — what each route lets a user do, which API it uses, which rules are enforced client-side.
- **Integrations** — external systems, direction, protocol, topics/queues, retry/compensation behaviour.
- **Configuration that changes behaviour** — feature flags, tenant settings, env-driven switches (names only, never values).

## Evidence order (per module)

1. Contract files: OpenAPI/AsyncAPI/GraphQL/protobuf.
2. Domain/model files: entities, documents, schemas, migrations, DTOs with validation annotations.
3. Service/use-case layer: services, handlers, command/query handlers, state machines, validators, calculators.
4. Entry points: controllers/resolvers/consumers (backend); routes/pages/stores/API clients (frontend).
5. Tests: names and assertions are the most reliable statement of intended behaviour. Read test names broadly, bodies selectively.
6. Existing docs: README, `docs/`, ADRs, mapped `api-references` and portal pages when open in the workspace.

Skip: generated code, vendored dependencies, build output, snapshots, lockfiles,
`.env*`, credentials, large fixtures, i18n message bundles (read keys only if
needed), styling.

## Budget and splitting

- Decide modules from the **Layout** detected in `detect.md` (packages, bounded contexts, top-level feature folders). Three to twelve modules is typical; merge tiny ones, split one that holds most of the code.
- One sub-scan per module. Use a Task subagent per module when the harness offers it; otherwise scan sequentially. Each sub-scan receives: module path(s), the file set and evidence order above, the output path, and the header format. It returns the file content only.
- Per sub-scan budget: up to ~150 files or ~400 KB of source, following the evidence order. When the budget runs out, write what was found, list the unread areas under `## Not yet scanned`, and let `--rescan <module>` finish later.
- Very large repos: default mode still scans; `--no-scan` lets the user defer and run `--rescan <module>` per area.

## Rescan

- `--rescan` (no argument): rewrite every file whose `Last scanned` is older than `HEAD` and whose sources changed (`git diff --name-only <sha>..HEAD -- <sources>`). Unchanged files are left alone. Show a diff per rewritten file.
- `--rescan <module>`: rewrite only `modules/<module>.md` (or a top-level file by name: `domain`, `data-model`, `api`, `ui`, `integrations`).
- Preserve `<!-- keep -->` blocks. Re-read the previous version first so stable, correct content is kept rather than re-derived differently.
- Then refresh the scan dates in `PROJECT.md`.

## `PROJECT.md` template

```markdown
# <Product / service name>

<Two or three sentences: what it does, for whom, its main responsibility. Source: README or `unknown`.>

Platform context (callers, deployment, cross-service conventions): ask Emporix
AI Buddy `get_service_context` with `service: "<name>"`. This repository's own
knowledge is below; open only what the task needs.

## Knowledge files

| File | What it answers | Last scanned |
|---|---|---|
| `ai-project-knowledge/domain.md` | Concepts, rules, states, calculations | `abc1234` 2026-10-27 |
| `ai-project-knowledge/data-model.md` | Entities, relations, migrations | … |
| `ai-project-knowledge/api.md` | Endpoints, auth, errors, contract source | … |
| `ai-project-knowledge/ui.md` | Routes, state, backend calls, client-side rules | … |
| `ai-project-knowledge/integrations.md` | Outbound calls, events, jobs | … |
| `ai-project-knowledge/modules/<name>.md` | <one line> | … |

## Not yet scanned

- <area> — <why: budget / excluded / `--no-scan`>; run `/emporix-setup --rescan <module>`

## Maintenance

Update the matching file in the same PR when a change alters business rules,
data model, API, UI behaviour, or integrations. Refresh everything with
`/emporix-setup --rescan`.
```

## Quality bar

- Every bullet is traceable to a path in `Sources`. A reviewer could open the path and find the rule.
- Prefer “`unknown` — not found in <where looked>” over a plausible guess.
- No code pasted beyond a one-line condition or an enum of states.
- No secrets, no tenant identifiers, no personal data from fixtures.
- Content describes behaviour and intent; it does not duplicate `AGENTS.md` (commands, style, tests layout).
