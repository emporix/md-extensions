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
- **Never copy** MD `InputField` — it depends on `ProductDataProvider`. Copy U&G’s lean `InputField` instead.
- **Also copy** Tier 1 providers/hooks/bootstrap from U&G (see reusable guide); slim `PermissionsProvider` per module.
## 6. MD wiring recipe

1. Create `src/modules/{module}/config/{module}.config.ts` with `{MODULE}_EXTERNAL_MODULE_FEATURE_TOGGLE`.
2. Update `src/router/module-routes.tsx`:
   - During rollout: `GateComponent` toggle ON → `ExternalModule`, OFF → built-in routes.
   - After cleanup: `ExternalModule` only (built-in employee code removed).
3. Add `VITE_{MODULE}_URL` to all `.env.*` files.
4. Create backend feature toggle via Administration → Feature Toggles; enable on dev tenant first.

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
| Customer groups (stays in MD) | `management-dashboard/src/modules/usersAndGroups/CustomerGroups.*` |

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
