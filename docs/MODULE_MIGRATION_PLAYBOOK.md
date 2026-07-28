# MD Module Migration Playbook

Living guide for extracting Management Dashboard modules into `md-extensions` federated remotes. **Pilot reference:** `users-and-groups` (COP-5598).

**Agent copy inventory:** [REUSABLE_FROM_USERS_AND_GROUPS.md](./REUSABLE_FROM_USERS_AND_GROUPS.md) — what to copy/adapt/skip from the U&G pilot (shared UI, providers, hooks, checklist).

## 1. Prerequisites

- `@emporix/component-library` **≥ 2.0.0** (Pattern B widgets bundle `primereact` / theme / primeicons; remotes must not depend on or import `primereact` directly).
- Required CL primitives for typical ports: Dialog, DataTable, Menu, ToastProvider, Checkbox, RadioButton, AutoComplete, Message, ProgressSpinner, FilterMatchMode (re-exported).
- Ticket interview checklist:
  - Scope: which routes move vs stay in MD?
  - Toggle name: `{kebab-module}-external-module`
  - Customer-group or cross-module exclusions
  - Firebase / CI URL placeholders **and** Hosting site IDs (must be created in Firebase before first deploy)
  - Default tenant for dev standalone shell
  - Published CL semver for `package.json` (never commit `file:../../component-library` lock entries)
## 2. Federation contract

| Item | Rule |
|------|------|
| Vite `name` | Must equal MD route `key` and `ExternalModule.moduleName` (camelCase) |
| Expose | `./RemoteComponent` → `src/RemoteComponent.tsx` |
| Router | `HashRouter` inside remote; host uses `BrowserRouter` |
| Env var | `VITE_{MODULE_SCREAMING_SNAKE}_URL` → `.../assets/remoteEntry.js` |
| Shared deps | `react`, `react-dom`, `react-router`, `react-i18next`, `chart.js`, `quill` — versions must match host |

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

Order (outer → inner):

```
ToastProvider (CL)
→ DashboardProvider
→ PermissionsProvider
→ ConfigurationProvider (if languages/currencies)
→ SitesProvider
→ UIBlockerProvider (optional)
→ HashRouter + routes
→ RefreshValuesProvider (module shell / Outlet)
```

Reference: `md-extensions/users-and-groups/src/RemoteComponent.tsx`, `md-extensions/products/src/RemoteComponent.tsx`.

## 5. Hybrid composite policy

Full file list and agent checklist: [REUSABLE_FROM_USERS_AND_GROUPS.md](./REUSABLE_FROM_USERS_AND_GROUPS.md).

- **Copy** layout shells from U&G `src/components/shared/` (at minimum: `HeaderSection`, `BackButton`, `SectionBox`, `FormGrid`, `FormGridRow`, `EmptyContent`, `EmptyTable`, `ConfirmBox`, `DeleteConfirmBox`, `TableActions`, `BatchDeleteButton`, lean `InputField`, `DropdownFilter`, `LocalizedInput`, `LoadingLayout`).
- **Use CL** for primitives: `InputText`, `Dropdown`, `DataTable`, `Tabs`, `Dialog`, buttons, `ProgressSpinner`, `FilterMatchMode` / DataTable filter types.
- **Never** add `primereact` / `primeicons` to the remote `package.json` or import their CSS — load only `@emporix/component-library/styles` at the federated entry.
- **Never copy** MD `InputField` — it depends on `ProductDataProvider`. Copy U&G’s lean `InputField` (`components/shared/InputField.tsx`). There is no CL `FormField` substitute for that wrapper.
- **Also copy** Tier 1 providers/hooks/bootstrap from U&G (see reusable guide); slim `PermissionsProvider` per module.
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

Wire workflows by copying an existing module’s trio under `.github/workflows/` (e.g. `users-and-groups-firebase-*.yaml`) and renaming targets/paths.

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

## 10. Pilot reference (users-and-groups)

| Artifact | Path |
|----------|------|
| Remote entry | `md-extensions/users-and-groups/src/RemoteComponent.tsx` |
| Vite federation name | `usersAndGroups` |
| MD route key | `usersAndGroups` |
| Toggle | `users-and-groups-external-module` |
| Env var | `VITE_USERS_AND_GROUPS_URL` |
| Customer groups | Extracted 2026-07-27 to the `customer-groups` remote — no longer in MD |

## 11. Second remote (customer-groups)

| Artifact | Path |
|----------|------|
| Remote entry | `md-extensions/customer-groups/src/RemoteComponent.tsx` |
| Vite federation name | `customerGroups` |
| MD route key | `customerGroups` |
| Mode | A — permanent remote (`url:` prop, no toggle/fallback) |
| Env var | `VITE_CUSTOMER_GROUPS_URL` |
| Local ports | dev + preview pinned to `5174` (`strictPort`) |

Scaffolded from `users-and-groups` and reduced to the group domain: the users
domain (`pages/User.page.tsx`, `components/user/`, `UsersTable`,
`helpers/users/`) was removed, while `useUsersTableColumns`, `User.model`, and
`hooks/api/iam.ts` were retained because group member tables depend on them.
Routes render `GroupDataProvider` with `groupType={GroupUserTypes.CUSTOMER}`.

---

## Decisions log

| Date | Decision | Alternatives rejected | Applies to |
|------|----------|----------------------|------------|
| 2026-06-25 | Federation name `usersAndGroups` (not `extension`) | Generic template name | All modules |
| 2026-06-25 | Permissions in remote `PermissionsProvider`, not AppState | Host passes permissions | All modules |
| 2026-06-25 | Hybrid composites + CL primitives | Full MD copy; full CL rewrite | All modules |
| 2026-06-25 | Customer Groups remain in MD | Port with employee U&G | users-and-groups |
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
