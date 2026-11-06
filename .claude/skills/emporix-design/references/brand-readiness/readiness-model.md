# Readiness model

The `brand-readiness` action is scaffolding. Every check exists only until
the target enforces the same guarantee itself; then the check graduates, and
when a channel has no checks left, its config under `channels/` is deleted.
When no channel is left, the action is deleted: `scripts/brand-readiness/`,
`references/brand-readiness/`, `references/playbooks/brand-readiness.md`, and
its rows in `SKILL.md` and `references/dispatch.md`. `brand-create` and
`brand-apply` stay.

## Criteria

**L** locally scoped (a design change touches only theme files) ·
**G** goal-oriented (no behaviour side effects) · **R** reviewable (one
cohesive change) · **U** upgrade-friendly (re-applicable to a newer version
without regeneration).

## Checks

| Id | Question | Criteria | Storefront probe |
|---|---|---|---|
| R1 | Can every canonical brand role be expressed by the theme alone? | L | not scripted: profile `gaps[]` in brand-apply |
| R2 | Do all themed classes resolve to defined tokens; no hard-coded or runtime-built colour classes? | L G | `scripts/checks/r2-token-integrity.mjs` |
| R3 | Are tokens named by role, with a text colour for every surface? | L U | not scripted |
| R4 | Do the text-on-surface pairs the code uses pass WCAG in the default theme? | G | `scripts/checks/r4-contrast.mjs` |
| R5 | Does a fixed set of test brands render with no regressions? | L G | partial: `check.mjs --site-themes` (static), brand-apply preview (runtime) |
| R6 | Does a theme change stay local: no global surfaces, no third-party requests? | L R | not scripted |
| R7 | Do tests pin the default look? | R U | not scripted: profile `knownConflicts` |
| R8–R10 | Propagation, containment, generated-UI conformance | — | other channels (later) |

Add a check only when it can be a script; judgement stays in the SKILL.md.

## States

| State | Meaning | Agent does |
|---|---|---|
| `open` | violations found | report them (ticket, e.g. COP-7095) |
| `fixed` | none found, target has no guard | keep re-checking; propose the guard |
| `graduated` | none found, and `checks.<id>.guard` exists in the target (package.json script or file) | only confirm the guard exists; propose removing the check |

Site-theme runs are `evidence` (brand range), never a state.

## Maturity per channel

| Level | Meaning |
|---|---|
| M0 | not themable |
| M1 | colour, fonts and radius come from one theme file |
| M2 | R1–R4 fixed: every role expressible, tokens sound, default accessible |
| M3 | R5 fixed: any brand archetype works |
| M4 | every check graduated → delete `channels/{channel}/` |

## Graduation targets

| Channel | Where guards live |
|---|---|
| storefront | the target repo's CI (e.g. a token lint for R2, a default-theme contrast test for R4) |
| md-host, md-extension, md-generated | later: MD repos, md-module-template, AI Experience Builder |

A graduated guard may be this skill's script copied into the target, or the
target's own equivalent; the target owns it either way.
