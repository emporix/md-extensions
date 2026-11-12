---
name: how
description: Use for "how does X work", code walkthroughs before changing something, and placement / ownership / layering questions ("where should this live", "which package owns this", "is this the right layer"). Explains subsystem architecture, runtime flow, onboarding mental models. Not for motivation or history (why it was built this way).
---

# how

Explain how code works, grounded in the actual source. Read-only: do not edit code unless the user asks.

## Scope

- **How it works**: subsystem architecture, runtime flow, data flow, mental model for onboarding.
- **Walkthrough before change**: what the user must understand before touching an area — call sites, invariants, blast radius.
- **Placement / ownership / layering**: where new code should live, which module owns a concern, whether something sits in the right layer.

Out of scope: *why* it was built this way (history, motivation, trade-offs behind past decisions) — hand off to a `why` skill when one is installed; otherwise say it is out of scope here and point at the commit history and PR discussion for that code.

## Workflow

1. **Pin the question.** Restate the subject in one line (entry point, feature, or concept). If it is ambiguous across repos or modules, ask once; otherwise pick the most likely reading and say so.
2. **Find the entry points.** Controllers/handlers, listeners, schedulers, CLI commands, public interfaces, config wiring. Prefer search over guessing names.
3. **Trace the real path.** Follow calls end to end through the code, including config, DI wiring, and async boundaries (queues, events, callbacks). Read the code; do not infer behaviour from names.
4. **Check for conventions.** For placement questions, find 2–3 analogous existing features and note where their pieces live (packages, layers, naming). The repo's existing pattern beats general best practice.
5. **Answer** using the format below.

For large subsystems, use an `explore` subagent for breadth, then read the key files yourself before answering.

## Answer format

Lead with the answer, then support it. Drop sections that do not apply.

1. **TL;DR** — two or three sentences answering the question directly.
2. **Mental model** — the components and their responsibilities, in plain words. Add a small Mermaid diagram only when the flow has more than ~4 hops or branches.
3. **Runtime flow** — numbered steps from trigger to effect, each with a code citation (`startLine:endLine:path`). Call out async hops, transactions, caching, and error paths.
4. **Key types and ownership** — which module/package owns which data or decision.
5. **Gotchas** — invariants, side effects, hidden coupling, things that break if changed.

### Placement / layering answers

1. **Recommendation** — the exact package/module/file, stated first.
2. **Evidence** — analogous existing code that lives there, with citations.
3. **Layer rule** — what that layer may and may not depend on, as observed in the repo.
4. **Rejected alternatives** — one line each on why not.

If the current placement looks wrong, say so plainly and show the conflicting convention.

## Rules

- Every behavioural claim points at code. If something cannot be verified (runtime config, external service), mark it as an assumption.
- Name things by their real identifiers, not invented labels.
- Do not pad with generic framework explanations the user already knows; explain only what is specific to this codebase.
- If the user's question is really about motivation ("why is it like this"), answer the mechanical part briefly and hand off as in § Scope (`why` when installed, else say it is out of scope).
