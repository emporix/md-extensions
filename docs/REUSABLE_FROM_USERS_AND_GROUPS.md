# Reusable pieces from migrated remotes — agent guide

**Audience:** Cursor / Copilot / Claude agents (and humans) extracting the next Management Dashboard module into `md-extensions`.

**Filename note:** Kept as `REUSABLE_FROM_USERS_AND_GROUPS.md` for stable links; content covers **all** playbook-aligned remotes, not only U&G.

**Migrated modules registry (update every migration):** [MIGRATED_MODULES.md](./MIGRATED_MODULES.md)  
**Tier 1 sources:** every **playbook-aligned** remote in that registry (newest first when they diverge) — do **not** depend on U&G alone.  
**Starter clone:** [md-module-template](https://github.com/emporix/md-module-template) branch **`md-module-migration`** (absorb into monorepo — playbook §1).  
**Full workflow:** [MODULE_MIGRATION_PLAYBOOK.md](./MODULE_MIGRATION_PLAYBOOK.md)  
**PrimeReact → CL lookup:** [CL_WIDGET_STATUS.md](./CL_WIDGET_STATUS.md)  
**Skill (canonical):** `md-extensions/.cursor/skills/md-module-extraction/SKILL.md`  
**Host wiring:** `management-dashboard/.cursor/rules/federated-module-wiring.mdc`

> Prefer playbook-aligned remotes (see registry) over `md-extensions/products` for Tier 1. Start the folder from template `@ md-module-migration`, not template `master`.

---

## How to use this doc

1. Read the [playbook](./MODULE_MIGRATION_PLAYBOOK.md) for federation contract, MD wiring, QA, and cleanup.
2. Check [MIGRATED_MODULES.md](./MIGRATED_MODULES.md) for which remotes are Tier 1 sources and any deltas since U&G.
3. Use **this file** as the copy inventory: what to take from prior remotes, what to adapt, what to skip.
4. Look up every MD `primereact` import in [CL_WIDGET_STATUS.md](./CL_WIDGET_STATUS.md) before rewriting UI.
5. For the step-by-step workflow, follow the **skill** (`.cursor/skills/md-module-extraction/SKILL.md`).
6. After the migration: update the registry, refresh this inventory if needed, append 1–3 playbook decisions-log rows, and move rows in `CL_WIDGET_STATUS.md` if you promoted a widget.

**Default strategy:** copy Tier 1 from the **best/newest playbook-aligned remote** that has the piece (often U&G; check `customer-groups` and later remotes for CL-adopted shells). Prefer `@emporix/component-library` when it already exports the component. Do **not** invent a shared package unless several modules already diverge from copy-paste.

Paths below are relative to a playbook-aligned remote (historically `users-and-groups/`) unless noted. When a later remote improved a shell (e.g. dropped local ConfirmBox for CL), prefer that pattern.

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

| Component | File | Role |
|-----------|------|------|
| `HeaderSection` | `HeaderSection.tsx` | Page title, back, actions |
| `BackButton` | Prefer CL ≥ 2.2.0 — **import directly** | Used by HeaderSection |
| `SectionBox` | Prefer CL ≥ 2.3.0 — **import directly** | Named section panel (do not copy locally; `brands` dropped its copy). **`EmptyTable.tsx` still imports `./SectionBox` — patch that import to CL when you copy it**, otherwise "copy Tier 1 verbatim" and "never copy SectionBox locally" contradict each other. |
| `FormGrid` | `FormGrid.tsx` | Form layout |
| `FormGridRow` | `FormGridRow.tsx` | Form row |
| `EmptyContent` | `EmptyContent.tsx` | Empty state + optional CTA |
| `EmptyTable` | `EmptyTable.tsx` | SectionBox + EmptyContent |
| `ConfirmBox` | Prefer CL ≥ 2.2.0 — **import directly** | Generic confirm dialog |
| `DeleteConfirmBox` | Local OK if it centralizes `t('global.deleteConfirm.*')`; else compose CL ConfirmBox at call site | Plural delete confirm |
| `DateValue` | Prefer CL ≥ 2.2.0 — **import directly** | Formatted dates |
| `TableActions` | `TableActions.tsx` | Row edit/delete + overflow menu |
| `BatchDeleteButton` | `BatchDeleteButton.tsx` | Bulk delete + confirm |
| `LoadingLayout` | `LoadingLayout.tsx` | Full-area spinner — prefer CL `ProgressSpinner` inside (no extra spinner wrapper) |
| Lean `InputField` | `InputField.tsx` | Label/error/tooltip wrapper — **not** MD's ProductData-coupled InputField |
| `DropdownFilter` | `DropdownFilter.tsx` | DataTable column filter → CL Dropdown |
| `LocalizedInput` | `LocalizedInput.tsx` | **Required thin wrapper** — injects languages + i18n toggle labels into context-free CL |
| `DotIndicator` | `DotIndicator.tsx` | Boolean status dot (optional; prefer CSS Modules if you touch it) |
| `TableExtensions` | `brands/src/components/shared/TableExtensions.tsx` (then `returns` for mixin columns) | Column visibility persisted per config key. Needs the `ConfigurationProvider` table-config surface from `brands`. Copy sibling `SidePanel` (CL has no Sidebar). Toggles are CL `InputSwitch` (CL ≥ 2.5.0). Current widget status: [CL_WIDGET_STATUS.md](./CL_WIDGET_STATUS.md). |
| `SidePanel` | `brands/src/components/shared/SidePanel.tsx` or `returns/...` | Right-side drawer standing in for PrimeReact `Sidebar`. Required by `TableExtensions`. |
| `AssetsViewer` / `MediaAssetUpload` | `brands/src/components/shared/` | Media grid + upload on CL `FileUpload`/`ProgressBar` (CL ≥ 2.4.0). Asset tiles need a host route — see the `brands` row in the registry. |

Also copy matching `*.module.scss` / `*.scss` next to each component.

### Copying Tier 1 is not verbatim — fix these every time

A second independent run of the Brands migration (Aug 2026) hit all of these:

- **`EmptyTable.tsx`** imports `./SectionBox` — repoint at CL (above).
- **`AssetsViewer.tsx` / `MediaAssetUpload.tsx`** carry MD global CSS variables (`--grey-*`, `--blue-*`, `var(--red)`) — i.e. the copy sources violate the anti-pattern grep in `reference.md`. Map them to CL tokens (see `component-library` `styling` rule; `src/styles/index.scss` is the token source of truth) or a local SCSS variable.
- **`global.ts` is not a complete set.** Copied shells reference keys it lacks (`global.toasts.errorUploadAssets`, `global.fieldRequired`, `global.tableExtensions.*`, `global.more`, `global.action`). Grep the shells you copied for `t('global.` and add every missing key to **both** locales.
- **Ported shared components carry another module's i18n namespace.** `AssetsViewer`/`MediaAssetUpload` read `categories.media.*` — keys owned by MD's Categories module. Re-home them under **your module's** namespace (`{module}.media.*`), not a new top-level one, so the remote owns all its keys.
- **`global` keys the copied shells need, with the names to use** (invent nothing — a re-run guessed `global.tableExtensions.title` where the shipped remotes use `columns`):

  ```
  global.fieldRequired
  global.tableExtensions.columns      global.tableExtensions.saveError
  global.toasts.errorUploadAssets
  global.more                          global.action
  ```

### Copy what the module uses, not the whole table

Tier 1 is a menu, not a mandate. Skip shells the module genuinely has no use for — a Brands-style module needs no `DateValue` (renders no dates), and the lean `InputField` is redundant once you use CL `InputText` / `Editor`, which already render `FieldLabel` themselves. Copying them anyway leaves dead files that the next reader assumes are load-bearing. Conversely, do not skip a **provider** on the same reasoning (see playbook §4).

### Forms: use `react-hook-form`

**Do not port MD's `hooks/useForm.ts`.** It is coupled to `NavigationConfirmProvider`, is absent from every aligned remote, and is not in this inventory — a verification run wasted effort hand-reconstructing it from call sites. `customer-groups` and `brands` both use **`react-hook-form`** (already a dependency): `useForm` + `Controller` for field wiring, `formState.isDirty` / `isValid` for save/discard enablement, `reset(mapEntityToForm(entity))` after load and after save.

### Page and file naming

Follow the aligned remotes so diffs stay comparable: `pages/{Entity}.page.tsx` for a detail/edit screen and `pages/{Entities}.page.tsx` for a list (e.g. `Brand.page.tsx`, `Brands.page.tsx`) — **not** `BrandAddEdit.page.tsx` / `BrandsList.page.tsx`. Table components live in `components/{module}/{Entities}Table.tsx`, and column definitions in `hooks/use{Entities}TableColumns.tsx`.

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

API hooks: copy the **pattern** from `src/hooks/api/` (wrap `@emporix/api-calls` with `useDashboardContext().tenant`). Replace call sets with the new module's APIs.

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

Leave behind unless you are extracting the **same** IAM/users/groups domain **or** deriving a scoped groups remote (see playbook §11 / `customer-groups`):

- `src/components/group/**`
- `src/components/user/**`
- `src/components/usersAndGroups/**`
- `src/context/Group.provider.tsx`, `GroupRole.provider.tsx`
- `src/hooks/api/iam.ts` **contents** (pattern OK; calls are domain-specific — **keep** when member tables remain)
- `src/helpers/accessControls.ts`
- `src/helpers/groups/**`, `src/helpers/users/**`
- `src/hooks/useUsersTableColumns.tsx`, `useGroupsTableColumns.tsx`, `useDomainsColumns.tsx`, `useDomainsExpansionColumns.tsx` — **keep** column hooks if group members UI stays
- `src/translations/*/usersAndGroups.ts` — rename/slim for the new remote; do not leave employee-only strings if unused
- Domain models: `User`, `Groups`, `Permissions`, `AccessControl`, `Vendor` (unless needed — `User` + `Groups` stay for member tables)

Empty placeholder: `src/components/data-table/` — ignore.

### Derived remotes exception (customer-groups pattern)

When the ticket **is** extracting groups (or a subtype):

1. Copy group Tier 3 from U&G, then delete **leaf** user screens only.
2. Keep `User.model`, `useUsersTableColumns`, `hooks/api/iam.ts`.
3. Re-diff MD for the target `GroupUserTypes` (restore customer Company field, etc.).
4. Drop `employee` (and other) entries from `entityLinkConfig` when those routes do not exist in the remote.

---

## Optional later (after 2–3 more modules)

Not required for the next extraction:

1. Extract Tier 1 into `md-extensions/shared/` or an internal package to stop copy-paste drift.
2. Promote stable shells (`HeaderSection`, `SectionBox`, Confirm/TableActions) into `@emporix/component-library` if MD and remotes both need them (follow CL migrate skill Pattern A/B). **During each extraction:** if a shared piece already exists in a prior remote, **ask the user** whether to promote now (playbook §5 / skill Phase 1).

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

When in doubt: **check [MIGRATED_MODULES.md](./MIGRATED_MODULES.md), copy from the best playbook-aligned remote, swap domain code, keep the shell.**
