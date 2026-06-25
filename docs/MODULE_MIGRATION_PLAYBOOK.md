# MD Module Migration Playbook

Living guide for extracting Management Dashboard modules into `md-extensions` federated remotes. **Pilot reference:** `users-and-groups` (COP-5598).

## 1. Prerequisites

- `@emporix/component-library` ≥ 1.10.0 with required primitives (Dialog, Checkbox, RadioButton, AutoComplete, Message, Menu).
- Ticket interview checklist:
  - Scope: which routes move vs stay in MD?
  - Toggle name: `{kebab-module}-external-module`
  - Customer-group or cross-module exclusions
  - Firebase / CI URL placeholders
  - Default tenant for dev standalone shell

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

- **Copy** layout shells: `HeaderSection`, `SectionBox`, `FormGrid`, `EmptyContent`, `ConfirmBox`, `TableActions`, `BatchDeleteButton`.
- **Use CL** for primitives: `InputText`, `Dropdown`, `DataTable`, `Tabs`, `Dialog`, buttons.
- **Never copy** MD `InputField` — it depends on `ProductDataProvider`. Create lean `FormField` wrapper instead.

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

## 9. Pilot reference (users-and-groups)

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
