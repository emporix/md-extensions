---
name: emporix-frontend-standards
description: >-
  Canonical Emporix frontend rules (React, TypeScript, Vitest, API layer, UI,
  i18n, PrimeReact, Module Federation), referenced from AGENTS.md and
  ai-setup.json (standards.frontend.rules) for React ui and fullstack
  repositories. Also the workflow for adding a missing endpoint method to
  @emporix/api-calls or a missing component to @emporix/component-library
  instead of building it locally — interview the user, implement with tests in
  a linked worktree of the library, offer to release right away, then move the
  consuming project onto the released version. Use when api-calls lacks an
  endpoint or the component library lacks a component (for example while
  migrating a module from the Management Dashboard).
---

# Emporix frontend standards

Canonical frontend engineering rules under `references/rules/`. `emporix-setup` records the active rule set in `ai-setup.json` (`standards.frontend.rules`) and adds this skill as a **Frontend rules** row in the Code style table of the `AGENTS.md` managed block.

Resolve `RULES_ROOT` to this skill's `references/rules` directory. The shared loader exports it:

```sh
. "${EMPORIX_SKILLS_ROOT:-.agents/skills}/emporix-setup/scripts/load-config.sh"
# RULES_ROOT=$SKILLS_ROOT/emporix-frontend-standards/references/rules, FRONTEND_RULES="core ui-components …"
```

Without a config (for example inside this collection) use `skills/emporix-frontend-standards/references/rules`.

Callers must read the exact rule files under `RULES_ROOT`; do not restate, summarize, or paraphrase them. Prefer the concrete file list in the `AGENTS.md` **Frontend rules** row when present.

## Which rules to read

Read only the rules listed in `standards.frontend.rules` in `ai-setup.json` (`FRONTEND_RULES` from the loader, or the matching paths in `AGENTS.md`). Always read `core`, plus every rule whose `paths` match a file the change touches. If the touched files are not known yet, read every listed rule.

## Rules

| Rule | Loads for | Requires |
|---|---|---|
| `core` | always | — |
| `ui-components` | `src/components/**`, `src/pages/**` | — |
| `emporix-component-library` | `src/**/*.tsx` | — |
| `testing` | `**/*.test.ts`, `**/*.test.tsx` | — |
| `api-data` | `src/api/**`, `**/*.api.ts` | — |
| `npm-dependencies` | `**/package.json`, `**/yarn.lock`, `**/package-lock.json` | — |
| `i18n` | `src/translations/**` | — |
| `primereact` | `src/**/*.tsx` | `primereact` |
| `module-federation` | `**/RemoteComponent.tsx`, `**/vite.config.ts`, `**/main.tsx` | `@originjs/vite-plugin-federation` |

## Before a pull request

When the repository has a `firebase.json` and `standards.frontend.rules` lists `module-federation`, run this check before you commit and push a branch that opens or updates a pull request. Run it on the first push and on later pushes, whichever workflow or tool does the pushing:

```sh
sh "$SKILLS_ROOT/emporix-frontend-standards/scripts/ensure-firebase-hosting.sh" --changed
```

| Result | Do |
|---|---|
| Exit `0` | Continue. |
| Exit `3`, `SITE … missing` | Ask the user once to create the listed sites. Yes → run again with `--create`. No → do not push; the PR preview deploy would fail. |
| Exit `3`, `SECRET … missing` or `UNMAPPED …` | Do not push. Name them to the user; a repository or organization admin sets secrets, and the agent never does. |
| Exit `2` | Do not push. Show the message (no `firebase` CLI, not logged in, or no access to the project). |

Background and the rest of the hosting rules: `module-federation` § Hosting and CI.

## Library contributions

When `@emporix/api-calls` lacks an endpoint method or `@emporix/component-library` lacks a component, follow `references/library/workflow.md` with `api-calls` or `component-library`. The `api-data` and `emporix-component-library` rules send you there. Read the workflow and its playbooks only when that happens — they are not rules and are not listed in `standards.frontend.rules`.

| File | Covers |
|---|---|
| `workflow.md` | Hard rules, arguments, steps 0–8 |
| `conventions.md` | How to learn the library's own conventions |
| `api-calls.md` | `@emporix/api-calls` playbook |
| `component-library.md` | `@emporix/component-library` playbook |
| `release.md` | PR, version bump, CI, tag, publish check |
| `consumer.md` | Moving the consuming project onto the released version |

The workflow uses helpers from `emporix-setup`, `emporix-feature`, and `emporix-worktree-cleanup`.

## Changing a rule

Edit the source file under `references/rules/` and open a PR to `emporix/emporix-ai-sdlc-skills`. Product repos pick up changes with `npx skills update -p`. After adding a rule, also update this table, the expected list in `scripts/rules.test.sh`, and, for an optional rule, the detection in `emporix-setup/references/frontend-rules.md`.
