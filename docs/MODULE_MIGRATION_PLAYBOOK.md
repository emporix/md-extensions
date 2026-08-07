# MD Module Migration Playbook

Living guide for extracting Management Dashboard modules into `md-extensions` federated remotes.

**Migrated modules registry (update after every migration):** [MIGRATED_MODULES.md](./MIGRATED_MODULES.md)  
**Agent copy inventory:** [REUSABLE_FROM_USERS_AND_GROUPS.md](./REUSABLE_FROM_USERS_AND_GROUPS.md) — Tier 1 from **all** playbook-aligned remotes (not U&G alone).  
**First pilot:** `users-and-groups` (COP-5598). **Second:** `customer-groups` (COP-6096) — see registry.

## 1. Prerequisites

- `@emporix/component-library` **≥ 2.0.0** (Pattern B widgets bundle `primereact` / theme / primeicons; remotes must not depend on or import `primereact` directly).
- Required CL primitives for typical ports: Dialog, DataTable, Menu, ToastProvider, Checkbox, RadioButton, AutoComplete, Message, ProgressSpinner, FilterMatchMode (re-exported).
- Prefer **CL ≥ 2.2.0** shells when exported: `ConfirmBox`, `BackButton`, `DateValue` (delete local U&G copies once pinned).
- **CL replacement policy:** import CL components **directly** in feature code. Add a local thin wrapper **only** when the app must inject dependencies the library deliberately omits (i18n, tenant languages, config) — same pattern as `LocalizedInput`. Do not wrap CL widgets "for consistency" when props can be passed at the call site.
- Ticket interview checklist:
  - Scope: which routes move vs stay in MD?
  - Toggle name: `{kebab-module}-external-module` (Mode B only — prefer Mode A when there is no built-in fallback)
  - Cross-module consumers that **import** the module folder (Companies, Price Lists, Segments i18n, …) — cleanup must retain those files / re-home keys
  - Unique local Vite port (avoid colliding with U&G `5173`) + matching `VITE_{MODULE}_URL` in MD `.env.local-*`
  - Firebase / CI URL placeholders **and** Hosting site IDs (must be created in Firebase before first deploy)
  - Default tenant for dev standalone shell
  - Published CL semver for `package.json` (never commit `file:../../component-library` lock entries)
  - Scaffold source: clone **[md-module-template](https://github.com/emporix/md-module-template)** branch **`md-module-migration`** into `md-extensions/{kebab-module}/`, then absorb (remove nested `.git`). Align Tier 1 with **playbook-aligned remotes** in [MIGRATED_MODULES.md](./MIGRATED_MODULES.md) (not `products`, not template `master`)

### Scaffold starter (required)

```bash
cd md-extensions
git clone -b md-module-migration --single-branch \
  https://github.com/emporix/md-module-template.git {kebab-module}
rm -rf {kebab-module}/.git   # absorb into the md-extensions monorepo
```

Then rename federation `name`, scrub leftovers, pin a unique port (see [MIGRATED_MODULES.md](./MIGRATED_MODULES.md) "Next free local port"), and continue Phase 0/1 against playbook-aligned remotes (see skill). Do **not** leave a nested git repo; do **not** start from template `master` (Product List / `extension` name).

## 2. Federation contract

| Item | Rule |
|------|------|
| Vite `name` | Must equal MD route `key` and `ExternalModule.moduleName` (camelCase) |
| Expose | `./RemoteComponent` → `src/RemoteComponent.tsx` |
| Router | `HashRouter` inside remote; host uses `BrowserRouter` |
| Env var | `VITE_{MODULE_SCREAMING_SNAKE}_URL` → `.../assets/remoteEntry.js` |
| Shared deps | `react`, `react-dom`, `react-router`, `react-i18next` — versions must match host. **Do not add `chart.js` / `quill`**: they were template-era entries, the aligned remotes do not share them, and CL now bundles what needs them. Sharing a dep the remote does not import is dead weight. |

**Never** use generic federation names like `extension`.

## 3. AppState matrix

| Field | Include? | Rationale |
|-------|----------|-----------|
| `tenant`, `language`, `token` | **Required** | API bootstrap, i18n sync |
| `onError` | **Required** | 401 re-auth, federation load errors |
| `contentLanguage`, `currency` | **Required** | Host header selectors; seed/sync `ConfigurationProvider` |
| `user` | **Optional** | Ory session identity for contract compatibility; do **not** fetch Ory inside remote |
| `permissions` | **Skip** | Port `PermissionsProvider` in remote (token-backed IAM) |

Host passes AppState via `ExternalModule` → `DynamicComponent`.

## 4. Provider stack template

Order (outer → inner). **All seven are the default — copy them all.** Omit one only when you can show the module needs none of its data, and say so in the PR:

```
ToastProvider (CL)
→ DashboardProvider          appState from the host
→ PermissionsProvider        fetches IAM access controls itself (never via AppState)
→ FeatureTogglesProvider
→ ConfigurationProvider      languages / currencies / contentLanguage (+ table config)
→ SitesProvider
→ UIBlockerProvider
→ HashRouter + routes
→ RefreshValuesProvider      (module shell / Outlet)
```

`RemoteComponent` must also import `@emporix/component-library/styles` once, call `useApiCredentials(tenant, token)`, sync `i18n.changeLanguage(appState.language)`, and export `RemoteComponent` **named + default**.

> This list previously omitted `FeatureTogglesProvider` and hedged `ConfigurationProvider`/`UIBlockerProvider` as conditional. A from-the-docs re-run duly shipped five providers, losing feature toggles and site scoping — with typecheck, lint and build all green, because nothing fails until a screen reads that context. Treat trimming as a decision that needs evidence.

Reference: `md-extensions/brands/src/RemoteComponent.tsx` (all seven), `md-extensions/users-and-groups/src/RemoteComponent.tsx`.

## 5. Hybrid composite policy

**Full inventory (Tier 1/2/3 tables):** [REUSABLE_FROM_USERS_AND_GROUPS.md](./REUSABLE_FROM_USERS_AND_GROUPS.md).  
**Tier 1 sources:** [MIGRATED_MODULES.md](./MIGRATED_MODULES.md) — use newest playbook-aligned remote.

Key rules (detail in REUSABLE):

- Copy layout shells from `src/components/shared/` of the best playbook-aligned remote.
- **CL ≥ 2.2.0** → import `ConfirmBox`, `BackButton`, `DateValue`, `ProgressSpinner` directly; no pass-through wrappers unless app deps are required (`LocalizedInput` pattern).
- **Promote-to-CL gate:** before third-copying a shared shell already in a prior remote, ask the user whether to migrate it to CL first.
- **SCSS Modules** for feature UI — no global / unscoped styles, no inline styles.
- **CL primitives** only (`InputText`, `Dropdown`, `DataTable`, `Tabs`, `Dialog`, `FilterMatchMode`, …). Never add `primereact` / `primeicons` deps or CSS.
- **Lean `InputField`** from prior remote — never MD `InputField` (ProductDataProvider).

## 6. MD wiring recipe (hard gate)

Remote-only is **not** done. Phase 3 greps must pass before calling the migration complete.

**Host SoT:** `management-dashboard/.cursor/rules/federated-module-wiring.mdc` (Mode A `url:`, Mode B `GateComponent` + toggle, env matrix, cleanup retention).

**Mode A** (permanent remote, like `statistics`): set `url: process.env.VITE_{MODULE}_URL` on the route — `parseRoute` mounts `ExternalModule`.

**Mode B** (parallel rollout):

1. Create `src/modules/{module}/config/{module}.config.ts` with `{MODULE}_EXTERNAL_MODULE_FEATURE_TOGGLE`.
2. Update `src/router/module-routes.tsx`: GateComponent children → `ExternalModule`, `fallback` → built-in.
3. After cleanup: `ExternalModule` only (employee-only built-in removed; retain sibling shared UI).

Always:

1. Add `VITE_{MODULE}_URL` to **all** `.env.*` files (`…/assets/remoteEntry.js`).
2. Create backend feature toggle when using Mode B; enable on dev tenant first.
3. Validate: Vite `name` ≡ route `key` ≡ `moduleName`.

## 7. Per-module audit template

Before porting, run:

```bash
# External imports from other MD modules
rg "from ['\"].*modules/(?!usersAndGroups)" src/modules/{module}/

# PrimeReact inventory (target: CL rewrite)
rg "from 'primereact" src/modules/{module}/

# Stray build artifacts
find src/modules/{module} -path '*/dist/*'

# Cross-module type blockers
rg "AccessControlDomainGroup|InputField" src/modules/{module}/
```

## 8. QA matrix template

| # | Scenario | Toggle ON | Toggle OFF (pre-cleanup) |
|---|----------|-----------|--------------------------|
| 1 | Module route loads | Federated remote | Built-in module |
| 2 | List CRUD | pagination, sort, filter | same |
| 3 | Create/edit flows | validation, toasts | same |
| 4 | Excluded routes | still built-in MD | unchanged |
| 5 | Locale smoke | DE keys resolve | same |

Automated gates (both repos): `typecheck`, `lint`, `test:run` / `test`, `build`.

## 9. Firebase Hosting + CI (new remotes)

Wire workflows by copying an existing module's trio under `.github/workflows/` (e.g. `users-and-groups-firebase-*.yaml`) and renaming targets/paths.

| Env | Firebase project | Hosting site / target | Trigger |
|-----|------------------|------------------------|---------|
| develop (live) | `frontend-extensions-develop` | `emporix-{module}-develop` | push `master` + `paths: '{module}/**'` |
| stage (live) | `frontend-extensions-stage` | `emporix-{module}-stage` | same workflow after develop build |
| prod (live) | `frontend-extensions` | `emporix-{module}` | prod workflow |
| PR preview | `frontend-extensions-develop` | same develop site, preview channel | PR to `master` touching `{module}/**` |

### Before first CI deploy

1. **Create Hosting sites** in each Firebase project (CLI or console). Declaring them in `.firebaserc` / `firebase.json` alone is **not** enough — missing sites fail with `HTTP 404 Requested entity was not found` on channel/live deploy:

```bash
firebase hosting:sites:create emporix-{module}-develop --project frontend-extensions-develop
firebase hosting:sites:create emporix-{module}-stage --project frontend-extensions-stage
firebase hosting:sites:create emporix-{module} --project frontend-extensions
```

2. Register targets in root [`.firebaserc`](../.firebaserc) and hosting blocks in root [`firebase.json`](../firebase.json) (public: `{module}/dist`, CORS `Access-Control-Allow-Origin: *`).
3. Point MD `VITE_{MODULE}_URL` at `https://emporix-{module}-develop.web.app/assets/remoteEntry.js` (adjust host for stage/prod).

### npm / lockfile rules for CI

- Depend on a **published** `@emporix/component-library` version (`"2.0.0"`, not `file:../../…`).
- After changing the version, regenerate the lockfile with a clean install so `node_modules/@emporix/component-library` resolves to the registry tarball (`"link": true` to a sibling path breaks `npm ci` on GitHub Actions).
- Ignore local Vite cache: add `.vite` to the module `.gitignore` (see U&G).

## 10. Pilot artifacts

See [MIGRATED_MODULES.md](./MIGRATED_MODULES.md) for the full registry of extracted remotes (federation names, tickets, modes, ports, CL versions, and reusable deltas).

## 11. Derived remotes (pattern)

When a new remote is mostly a **scoped copy** of U&G (or another pilot) rather than a green-field MD port:

| Step | Do |
|------|----|
| 1 | Copy U&G → `md-extensions/{kebab}/`; rename package / vite `name` / README |
| 2 | Delete **leaf** out-of-scope screens only; keep shared models/hooks the remaining UI needs |
| 3 | Diff MD source for the target subtype (customer vs employee, vendor, …) and restore missing fields/APIs |
| 4 | Drop dead `entityLinkConfig` / path helpers / i18n keys for removed routes |
| 5 | Pin a free local port; set `dev` to `vite --mode dev` |
| 6 | Prefer Mode A when MD already has no useful built-in fallback |
| 7 | Run playbook §7 greps + Phase 4 QA + decisions-log rows |

Do **not** claim "identical to U&G" after a reduce — `diff -rq` will (and should) show intentional drift.

---

## Decisions log

| Date | Decision | Alternatives rejected | Applies to |
|------|----------|----------------------|------------|
| 2026-06-25 | Federation name `usersAndGroups` (not `extension`) | Generic template name | All modules |
| 2026-06-25 | Permissions in remote `PermissionsProvider`, not AppState | Host passes permissions | All modules |
| 2026-06-25 | Hybrid composites + CL primitives | Full MD copy; full CL rewrite | All modules |
| 2026-06-25 | ~~Customer Groups remain in MD~~ **Superseded 2026-07-27** by COP-6096 (`customerGroups` remote) | Port with employee U&G | users-and-groups → customer-groups |
| 2026-06-25 | `contentLanguage` + `currency` in AppState | Remote fetches config only | All modules |
| 2026-06-25 | Post-cleanup: `ExternalModule` only (no built-in fallback) | Keep dead fallback routes | users-and-groups |
| 2026-06-25 | Hash-relative paths in remote (`/users/:id`) not host absolute paths | Full `/administration/...` paths in HashRouter | users-and-groups |
| 2026-07-16 | CL ≥ 2.0.0 bundles Pattern B Prime + saga-blue/primeicons CSS; remotes drop `primereact` deps/CSS | Peer + host theme CSS per remote | All new remotes |
| 2026-07-16 | Lockfile must resolve CL from npm registry (no `file:` links) | Local `file:../../component-library` for CI | All remotes |
| 2026-07-16 | Provision Firebase Hosting sites before first preview/live deploy | Relying on `.firebaserc` alone | All new remotes |
| 2026-07-16 | Lean U&G `InputField` is SoT (not MD InputField, not CL FormField) | FormField wording in older rules | All remotes |
| 2026-07-16 | Phase 3 MD env+route wiring is a hard gate; remote-only ≠ done | Treat playbook as done when remote builds | All modules |
| 2026-07-16 | Cleanup retains MD files still imported by sibling routes (Customer Groups) | Delete whole MD module folder | users-and-groups + similar |
| 2026-07-16 | After U&G scaffold: `diff -rq` before domain work; greps exclude `*.md` | File-count parity claims; grepping notes | All remotes |
| 2026-07-16 | Scrub scaffold leftovers (`.env.example` / README product wording); keep U&G `.gitignore` env rules | Blind rsync without rename/scrub | All remotes |
| 2026-07-16 | Same-module pilot-copy dry-runs: stop after one clean `diff -rq`; next cycle re-port from MD or pick another module | Endless U&G rsync cycles | Tooling validation |
| 2026-07-16 | Split ownership: remote rules/skill/hooks in md-extensions; host wiring in MD `federated-module-wiring` | Duplicate `md-host-wiring` in both repos | All modules |
| 2026-07-27 | Customer Groups extracted to its own `customerGroups` remote, reversing the 2026-06-25 "remain in MD" decision | Keep in MD; second exposed entry on the U&G remoteEntry; shared group-domain npm package | customer-groups |
| 2026-07-27 | Group domain copied from U&G rather than shared; duplication accepted so each remote deploys independently | Shared package (extra release coupling); one remote serving both route keys (MD `DynamicComponent` hardcodes `./RemoteComponent`) | customer-groups |
| 2026-07-27 | Strip only leaf users-domain files; keep `useUsersTableColumns`, `User.model`, `hooks/api/iam.ts` (group member tables need them) | Delete everything named `*User*` | Derived remotes |
| 2026-07-27 | Pin remote dev/preview ports (`5174`, `strictPort`) to match MD `.env.local-*` | Vite defaults — collide with U&G on 5173/4173 and break local host wiring | All remotes |
| 2026-07-27 | Drop `employee` from `entityLinkConfig` when the remote has no user route | Keep mapping and emit links that dead-end at `Navigate to="/"` | Derived remotes |
| 2026-07-27 | Before deleting an MD module folder, grep its i18n namespace across `src/` and re-home keys used by staying routes (Segments used `usersAndGroups.groups.tables.members.actions.removeMember`) | Rely on typecheck/build — missing i18n keys only surface at runtime | All modules |
| 2026-07-27 | MD cleanup applied directly to `master` as a targeted change | Merging the local `customer-groups` branch, which bundles unrelated COP-5598 work (`GroupsSelector`/`CompaniesSelector` removal, `PriceListsSettings` rework, api-calls bump) | customer-groups |
| 2026-07-28 | After reducing U&G to a customer-only remote, re-diff MD `GroupUserTypes.CUSTOMER` form fields (Company / `b2b.legalEntityId`) — employee pilot omits them | Assume U&G group form is a complete customer-group form | Derived remotes |
| 2026-07-28 | Prefer published CL `ConfirmBox` when the library exports it; delete the local shared copy | Keep duplicated remote `ConfirmBox` forever | Remotes on CL ≥ 2.2.0 |
| 2026-07-29 | Prefer CL `BackButton` / `DateValue` / `ProgressSpinner` the same way; cascade CL shell adoption to sibling remotes when bumping | Leave each remote on divergent local copies | Remotes on CL ≥ 2.2.0 |
| 2026-07-29 | Remote `dev` script: `vite --mode dev` so `.env.dev` loads | Plain `vite` (often skips mode-specific env) | All remotes |
| 2026-07-29 | Keep a living [MIGRATED_MODULES.md](./MIGRATED_MODULES.md) registry; Tier 1 comes from **all** playbook-aligned remotes, not U&G alone — update after every migration | Single-pilot dependency on `REUSABLE_FROM_USERS_AND_GROUPS` / U&G only | All remotes |
| 2026-07-29 | Prefer SCSS Modules for remote UI; avoid global / unscoped styles that MD global CSS can override (or that leak into the host) | Global class names in `index.css` / unscoped SCSS for feature UI | All remotes |
| 2026-07-29 | When implementing a shared UI piece already present in a prior remote (`users-and-groups`, `customer-groups`, …), **ask the user** whether to migrate it to CL before copying again | Silently third-copy local shells forever | All remotes |
| 2026-07-29 | Members pagination: omit `usePagination` prefix when MD used shared `page`/`rows` on the group detail URL | Blindly keep U&G `'members'` prefix on every derived remote | customer-groups |
| 2026-07-29 | Document derived-remote pattern (§11) after COP-6096 | Treat every extraction as green-field MD copy only | All modules |
| 2026-07-29 | Consolidate overlapping migration docs: playbook is policy SoT, REUSABLE is inventory SoT, MIGRATED_MODULES is registry SoT, skill is workflow SoT, reference.md is FAQ/greps SoT | Duplicating checklists and lessons across all files | All docs |
| 2026-08-03 | Group details: stabilize tab content + skip `reset()` while `formState.isDirty` so accessControls-only `setValue({ shouldDirty })` enables Save; register `accessControls` and subscribe Save via `useFormState` | Relying on remount-safe tab JSX + templates-gated reset (wipes dirty on parent re-render) | customer-groups + users-and-groups |
| 2026-08-03 | Post-migration verify (COP-6096): federation triangle + MD Mode A envs pass; develop/stage/prod Firebase hosting sites exist (`emporix-customer-groups*`) — prod may still need first deploy for remoteEntry | Treat site list empty as “site missing”; treat empty site (no deploy) as separate deploy step | customer-groups |
| 2026-08-03 | Access controls assignment: drive updates through `useController`/`field.onChange` (not bare `setValue`); seed form with `mode: 'onChange'` + `trigger()` after reset; Save uses `dirtyFields.accessControls` | Assuming `setValue(..., { shouldDirty: true })` alone flips Save for array fields | customer-groups + users-and-groups |
| 2026-08-05 | Promote missing widgets to CL (Pattern B) rather than adding `primereact` to a remote — Brands needed rich text + media upload, so CL 2.4.0 added `Editor` / `FileUpload` / `ProgressBar` | Add `primereact` to the remote (as `products` does), or descope the screens | All remotes |
| 2026-08-05 | Pin `quill@^1.3.7` wherever PrimeReact 8's `Editor` is used: it calls `clipboard.convert(htmlString)` (Quill 1 API), so Quill 2 silently loads no existing content. MD still ships the broken pairing | Assume newest `quill` works; trust that the editor renders = it works | CL + any Editor consumer |
| 2026-08-05 | Substitute CL `Dialog` + `Checkbox` where CL lacks `Sidebar` / `InputSwitch` (Brands `TableExtensions`); function and persisted shape preserved, presentation differs | Block the migration on another CL release, or silently drop the feature | Remotes needing column visibility |
| 2026-08-05 | Where a ported screen links to a host-owned route with no remote equivalent (Brands media tiles → `/media-assets/:id`), use `window.location.assign` and comment it as the escape hatch | Silently drop the link, or add `permissions`/navigation to AppState | All remotes |
| 2026-08-05 | Audit MD screens for `TableExtensions` before Phase 5 — column visibility is invisible in a literal component diff and its loss is a user-facing regression | Assume the aligned remotes' feature set is complete parity | All modules |
| 2026-08-05 | Verify a scaffold's own CI gates run non-interactively (template `ensure-cors-origin.mjs` prompts on a TTY and exits 1 headless) before trusting the deploy workflow | Copy workflow YAMLs and assume the build steps behave in CI | Remotes from md-module-template |
| 2026-08-07 | Remotes must expose **named + default** `RemoteComponent` (`export { RemoteComponent }; export default RemoteComponent`) so Vite federation returns `{ default: Component }` and MD `loadRemoteModule` can keep `return module.default`. Default-only exposes unwrap to a bare function → host NotFound/404. U&G worked by accident (`jsxRuntimeExports as j` in the expose chunk). | Host dual-shape unwrap (`module?.default ?? module`); relying on accidental jsx-runtime named leaks | All remotes (fixed first on customer-groups) |
| 2026-08-07 | Group details `isDirty` remount guard: skip `reset()` only when `initializedGroupKeyRef` is still `null` (tab remount with FormProvider surviving). Always reset when the group id changes so dirty edits cannot leak across routes | Broad `if (isDirty) return` that also skipped reset on A→B navigation | customer-groups + users-and-groups |
| 2026-08-07 | Audit changelog paginator: custom control + CL `Dropdown` (no `primereact/paginator`); restore lean U&G `InputField` in customer-groups shared/ | Leaving PrimeReact in derived remotes; MD ProductDataProvider InputField | customer-groups (+ U&G sync) |
| 2026-08-07 | Re-run a finished migration from the docs alone (fresh agent, no session context) and diff against the real result — divergences are documentation defects, not agent error. The Brands re-run produced 84 files vs 100 and silently dropped two providers | Assume the docs are sufficient because the migration succeeded once | All modules |
| 2026-08-07 | Name the form library explicitly: `react-hook-form`, never MD's `useForm` (NavigationConfirmProvider-coupled). Absent that, a re-run hand-reconstructed the MD hook from call sites | Leave the form approach implicit in the aligned remotes | All remotes |
| 2026-08-07 | Spell out the full seven-provider stack and require justification to omit any — a re-run shipped five, losing feature toggles and site scoping with everything still green | "See playbook §4 for the template" | All remotes |
| 2026-08-07 | Treat Tier 1 as copy-then-fix, not verbatim: `EmptyTable` imports a local `SectionBox`, the media shells carry MD CSS vars, `global.ts` lacks keys the shells use, and ported shells reference another module's i18n namespace | "Copy entire src/components/shared/" | All remotes |
| 2026-08-07 | Keep CL's documented CSS-variable list a pointer to `src/styles/index.scss`, never a copy — the stale copy listed 11 of 56 tokens and a wrong `--color-primary`, so a re-run hardcoded a hex for a token that existed | Inline the token table in the rule | component-library |
| 2026-08-07 | Stop the doc-verification loop at "no material divergence", not "identical output". Three from-scratch re-runs of Brands converged on providers, exports, form library and naming, but never on file count (81/85 vs 100) because skipping unused Tier 1 shells and choosing `components/media/` over `components/shared/` are legitimate judgment | Iterate until byte-identical | All modules |
| 2026-08-07 | A re-run beating the reference is a signal to fix the reference: run 2 used `pi pi-download` where `brands` still had `BsDownload`, so the reference was corrected | Treat the shipped implementation as ground truth | All modules |
| 2026-08-07 | Guidance buried in a reference table gets skipped mid-port. Icon-glyph parity sat in a CL-deltas table and still regressed on run 3, so it moved into Phase 2 as an explicit grep step plus an after-edit hook check | Assume a documented delta will be recalled at the right moment | All remotes |
