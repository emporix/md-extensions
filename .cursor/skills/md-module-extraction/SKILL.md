---
name: md-module-extraction
description: >-
  Extract a Management Dashboard module into an md-extensions federated remote.
  Use when the user mentions "extract MD module", "migrate module to md-extensions",
  "federated module", COP-5597 epic work, or external-module feature toggles.
---

# MD Module Extraction

> **Canonical location:** `md-extensions/.cursor/skills/md-module-extraction/` (mirror to `.claude/skills/` and `.github/skills/`; also synced in frontend-ai-rules).  
> **Host wiring rules:** `management-dashboard/.cursor/rules/federated-module-wiring.mdc`  
> **Remote rules:** `md-extensions/.cursor/rules/md-extension-migration.mdc`, `md-extension-port-validation.mdc`  
> **Hooks:** `md-extensions/.cursor/hooks.json`

Step-by-step workflow for porting an MD module to `md-extensions`.

**Detail docs** (do not restate here — link instead):

| Doc | SoT for |
|-----|---------|
| `docs/MODULE_MIGRATION_PLAYBOOK.md` | Policy, federation contract, AppState matrix, provider stack, QA, Firebase, decisions log |
| `docs/REUSABLE_FROM_USERS_AND_GROUPS.md` | Tier 1/2/3 copy inventory (what to take, adapt, skip) |
| `docs/MIGRATED_MODULES.md` | Registry of extracted remotes (update after every migration) |
| [reference.md](reference.md) | FAQ, validation greps, anti-patterns, local dev loop |

**Canonical scaffold:** clone [md-module-template](https://github.com/emporix/md-module-template) branch **`md-module-migration`**, absorb into `md-extensions/{kebab}/` (remove nested `.git`). Align Tier 1 with **all playbook-aligned remotes** in `MIGRATED_MODULES.md` (not U&G alone; not `products`; not template `master`).

**Pilots so far:** see `MIGRATED_MODULES.md`.

## Pre-flight

0. **Settle the Jira key before the first commit.** **Ask the user whether a ticket already exists** for this module. If it does, ask for the **number or URL** and use that. Only create one — as a child of the COP-5597 epic — if they confirm there is none, and confirm the summary with them first. **Never invent or assume a key**, and do not silently fall back to the epic. The key goes in the branch name *and* every commit, so getting it late means rewriting history.

   Then read **`git-workflow`**: branches are `feature/{KEY}-###-kebab-description`, commits are `{KEY}-### Sentence case description` (≤ ~72 chars), and branches are **squashed** before merging to `master`.
1. Confirm scope: which routes **move** vs **stay** in MD; list **sibling consumers** that import the module folder.
2. List MD files those consumers still need — cleanup must retain them (and re-home any shared i18n keys).
3. Pick federation `name` = MD route `key` (camelCase).
4. Pick a **unique local Vite port** (claim from `MIGRATED_MODULES.md` "Next free local port").
5. Run audit greps (playbook §7 + below).
6. Verify CL exports every PrimeReact / MdDataTable replacement; prefer **CL ≥ 2.2.0** for `ConfirmBox` / `BackButton` / `DateValue`, **CL ≥ 2.3.0** for `SectionBox`, **CL ≥ 2.4.0** for `Editor` / `FileUpload` / `ProgressBar`.
7. Align `@emporix/api-calls` semver with call signatures used by the module.
8. Decide Mode A (permanent `url:`) vs Mode B (GateComponent + toggle). Prefer Mode A when there is no useful built-in fallback.
9. **Feature-parity audit** and **CL widget-gap check** (below) — both belong *before* Phase 2, not before Phase 5.

### Feature-parity audit

Read the MD module's JSX end to end and list every **capability**, not just components. A file-by-file port can look complete while a user-visible feature silently disappears:

| Look for | Why it gets missed |
|----------|--------------------|
| `TableExtensions` | Column visibility persisted under a config key (e.g. `ext_brands`). No playbook-aligned remote had it, so "matches customer-groups" ≠ parity. Needs the `ConfigurationProvider` table-config surface — copy from `brands`. |
| Links to **host-owned routes** | e.g. media tiles opening `/media-assets/:id`. That route lives in MD, outside the remote's HashRouter, and AppState carries no navigation callback. Decide with the user: drop the link, or `window.location.assign` with a comment. |
| Rich text / file upload / progress | Needs CL ≥ 2.4.0 — see the widget-gap check. |
| Exact icon glyphs | MD uses primeicons classes (`pi pi-trash`). Swapping to react-icons silently changes the glyph (filled vs outline trash, etc.). The primeicons **font ships inside `@emporix/component-library/styles`**, so `pi pi-*` is usable without a primeicons dependency when exact parity matters. |
| Fixed pixel sizing | MD sizes controls in px (34px is the house control height). Porting to `rem` makes them drift with root font size. |

### CL widget-gap check

If the module needs a PrimeReact widget CL does not export, **do not add `primereact` to the remote** and do not silently descope. Promote it to CL as Pattern B (skill `migrate-to-component-library`), release, then pin. CL already bundles `primereact`, so this costs consumers nothing.

Known gaps: **no `Sidebar`, no `InputSwitch`, and `Checkbox` has no `label` prop.** `brands` worked around the first two using CL `Dialog` + `Checkbox` for `TableExtensions` — acceptable when function and persisted shape are preserved, but confirm the presentation change with the user.

```bash
# Cross-module imports
rg "from ['\"].*modules/(?!{ThisModule})" management-dashboard/src/modules/{module}/

# PrimeReact / MdDataTable inventory
rg "from ['\"]primereact|MdDataTable|ProductDataProvider|InputField" management-dashboard/src/modules/{module}/

# Sibling / i18n consumers before cleanup
rg "from ['\"].*{module}|usersAndGroups\." management-dashboard/src --glob '!*.md'
```

## Phase 0 — Scaffold

Clone template into `md-extensions/`, absorb, rename federation `name` + ports + package. Details: playbook §1 "Scaffold starter".

Key checks: `strictPort: true`, `"dev": "vite --mode dev"`, `VITE_API_URL` (not `BASE_URL`), published CL semver, no nested `.git`.

**Scaffold parity check** — `diff -rq` vs playbook-aligned remotes; reconcile unexpected deltas before domain work.

**Template gotchas** (the template lags the aligned remotes — fix these in Phase 0 or they surface later as confusing failures):

- `tsconfig.app.json` is missing `"exclude": ["src/**/*.test.ts", "src/**/*.test.tsx"]`, so copied helper tests break `typecheck`.
- `.gitignore` is missing the `.env` / `!.env.example` rules the aligned remotes use — the bare `.env` gets committed otherwise.
- **CORS — pick one scheme, deliberately.** The template gates builds on `scripts/ensure-cors-origin.mjs` + a single `VITE_DASHBOARD_ORIGIN` per env; the aligned remotes instead hardcode a multi-origin `corsOrigins` array in `vite.config.ts` and have no such script. These are mutually exclusive, and following "align with the aligned remote" and "verify the script" literally at the same time is impossible.
  - **Keeping the script** (what `brands` did): every `VITE_DASHBOARD_ORIGIN` in `.env.dev|stage|prod` must already be in `corsOrigins`, or CI fails — it prompts on a TTY and **exits 1 headless**. Verify with `node scripts/ensure-cors-origin.mjs --mode <m> < /dev/null` for all three modes. Also fix `.env.stage`, which ships the prod origin (`https://admin.emporix.io`).
  - **Dropping it** (what `customer-groups` does): delete the script, remove it from the `build:*` scripts, and keep the hardcoded multi-origin array.
- Delete the placeholder trio (`context/ExtensionContext.tsx`, `pages/List.tsx`, `pages/Detail.tsx`) plus `models/Product.model.ts` and `helpers/localized.helpers.ts` when the real provider stack and pages land — they reference the 3-field template AppState and will keep `typecheck` red.
- Drop unused template deps (`chart.js`, `quill`) unless the module actually needs them.
- `scripts/customize-ai-rules-index.mjs` hardcodes the template's own domain in the generated directory map — `Domain types (AppState, Product, ApiError)`. Replace `Product` with your module's model. **This defect has already propagated into shipped remotes** (`customer-groups` still carries it), so do not treat a sibling remote's copy as clean.
- The template `README.md` still documents `primereact` / `primeflex` as direct dependencies to remove — flatly contradicting "never add primereact to a remote". Rewrite the README from an aligned remote's rather than patching sentence by sentence.

### `@emporix/api-calls` exports functions, not model types

Its public entrypoint re-exports the **call functions** (`postFileAsset`, `getAssetsForId`, `fetchBasicConfiguration`, …) but **none of the model interfaces** — `Asset`, `MediaRefIdType`, `MediaAccess`, `RefId`, `Configuration`, `ColumnVisibility`, `TableConfiguration` are all unavailable to import.

Declare them in your remote's `src/models/` (copy the shapes from MD), and keep them **structurally compatible with the call signatures** — e.g. Brands' `metadata` fields are required in api-calls, so a looser shared `Metadata` type will not be assignable. Prefer that over `as unknown as` casts at the call boundary.

For table configuration, use the generic `updateSingleConfiguration(tenant, key, { key, value })` that MD uses, not the purpose-built `updateTableConfiguration` — MD's persisted shape is what existing saved preferences depend on.

## Phase 1 — Tier 1 infrastructure

See `REUSABLE_FROM_USERS_AND_GROUPS.md` Tier 1 tables and `MIGRATED_MODULES.md` for source remotes. Minimum:

- Entire `src/components/shared/` (lean `InputField` — never MD `InputField`)
- CL ≥ 2.2.0 → import `ConfirmBox`, `BackButton`, `DateValue`, `ProgressSpinner` directly; delete local copies
- SCSS Modules for feature UI (no global/unscoped styles)
- Providers, hooks, `api/bootstrap.ts`, models, `translations/*/global.ts` — see REUSABLE tables

### Promote-to-CL check (before copying shared UI)

When a UI component already lives in a prior remote:

1. If CL exports it → import directly (no wrapper unless LocalizedInput-style deps).
2. If only local remote copies exist → **ask the user**: migrate to CL now (skill `migrate-to-component-library`, Pattern A/B) or keep a local copy?
3. Do not silently third-copy.

## Phase 2 — Domain port

**Green-field:** copy in-scope MD pages/components/contexts only. Never copy another module's domain folders.

**Derived remote** (same domain, reduced scope — e.g. customer-groups from U&G): follow playbook §11. Strip leaf screens only; keep shared models/hooks; re-diff MD for subtype fields.

Always: rewrite PrimeReact → CL; no `primereact` deps/CSS; replace `useTenant()` → `useDashboardContext().tenant`; Jest → Vitest; Hash-relative routes; `src/constants/paths.ts`.

### Keep MD's exact icon glyphs — do this as a step, not a memory

`primereact` components go, **`pi pi-*` icon classes stay**. The primeicons font ships inside `@emporix/component-library/styles`, so keeping them costs nothing and is the only way the port looks identical. Substituting a react-icons lookalike silently changes the shape (`BsTrashFill` is a *filled* bin; MD's `pi pi-trash` is an *outline* one).

Run this against every screen you port, and carry each hit across verbatim:

```bash
rg -o "pi pi-[a-z-]+" "$(git -C ../management-dashboard rev-parse --show-toplevel)/src" 2>/dev/null | sort -u
# or, when the MD source is already deleted:
git -C ../management-dashboard show master:src/modules/{Module}.module.tsx | rg -o "pi pi-[a-z-]+" | sort -u
```

Only reach for `react-icons` where MD itself used it. Three independent re-runs of the Brands port each had to be corrected here — two silently swapped the glyph set, so treat it as a checklist item rather than something you will remember.

## Phase 2b — Remote wiring

Provider stack, outer → inner. **Copy all seven** unless you can show the module needs none of a provider's data — a verification run silently shipped five and lost feature toggles and site scoping:

```
ToastProvider (CL)
 └ DashboardProvider          appState from the host
    └ PermissionsProvider     fetches IAM access controls itself (never via AppState)
       └ FeatureTogglesProvider
          └ ConfigurationProvider   languages/currencies/contentLanguage (+ table config)
             └ SitesProvider
                └ UIBlockerProvider
                   └ HashRouter → Routes → {Module}.module (RefreshValuesProvider + Outlet)
```

`RemoteComponent` must also: import `@emporix/component-library/styles` **once**, call `useApiCredentials(appState.tenant, appState.token)`, sync `i18n.changeLanguage(appState.language)`, and **export `RemoteComponent` both named and default** (see the 2026-08-07 decisions-log row — default-only breaks the host's `loadRemoteModule`).

### CL API deltas that bite during the port

| CL component | Delta from MD |
|--------------|---------------|
| `ConfirmBox` | `message` is **required**; MD's local one took `title` only. Supply a real message — do not just repeat the title. |
| `Tabs` | **No per-tab `disabled`.** MD greys out tabs (e.g. Media before first save). Hiding the tab instead is a UX change — confirm with the user, or render the tab with disabled content. |
| `Checkbox` | No `label` prop — render your own `<label htmlFor>`. |
| `DataTable` | Row actions come from the `rowActions` prop, not a column. If MD let users toggle an "actions" column via `TableExtensions`, that column no longer exists to toggle. |
| — | No `Sidebar`, no `InputSwitch`. |

## Phase 3 — MD host wiring (hard gate)

Follow **`management-dashboard/.cursor/rules/federated-module-wiring.mdc`** (SoT for host patterns).

| Mode | When |
|------|------|
| A — permanent remote | No useful built-in fallback |
| B — toggle rollout | Parallel built-in + remote |

Always: `VITE_{MODULE}_URL` in all MD `.env.*`; grep i18n namespace before deleting; validate federation triangle (see reference.md § Validation greps).

Do **not** mark Phase 3 done because the remote exists — greps must pass.

## Phase 4 — QA gates

**Extension:** `npm run typecheck && npm run lint && npm run test:run && npm run build:dev`

**MD:** `npm run build -- --mode stage && npm run lint && npm run test`

Plus post-port anti-pattern greps (see reference.md § Validation greps).

## Phase 5 — Cleanup (after sign-off)

- Remove built-in code that only served the extracted route(s).
- **Retain** files still imported by sibling modules.
- Delete `dist/*.js` under MD module folder.
- Switch to ExternalModule-only if using Mode B.
- Update playbook decisions log.

## Phase 6 — Firebase + CI (before first deploy)

Create Hosting sites, register `.firebaserc` + `firebase.json`, copy workflow YAMLs, confirm lockfile resolves CL from npm. Details: playbook §9.

## Phase 7 — Cross-model review + knowledge capture

Bugbot + second model on full diff. Append 1–3 rows to playbook decisions log. Update this skill if steps were wrong.

**Required registry update:** add/refresh row in `docs/MIGRATED_MODULES.md` + bump "Next free local port". Refresh `REUSABLE_FROM_USERS_AND_GROUPS.md` if Tier 1 inventory changed.

## Phase 8 — PRs, merge order, release

**Merge order is a hard gate.** The host PR deletes MD's built-in screens and points at the remote's URLs, so:

1. Merge the **md-extensions** PR first and let `deploy-dev-stage` finish.
2. Confirm the remote actually serves — `curl -o /dev/null -w '%{http_code}' https://emporix-{module}-develop.web.app/assets/remoteEntry.js` must return `200`. A green workflow only proves it deployed, not that the entry resolves.
3. Only then merge the **management-dashboard** PR. Merged first, the module's menu entry 404s in every environment.
4. Production needs a `{module}-*` tag to trigger `deploy-prod`.

Cross-link the two PRs and state the order in the host PR body.

Squash each branch before merge (`git-workflow`), keeping a `{KEY}-### …` subject.

**Before requesting review, render the module.** Every gate in Phase 4 is structural — none of them prove the UI looks right. Run the remote standalone (`npm run dev`, tenant/token via the dev settings dialog) or open the PR preview URL. Visual regressions found here are cheap; found after the MD deletion merges, they are not.
