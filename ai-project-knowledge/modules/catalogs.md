# Catalogs

Last scanned: COP-7180 (2026-11-12)
Sources: `catalogs/README.md`, `catalogs/package.json`, `catalogs/vite.config.ts`, `catalogs/src/RemoteComponent.tsx`, `catalogs/src/Catalogs.module.tsx`, `catalogs/src/constants/paths.ts`, `catalogs/src/models/Catalog.model.ts`, `catalogs/src/hooks/api/catalogs.ts`, `catalogs/src/hooks/useCatalogsTableColumns.tsx`, `catalogs/src/pages/Catalogs.page.tsx`, `catalogs/src/pages/Catalog.page.tsx`, `catalogs/src/components/catalogs/CatalogsTable.tsx`, `catalogs/src/components/shared/CategoriesSelector.tsx`, `catalogs/src/translations/`, `catalogs/src/**/*.test.ts(x)`, `docs/MIGRATED_MODULES.md`

Management Dashboard (MD) Management → Catalogs as a Vite federated remote, extracted in COP-7180 (`docs/MIGRATED_MODULES.md`). A catalog belongs to the Catalog Service; MD price lists (which stay in MD) pick catalogs and browse their categories. Federation name `catalogs`, exposes `./RemoteComponent` (named and default), local port `5185` with `strictPort` (`catalogs/vite.config.ts`). Tier 1 providers, shared UI and session code are copied from `units` (see `ai-project-knowledge/modules/units.md`); `TableExtensions`, `SidePanel` and `useTabs` from `labels`; `DateFilterTemplate` and `CategoriesSelector` (with `hooks/api/categories.ts`) from `coupons`.

## Record

`Catalog` (`catalogs/src/models/Catalog.model.ts`) is derived from the return type of `fetchCatalog`, because `@emporix/api-calls` does not export the model: `id`, `code`, localized `name` and `description`, `status` (`visible` / `not_visible`, set by the service), `publishedSites` (site codes), `categoryIds`, `visibility` (`visible`, `from`, `to`), `metadata`.

- New form: empty id, name, description, categories and sites; no dates; `visible` false (`createCatalogForm`).
- An empty stored date counts as no date; the form shows an empty picker.
- Create and update send the loaded catalog with the form values on top, so `code` and `metadata` go back as loaded; a date the form does not hold is left out of `visibility` (`toCatalogPayload`). A new catalog sends its id only when one was typed (trimmed); otherwise the service generates one.
- A name counts as given when at least one language value is not blank (`hasName`). MD marked the name required but did not enforce it.

Pinned by `catalogs/src/models/Catalog.model.test.ts`.

## API

`useCatalogsApi` (`catalogs/src/hooks/api/catalogs.ts`) binds the five api-calls functions to the host tenant: `fetchCatalogs` (sort, `pageSize` / `pageNumber`, and every column filter value as a query param named after its filter field), `fetchCatalog`, `createNewCatalog` (resolves to the new id), `modifyCatalog` (builds the PUT path from the body's id and deletes `status` from the object it receives, so the hook passes a copy), `removeCatalog`. The api-calls functions put the id into the URL path as is, so the hook URL-encodes it for get and delete; update sends the id unencoded, as MD did, because encoding it would also change the id stored in the body. The hash route `/:id` is encoded (`catalogs/src/constants/paths.ts`). Pinned by `Catalog.page.test.tsx` and `CatalogsTable.test.tsx`.

## Routes

Hash routes (`catalogs/src/constants/paths.ts`, `catalogs/src/RemoteComponent.tsx`): `/` list, `/add` create, `/:id` edit; other paths redirect to `/`. The edit page keeps MD's tab ids for `?tab=` deep links: `details`, `categories`, `published`, `validity`.

## Permissions

`Catalogs Viewer` can view; `Catalogs Manager` (`catalogs/src/configs/accessControls.ts`) is needed for Add new catalog, row delete, batch delete, saving column visibility, Save and Discard, and to change fields (they render disabled otherwise). As in MD, the categories selector shows nothing without `Categories Viewer` and cannot be changed without `Categories Manager`, and the sites picker is disabled without `Categories Viewer`. Permissions come from the remote's own `PermissionsProvider`.

## List

`CatalogsTable` (`catalogs/src/components/catalogs/CatalogsTable.tsx`, columns in `catalogs/src/hooks/useCatalogsTableColumns.tsx`) is lazy, as MD was: every page, sort, filter or tenant change or refresh loads one page from the service.

- Columns Visible (component-library `DotIndicator`, green for `status` `visible`; sortable), Catalog name (content language; sortable; contains filter on `name.<UI language>`, as MD), Published to (one site code, "N site(s)" for several, `-` for none; sortable; filter `publishedSite`), Visibility start, Visibility end, Last published (date and time) with date filters `visibilityFrom`, `visibilityTo`, `metadataUpdatedAt` (`DateFilterTemplate`, value `[fromISO, toISO]`).
- Column visibility is saved under the configuration key `ext_catalogs` with MD's column keys (`status`, `name`, `publishedTo`, `visibilityStart`, `visibilityEnd`, `lastPublished`). With no key saved as visible every column shows; otherwise only the visible ones (MD rule).
- Row actions (edit, delete) are the component-library `TableActions` through `catalogs/src/components/shared/TableActions.tsx`. Row click and row edit open `/:id`. A failed load shows an error toast and an empty table.
- Delete (row or batch) asks for confirmation, then deletes in parallel; a failed id gets an error toast naming it; the selection clears and the table reloads. A successful delete shows no toast (as MD).
- A host tenant switch clears the rows and the selection before the new tenant loads.

Pinned by `catalogs/src/components/catalogs/CatalogsTable.test.tsx`.

## Create and edit

`CatalogPage` (`catalogs/src/pages/Catalog.page.tsx`): header "Catalog" with the name (content language) as subtitle and a back button to the list; Discard and Save in the header; component-library `Tabs` with every panel kept mounted:

- Details — Id (tooltip; read-only on edit), Name (`LocalizedInput`, required), Description (`LocalizedInput`).
- Categories — `CategoriesSelector` (root and unpublished categories, through `PaginatedSelector`).
- Published — Sites: component-library `Dropdown` `multiple` `filter` over `SitesProvider` sites (names shown, codes stored), replacing MD's Prime `MultiSelect`.
- Visibility — From and To (`Calendar` with time; empty when the catalog has no date), a divider, and a Visible checkbox.

Rules:

- Save is enabled only for a dirty form with a name in one language.
- Create: toast "Successfully created catalog.", then the page switches to `/:id` of the returned id (replace).
- Update: toast "Successfully updated catalog.", reloads the catalog.
- A failed save shows "Something went wrong. Check form data or try later." with the service details; the form keeps the entered values. MD had no handler.
- A catalog that cannot be loaded shows "Catalog could not be loaded" and goes back to the list. MD used a key that existed in neither language.
- A host tenant switch on the add or edit page goes back to the list (as MD) without loading the old id from the new tenant.

Pinned by `catalogs/src/pages/Catalog.page.test.tsx`.

## Translations

`catalogs/src/translations/{en,de}/catalogs.ts` keep MD's `catalogs.*` keys, plus `edit.errors.fetching.title` and `toasts.error`, `toasts.errorFetch`, `toasts.errorDelete`. `global.ts` adds `searchBy`, `remove` and `toggleOptions` for the categories selector. EN and DE key parity and the absence of `primereact` are pinned by `catalogs/src/translations/translations.test.ts`.

## Host wiring

| Fact | Value |
|---|---|
| Kind | playbook-aligned |
| Federation `name` | `catalogs` (`catalogs/vite.config.ts`) |
| Host route `key` → path | `catalogs` → `/apps/management/catalogs/*` (`management-dashboard` `src/router/module-routes.tsx`; MD had built-in `catalogs`, `catalogsAdd`, `catalogsEdit` before COP-7180) |
| Host env var | `VITE_CATALOGS_URL` (`management-dashboard` `.env.*`) |
| Local port | `5185`, `strictPort` |
| Hosting | Firebase targets `emporix-catalogs`, `-stage`, `-develop`; `.github/workflows/catalogs-firebase-*.yaml` |
| Local deviations | none |

## Not yet scanned

- Tier 1 copies shared with `units` (providers, IAM hooks, shared UI) — see `ai-project-knowledge/modules/units.md`.
- `CategoriesSelector` internals (`PaginatedSelector` paging) — see `ai-project-knowledge/modules/coupons.md`.
