# Reusable pieces from Users & Groups — agent guide

**Audience:** Cursor / Copilot / Claude agents (and humans) extracting the next Management Dashboard module into `md-extensions`.

**Canonical source:** `md-extensions/users-and-groups` (COP-5598 pilot).  
**Full workflow:** [MODULE_MIGRATION_PLAYBOOK.md](./MODULE_MIGRATION_PLAYBOOK.md)  
**Skill (canonical):** `md-extensions/.cursor/skills/md-module-extraction/SKILL.md`  
**Host wiring:** `management-dashboard/.cursor/rules/federated-module-wiring.mdc`

> Prefer **users-and-groups** over `md-extensions/products`. Products may still pass `permissions` via AppState; U&G is the source of truth.

---

## How to use this doc

1. Read the [playbook](./MODULE_MIGRATION_PLAYBOOK.md) for federation contract, MD wiring, QA, and cleanup.
2. Use **this file** as the copy inventory: what to take from U&G, what to adapt, what to skip.
3. After the migration, append 1–3 rows to the playbook decisions log if you learned something new.

**Default strategy:** copy Tier 1 files from U&G into the new remote (`src/components/shared/`, `src/context/`, `src/hooks/`, `src/api/`). Do **not** invent a shared package unless several modules already diverge from copy-paste. Prefer `@emporix/component-library` for primitives (InputText, Dropdown, DataTable, Tabs, Dialog, buttons).

All paths below are relative to `md-extensions/users-and-groups/` unless noted.

---

## Agent checklist (next module)

Copy this into the agent prompt or follow in order:

### Pre-flight

- [ ] Confirm scope (what stays in MD vs moves).
- [ ] Federation `name` = MD route `key` (camelCase).
- [ ] Run playbook §7 audit greps on the MD module.
- [ ] Verify CL primitives exist for PrimeReact replacements.

### Phase A — Scaffold from U&G (not from products)

- [ ] Create `md-extensions/{module}/` (clone U&G structure or copy package skeleton).
- [ ] Set Vite federation `name` to route key; expose `./RemoteComponent`.
- [ ] Set `VITE_API_URL` (not `VITE_API_BASE_URL`).
- [ ] Depend on published `@emporix/component-library` ≥ 2.0.0 (registry lockfile — never commit `file:` links).
- [ ] Add `.vite` to module `.gitignore`.
- [ ] Extend `AppState.model.ts` per playbook matrix — **never** put `permissions` on AppState.
- [ ] Keep standalone shell: `App.tsx` + `helpers/settings.helpers.ts` + `main.tsx`.
### Phase B — Copy Tier 1 infrastructure (this doc)

- [ ] Copy entire `src/components/shared/` (see Tier 1 UI list).
- [ ] Copy `translations/{en,de}/global.ts` (+ wire in `translations/*/index.ts`).
- [ ] Copy providers: `Dashboard`, `Configuration`, `Sites`, `UIBlocker` (`UIBlcoker.tsx`), `RefreshValues`.
- [ ] Copy/adapt `PermissionsProvider` — slim domain AC maps to what this module needs.
- [ ] Copy `api/bootstrap.ts` and the thin `use*Api` hook pattern (`hooks/api/`).
- [ ] Copy hooks: `usePagination`, `useTabs`, `useCustomNavigate`, `useLocalizedValue`.
- [ ] Copy helpers: `api.ts`, `apiPagination.ts`, `paginationUtils.ts`, `localized.ts`, useful parts of `date.ts` / `utils.ts`.
- [ ] Copy models: `AppState`, `SessionUser`, `ApiError`, `Localized`, `Configuration`, `Site`, `Metadata`.

### Phase C — Domain port

- [ ] Copy MD module pages/components/contexts for **this** domain only.
- [ ] Rewrite PrimeReact → `@emporix/component-library` (including `FilterMatchMode` / DataTable types / `ProgressSpinner` from CL).
- [ ] Do **not** add `primereact` / `primeicons` deps or CSS — only `import '@emporix/component-library/styles'` at `RemoteComponent`.
- [ ] Wire `HashRouter` routes in `RemoteComponent` (relative hash paths, not host `/administration/...`).
- [ ] Add feature i18n namespace; keep flat key style if matching existing MD keys.
- [ ] **Do not** copy U&G `components/group|user|usersAndGroups`, Group providers, or IAM helpers unless extracting IAM.
### Phase D — MD host wiring

- [ ] Feature toggle `{kebab}-external-module` + `GateComponent` / `ExternalModule`.
- [ ] `VITE_{MODULE}_URL` in all MD `.env.*` files.
- [ ] Validate: Vite `name` ↔ route `key` ↔ `moduleName` on `ExternalModule`.

### Phase D2 — Firebase + workflows (before first CI)

- [ ] Create Hosting sites: `emporix-{module}-develop|stage` and prod `emporix-{module}` (see playbook §9).
- [ ] Add targets to root `.firebaserc` + hosting entries in `firebase.json`.
- [ ] Copy/adapt `.github/workflows/{module}-firebase-*.yaml` from U&G or products.
- [ ] Confirm `package-lock.json` resolves `@emporix/component-library` from npm (no `"link": true`).

### Phase E — QA

- [ ] Extension: `npm run typecheck && npm run lint && npm run test:run && npm run build:dev`
- [ ] MD: `npm run build -- --mode stage && npm run lint && npm run test`
- [ ] Manual QA per playbook §8
- [ ] Update playbook decisions log

---

## Provider stack (required order)

Outer → inner. Reference: `src/RemoteComponent.tsx`.

```
ToastProvider                    (@emporix/component-library)
→ DashboardProvider              (host AppState)
→ PermissionsProvider            (load IAM in remote; slim per module)
→ ConfigurationProvider          (languages / currencies from host seeds)
→ SitesProvider                  (skip only if module is never site-scoped)
→ UIBlockerProvider              (file name: UIBlcoker.tsx — historical typo)
→ HashRouter + Routes
→ {Module}.module.tsx            (Outlet + RefreshValuesProvider)
→ pages
```

Sync language on host change: `i18n.changeLanguage(appState.language)` in `RemoteComponent`.

At federated entry load **only**:

```ts
import '@emporix/component-library/styles'
```

Do not import `primereact` / `primeicons` CSS (bundled in CL ≥ 2.0.0).

---

## Tier 1 — Copy almost verbatim (every module)

### Host / federation shell

| What | Path | Notes |
|------|------|-------|
| Federated entry | `src/RemoteComponent.tsx` | Swap routes/providers only |
| Standalone shell | `src/App.tsx`, `src/main.tsx` | Settings dialog → RemoteComponent |
| Standalone settings | `src/helpers/settings.helpers.ts` | localStorage tenant/token/language |
| Host context | `src/context/Dashboard.context.tsx` | `useDashboardContext()` |
| AppState contract | `src/models/AppState.model.ts` | See playbook §3 |
| Session user | `src/models/SessionUser.model.ts` | Optional Ory shape from host |
| API bootstrap | `src/api/bootstrap.ts` | `setApiCredentials` / `useApiCredentials` |
| Module shell pattern | `src/UsersAndGroups.module.tsx` | Rename; keep Outlet + RefreshValues |
| Federation config | `vite.config.ts` | Change `name` only; keep `cssCodeSplit: false`, shared deps, CORS |

### Shared UI — copy entire `src/components/shared/`

Playbook §5 lists seven; U&G has more. **Copy all of these:**

| Component | File | Role |
|-----------|------|------|
| `HeaderSection` | `HeaderSection.tsx` | Page title, back, actions |
| `BackButton` | `BackButton.tsx` | Used by HeaderSection |
| `SectionBox` | `SectionBox.tsx` (+ `.scss` / `.module.scss`) | Named section panel |
| `FormGrid` | `FormGrid.tsx` | Form layout |
| `FormGridRow` | `FormGridRow.tsx` | Form row |
| `EmptyContent` | `EmptyContent.tsx` | Empty state + optional CTA |
| `EmptyTable` | `EmptyTable.tsx` | SectionBox + EmptyContent |
| `ConfirmBox` | `ConfirmBox.tsx` | Generic confirm dialog |
| `DeleteConfirmBox` | `DeleteConfirmBox.tsx` | Plural delete confirm (needs `global.deleteConfirm.*`) |
| `TableActions` | `TableActions.tsx` | Row edit/delete + overflow menu |
| `BatchDeleteButton` | `BatchDeleteButton.tsx` | Bulk delete + confirm |
| `LoadingLayout` | `LoadingLayout.tsx` | Full-area spinner |
| Lean `InputField` | `InputField.tsx` | Label/error/tooltip wrapper — **not** MD’s ProductData-coupled InputField |
| `DropdownFilter` | `DropdownFilter.tsx` | DataTable column filter → CL Dropdown |
| `LocalizedInput` | `LocalizedInput.tsx` | Multi-lang text (needs ConfigurationProvider) |
| `DotIndicator` | `DotIndicator.tsx` | Boolean status dot (optional; prefer CSS Modules if you touch it) |

Also copy matching `*.module.scss` / `*.scss` next to each component.

**i18n:** copy `src/translations/{en,de}/global.ts` — required by delete confirm, pagination, toasts, table actions.

### Providers

| Provider | Path | Copy? |
|----------|------|-------|
| `DashboardProvider` | `src/context/Dashboard.context.tsx` | Always |
| `ConfigurationProvider` | `src/context/ConfigurationProvider.tsx` | Always (most modules need content language) |
| `SitesProvider` | `src/context/SitesProvider.tsx` | Always unless proven unused |
| `UIBlockerProvider` | `src/context/UIBlcoker.tsx` | Always |
| `RefreshValuesProvider` | `src/context/RefreshValuesProvider.tsx` | Always (list/detail refresh) |
| `PermissionsProvider` | `src/context/PermissionsProvider.tsx` | Always **pattern**; slim implementation (Tier 2) |

### Hooks

| Hook | Path | Copy? |
|------|------|-------|
| `usePagination` | `src/hooks/usePagination.tsx` | Always (lists) |
| `useTabs` | `src/hooks/useTabs.tsx` | Always (tabbed lists) |
| `useCustomNavigate` | `src/hooks/useCustomNavigate.tsx` | Always (HashRouter query merge) |
| `useLocalizedValue` | `src/hooks/useLocalizedValue.tsx` | Always if Localized content |
| `useCurrencies` | `src/hooks/useCurrencies.tsx` | Only if currency UI |

API hooks: copy the **pattern** from `src/hooks/api/` (wrap `@emporix/api-calls` with `useDashboardContext().tenant`). Replace call sets with the new module’s APIs.

### Helpers

| Helper | Path | Copy? |
|--------|------|-------|
| `settings.helpers.ts` | `src/helpers/settings.helpers.ts` | Always (standalone) |
| `api.ts` | `src/helpers/api.ts` | Always (errors / toasts) |
| `apiPagination.ts` | `src/helpers/apiPagination.ts` | Always with usePagination |
| `paginationUtils.ts` | `src/helpers/paginationUtils.ts` | Always for full-list fetches |
| `localized.ts` | `src/helpers/localized.ts` | Always with Localized |
| `date.ts` | `src/helpers/date.ts` | Copy formatters; trim unused chart/range bits |
| `utils.ts` | `src/helpers/utils.ts` | Generic utils |
| `props.ts` | `src/helpers/props.ts` | Tiny shared prop types |

### Models (shared types)

Copy: `AppState`, `SessionUser`, `ApiError`, `Localized`, `Configuration`, `Site`, `Metadata`.

---

## Tier 2 — Adapt per module

| Piece | Guidance |
|-------|----------|
| `PermissionsProvider` | Keep: load IAM from token in the remote. Remove or slim U&G-specific AC domain maps, employee-vendor-OE logic, templates the new module does not use. |
| `SitesProvider` | Omit from provider stack only if the module never needs sites. |
| `hooks/api/configuration.ts`, vendors | Only if the module edits config or needs vendors. |
| `constants/paths.ts` | Same HashRouter-relative pattern; rewrite paths for the new module. |
| `{Module}.module.tsx` | Same Outlet + `RefreshValuesProvider` shell; rename. |
| Feature translations | New `{feature}.ts` under `translations/{en,de}/`; do not reuse `usersAndGroups.ts`. |

---

## Tier 3 — Do not copy as shared infrastructure

Leave behind unless you are extracting the **same** IAM/users/groups domain:

- `src/components/group/**`
- `src/components/user/**`
- `src/components/usersAndGroups/**`
- `src/context/Group.provider.tsx`, `GroupRole.provider.tsx`
- `src/hooks/api/iam.ts` **contents** (pattern OK; calls are domain-specific)
- `src/helpers/accessControls.ts`
- `src/helpers/groups/**`, `src/helpers/users/**`
- `src/hooks/useUsersTableColumns.tsx`, `useGroupsTableColumns.tsx`, `useDomainsColumns.tsx`, `useDomainsExpansionColumns.tsx`
- `src/translations/*/usersAndGroups.ts`
- Domain models: `User`, `Groups`, `Permissions`, `AccessControl`, `Vendor` (unless needed)

Empty placeholder: `src/components/data-table/` — ignore.

---

## Hybrid UI policy (summary)

| Do | Don't |
|----|-------|
| Copy U&G lean `InputField` / layout shells | Copy MD `InputField` (ProductDataProvider coupling) |
| Use CL for InputText, Dropdown, DataTable, Tabs, Dialog, buttons, ProgressSpinner | Reintroduce direct `primereact` imports or deps in new remotes |
| Import only `@emporix/component-library/styles` | Import `primereact` / `primeicons` CSS at remote entry |
| Use HashRouter relative paths | Hardcode host BrowserRouter absolute paths |
| Pass tenant/token via `useDashboardContext()` | Hardcode tenant/token or fetch Ory inside remote |
| Load permissions in remote | Put `permissions` on AppState |
| Publish CL then pin semver in lockfile | Commit `file:../../component-library` for CI |
---

## Optional later (after 2–3 more modules)

Not required for the next extraction:

1. Extract Tier 1 into `md-extensions/shared/` or an internal package to stop copy-paste drift.
2. Promote stable shells (`HeaderSection`, `SectionBox`, Confirm/TableActions) into `@emporix/component-library` if MD and remotes both need them (follow CL migrate skill Pattern A/B).
3. Align playbook §5, `.cursor/rules/md-extension-migration.mdc`, and the extraction skill with this full Tier 1 UI list. **Done 2026-07-16** — lean InputField is SoT; FormField wording removed; Phase 3 MD wiring is a hard gate; see also `.cursor/hooks.json` validation hooks.

---

## Quick path index

```
users-and-groups/
├── src/RemoteComponent.tsx          # federation entry + provider stack
├── src/App.tsx                      # standalone
├── src/api/bootstrap.ts             # API credentials
├── src/components/shared/           # COPY ALL (Tier 1 UI)
├── src/context/                     # Dashboard, Config, Sites, UIBlocker, RefreshValues; slim Permissions
├── src/hooks/usePagination.tsx      # + useTabs, useCustomNavigate, useLocalizedValue
├── src/helpers/api*.ts              # + localized, settings, utils
├── src/models/AppState.model.ts     # + ApiError, Localized, Configuration, Site, SessionUser
└── src/translations/*/global.ts     # shared UI strings
```

When in doubt: **copy from users-and-groups, swap domain code, keep the shell.**
