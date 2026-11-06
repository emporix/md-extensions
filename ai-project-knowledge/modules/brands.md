# Brands

Last scanned: da99643 (2026-11-02)
Sources: `brands/...`

Management Dashboard brands UI as a Vite federated remote. Federation name `brands`, exposes `./RemoteComponent`, local port `5175` with `strictPort` (`brands/vite.config.ts`). Standalone boot is `brands/src/main.tsx` → `brands/src/App.tsx`. Embedded boot is `brands/src/RemoteComponent.tsx`.

`brands/README.md` still describes the module template (PrimeReact, `ExtensionProvider`, `useExtensionContext`, `emporixApiUrl`). Those names are not in `brands/src/models/AppState.model.ts` or `brands/src/RemoteComponent.tsx`. Behaviour below follows `brands/src`.

## Record

`Brand` (`brands/src/models/Brand.model.ts`): optional `id`, `name`, `description`, `image`, `cloudinaryUrl`, and `metadata` (`createdAt`, `modifiedAt`, `version` required when `metadata` is present). The comment says that metadata shape matches `@emporix/api-calls` so a brand can be passed into those calls. Whether the API uses `version` for conflicts is unknown (not in this repo).

Editable form fields are only `name` and `description` (`BrandFormFields`, `createBrandForm`). Missing name or description becomes `''`. `id`, `image`, and `cloudinaryUrl` are not form values (`brands/src/models/Brand.model.test.ts`).

`name` is a plain string, not a locale map. Delete confirmation still runs it through `getContentLangValue`, which returns a string unchanged (`brands/src/components/shared/DeleteConfirmBox.tsx`, `brands/src/hooks/useLocalizedValue.tsx`).

No client rule for unique names, required image, or max length. `brands/src/pages/Brand.page.tsx` requires non-empty `name` and `description` only.

## Routes

Hash router (`brands/src/RemoteComponent.tsx`, `brands/src/constants/paths.ts`):

| Hash path | Screen |
|---|---|
| `/` | Brand list (`Brands.page.tsx`) |
| `/add` | Create (`Brand.page.tsx`, no `:id`) |
| `/:id` | Edit (`Brand.page.tsx`) |
| anything else | `Navigate` to `/` |

`Brands.module.tsx` only wraps the outlet in `RefreshValuesProvider`. `setRefreshValue` stores `Date.now()` (`brands/src/context/RefreshValuesProvider.tsx`). List reload and asset reload both depend on that number.

UI copy exists for `en` and `de`. Init language and fallback are `en`. Interpolation does not escape (`brands/src/translations/i18n.ts`). `RemoteComponent` calls `i18n.changeLanguage(appState.language)` when host language changes.

## Who can change brands

Screens call `hasPermission(EmployeeDomains.BRANDS_MANAGER)` only (`Brands.page.tsx`, `BrandsTable.tsx`, `Brand.page.tsx`). They never call `BRANDS_VIEWER`. Opening the list and a brand is not gated inside this remote. Whether the host hides the menu is unknown.

`BRANDS_MANAGER` is granted only when the user has every access control on that domain (`brands/src/context/PermissionsProvider.tsx`, `brands/src/helpers/accessControls.ts`). The domain lists two ids (`brands/src/configs/accessControls.ts`):

- `AccessControlsForEmployee.BRANDS_MANAGER` = `4ac869fc-d548-4ec8-8e06-c0149131411`
- `AccessControlsForEmployee.CONFIGURATION_MANAGER` = `4ac869fc-d548-4ec8-8e06-c01491314117`

`BRANDS_VIEWER` is `1ac869fc-d548-4ec8-8e06-c01491314206` and is the only id on `EmployeeDomains.BRANDS_VIEWER`. There is no Brands Editor or Brands Administrator domain. `expandWithImpliedViewerAcs` still adds viewer ids when the user already satisfies Manager for the same base name (`brands/src/helpers/accessControls.ts`). That does not change these screens, because they do not check the viewer domain.

The static catalog-manager template includes `BRANDS_MANAGER` (`brands/src/configs/accessControlsTemplates.tsx`). Brand screens do not assign templates.

While permissions load, children are replaced by `LoadingLayout` (`PermissionsProvider.tsx`). Load order: user access controls, then scopes (splits the scope string on spaces and stores `vendorId`), then templates. Tenant access controls load only if `hasPermission(ACCESS_CONTROLS_VIEWER)` afterwards. Empty tenant or token skips the fetch and ends loading. Failures toast (scopes/user ACs) or `console.error` (templates) and leave the corresponding lists empty, so `hasPermission` stays false.

`useIamApi` (`brands/src/hooks/api/iam.ts`) also exposes group, user, scope, and access-control writes. Brand screens do not call those.

## List

`BrandsTable` loads with `fetchBrands(toApiPagination(params))` (`brands/src/components/brands/BrandsTable.tsx`). `toApiPagination` returns the pagination object unchanged (`brands/src/helpers/apiPagination.ts`). Query syntax inside `@emporix/api-calls` is unknown.

Defaults (`brands/src/hooks/usePagination.tsx`): page 1, 10 rows, `sortOrder` `-1`, `sortField` undefined, page sizes 10 / 25 / 50 / 100. The table is `lazy`. Refetch runs when refresh, page, rows, sort field, sort order, or the JSON of filters changes.

Columns (`brands/src/hooks/useBrandsTableColumns.tsx`):

- `image` — not sortable, no filter. `BrandsTableImage` shows `brand.image`, or `--` when absent (`brands/src/components/brands/BrandsTableImage.tsx`). Alt text is `brand.name` or `''`.
- `name` — sortable, filter match mode `CONTAINS`.

Empty filter strings become `null`. If every filter value is `null` or `undefined`, filters are cleared and page returns to 1. A new sort field starts at order `1`; the same field cycles `1` → `-1` → cleared. UI language or `contentLanguage` change resets pagination to the defaults (not on first mount). Only `page` and `rows` are written back to the hash query.

Column visibility is stored under configuration key `ext_brands` (`BrandsTable.tsx`, `brands/src/models/Configuration.model.ts`). No saved columns means show every column. A saved list shows columns whose `field` is in the visible keys. Mixin columns are unused and kept only so a saved document can round-trip. Save goes through `updateSingleConfiguration` (`brands/src/context/ConfigurationProvider.tsx`) and then reloads basic configuration. The 404-then-create path in `brands/src/hooks/api/configuration.ts` is not used for this save. Toggles and Save are disabled without `BRANDS_MANAGER` (`brands/src/components/shared/TableExtensions.tsx`). The open button is not permission-gated.

Row click and the edit action open `/${id}` and set query `backTo` to the current path plus search (`BrandsTable.tsx`). A row with no `id` does not navigate. The edit action is not disabled when the user cannot manage (`brands/src/components/shared/TableActions.tsx`). Delete is disabled unless `managerPermission` is true.

Add stays visible and is disabled without manage permission (`Brands.page.tsx`). Empty table copy is `brands.noBrands`. There is no separate empty-state action in the table component.

Multi-select is always on. Batch delete is disabled when nothing is selected or the user cannot manage (`brands/src/components/shared/BatchDeleteButton.tsx`). Delete walks brands one by one (`deleteBrand(brand)`). A failure toasts and continues. Brands that fail stay selected. The list refresh runs after the loop either way. One success toast per deleted brand includes `brand.name`.

## Create and edit

Add (`/add`) and edit (`/:id`) share `Brand.page.tsx`.

- Edit loads `fetchBrand(id)` inside `makeCall`, which sets the UI blocker true for the call and clears it in `finally` (`brands/src/helpers/api.ts`, `brands/src/context/UIBlcoker.tsx`). Failure toasts `brands.toasts.errorFetch` and `navigate(listPath(), { replace: true })`.
- The brand record is not reloaded when `refresh` changes. Assets are.
- Header subtitle is `brand.name` only when `:id` is present.
- Back always calls `navigate('/')`. `HeaderSection` reads a `backTo` query only when the `backTo` prop is not a function (`brands/src/components/shared/HeaderSection.tsx`), so the query written by the table is ignored.
- Tabs are `details` then `media` (`brands/src/hooks/useTabs.tsx`). Active tab is hash query `tab`. Missing or unknown `tab` selects `details` and does not write the query. A user tab change writes `tab` and, when the tab actually changes, resets `page` to 1 and `rows` to 10.
- Details: `name` (`InputText`) and `description` (`Editor`). Description stores `event.htmlValue ?? ''`. No sanitization in this page. Both are `required`. Without manage permission the name input is `disabled` and the editor is `readOnly`.
- Save is disabled unless the form is dirty, valid, and the user can manage. Discard is disabled unless dirty and the user can manage. Discard calls `reset()` to the last `createBrandForm` values (empty on add, last fetched or saved brand on edit).
- Submit builds `{ ...brand, ...data }`. On edit, fetched `id`, `image`, `cloudinaryUrl`, and `metadata` are sent again with the new name and description (`editBrand`). On add, `brand` is still unset, so the payload is only `name` and `description` (`createBrand`). This page never writes `image` or `cloudinaryUrl`.
- Update success replaces local brand, resets the form, toasts `successUpdate`, and stays on the page.
- Create success toasts `successCreate`. If `created.id` is set, it `replace`-navigates to `/${created.id}`. If `created.id` is missing, it stays on `/add`.
- Save and load failures toast `errorCreate`, `errorUpdate`, or `errorFetch` plus `getApiErrorDetails` (response `details`, else `message`). `getConflictErrorToast` is not used. `ApiError` (`brands/src/models/ApiError.model.ts`) is not constructed by these screens.

## Media

The media tab stays visible and is `disabled` until a brand id exists (`Brand.page.tsx`). Assets are loaded with `getAllAssetsForId(id)` (`brands/src/hooks/api/mediaAssets.ts` → `getAssetsForId`). A failed load sets assets to `[]` and does not toast. The comment says the details tab should stay usable.

Upload (`brands/src/components/shared/MediaAssetUpload.tsx`) is called with `type` `MediaRefIdType.BRAND`, `multiple={false}`, and `currentAsset` equal to `assets[0]` when the list is non-empty. Accept is `image/*`. Default access is `MediaAccess.PUBLIC`. The file control is `disabled` without manage permission.

Single-asset upload deletes `currentAsset` first, then uploads. If that delete fails, it toasts and still uploads. Upload sends ref `{ id, type: BRAND }`. Success and failure both clear the picker and call `refresh`. Whether a new asset updates `brand.image` on the brand API is unknown; this UI does not patch `image`.

`AssetsViewer` (`brands/src/components/shared/AssetsViewer.tsx`) is not passed `showAllMediaTypes`, so only names that `isImageFile` accepts are shown: `.png`, `.jpg`, `.jpeg`, `.gif`, `.bmp`, `.webp`, `.svg` (`brands/src/helpers/media.helpers.ts`). Other assets stay in state and are hidden. Checkboxes and delete require manage permission. Download does not. Delete runs `Promise.all` on the selection, then always clears the selection and refreshes. Opening a tile sets `window.location` to `/media-assets/${assetId}` (host route, outside this hash router).

If more than one image is already stored, the next upload deletes only `assets[0]`.

## States

| State | Where | Effect |
|---|---|---|
| Permissions loading | `PermissionsProvider` | Shell replaced until user AC, scope, and template calls settle |
| UI blocked | `UIBlockerProvider` | Overlay plus spinner while `makeCall` or asset upload runs |
| List loading | `BrandsTable` | Table `loading` during fetch; also forced true for the whole delete loop |
| Deleting | `BrandsTable` / `BatchDeleteButton` | Confirm box `loading`; batch button stays clickable only via the confirm |
| Add | no `:id` | Empty form; media tab disabled; create payload is name + description |
| Edit | `:id` | Fetch brand; subtitle is name; media enabled |
| Dirty / invalid | react-hook-form `onChange` | Save off until dirty and valid; both also off without manage permission |
| No image | `BrandsTableImage` | Cell text `--` |
| No saved columns | `fetchVisibleColumns` length 0 | All columns shown |
| Asset load error | `Brand.page` | `assets = []`, no toast |
| Brand fetch error | `Brand.page` | Toast and replace-navigate to `/` |
| List fetch error | `BrandsTable` | Toast; previous rows are left as they were (initial value `[]`) |

## Host and standalone session

`AppState` (`brands/src/models/AppState.model.ts`): `tenant`, `language`, `token`, optional `currency`, `contentLanguage`, optional `user` (`userId`, optional name and email, `termsAndConditions`), and `onError`. No `emporixApiUrl`.

`RemoteComponent` defaults, if `appState` is omitted: tenant `default`, token `default`, language and content language `en`, `onError` no-op. It syncs the API client from tenant and token (`brands/src/api/bootstrap.ts`). The client is created once. Base URL is `import.meta.env.VITE_API_URL` only. A missing or empty URL throws `VITE_API_URL is not configured`. Brand screens never call `appState.onError`. `user` is never read. `currency` is only a fallback for `currentCurrency` in `ConfigurationProvider`; brand screens do not read it. `contentLanguage` retriggers `fetchBasicConfiguration` and is the locale key for localized values. Brand name does not use it.

Standalone dev (`import.meta.env.DEV`, `App.tsx`): a dialog opens when stored tenant or token is blank or whitespace (`brands/src/helpers/settings.helpers.ts`). Save writes `tenant`, `language`, `token`, and `contentLanguage` (set equal to the language field) to `localStorage`. `onError` logs to the console.

Provider order in `RemoteComponent`: toast, dashboard, permissions, feature toggles, configuration, sites, UI blocker, hash router.

`FeatureTogglesProvider` loads every toggle (page size 1000, `fetchAllRecords` retries 3 times with delay `1000 * attempt`, `brands/src/helpers/paginationUtils.ts`). `isToggleValid` is true only when an entry with that `code` has `isEnabled`. No brand screen calls `useFeatureToggles`.

`SitesProvider` loads sites when `token` is set, picks `site.default` or else the first site (`brands/src/api/sites.ts`, `brands/src/context/SitesProvider.tsx`). The effect has no catch. No brand screen calls `useSites`. `Site` (`brands/src/models/Site.model.ts`) is unused by brand pages.

`ConfigurationProvider` loads languages and currencies via `fetchBasicConfiguration`. Brand forms do not offer a language or currency field.

## Tests

No page or table specs. Names only:

- `brands/src/models/Brand.model.test.ts` — `createBrandForm`: empty add form; maps name and description; missing fields become `''`; omits `id`, `image`, `cloudinaryUrl`.
- `brands/src/helpers/api.test.ts` — HTTP status, IAM `message` / `details` / `resourceId`, validation `details[].message`, `getConflictErrorToast` title and body. Brand screens use `getApiErrorDetails` only.
- `brands/src/helpers/paginationUtils.test.ts` — `fetchAllRecords` aggregates pages, stops on an empty page, throws after max retries. Used by feature toggles and the IAM “get all” helpers, not by `fetchBrands`.
- `brands/src/helpers/settings.helpers.test.ts` — stored settings, dev dialog when tenant or token is missing or whitespace, save writes keys and does not mutate the input.
- `brands/src/helpers/localized.test.ts` — `localizedKeysToLowerCase`. Not referenced by brand pages.

## Host wiring

| Fact | Value |
|---|---|
| Kind | playbook-aligned (`brands/package.json`) |
| Federation `name` | `brands` (`brands/vite.config.ts`) |
| Host route `key` → path | `brands` → `/apps/management/brands/*` (inline `ExternalModule moduleName="brands"`) (`management-dashboard` `src/router/module-routes.tsx`) |
| Host env var | `VITE_BRANDS_URL` (`management-dashboard` `.env.*`) |
| Local port | `5175`, `strictPort` |
| Local deviations | none |

## Not yet scanned

Skipped on purpose: `brands/node_modules`, `brands/dist`, `brands/.env*`, `brands/src/**/*.scss`, `brands/src/index.css`, translation string bodies under `brands/src/translations/`, and the generated assistant trees `brands/.github/`, `brands/.claude/`, `brands/.cursor/`.

Not read: `brands/package.json`, `brands/package-lock.json`, `brands/scripts/`, `brands/tsconfig*.json`, `brands/src/vite-env.d.ts`, `brands/src/helpers/date.ts`, `brands/src/helpers/utils.ts`, `brands/src/helpers/localized.ts` (tests only), `brands/src/helpers/props.ts`. Shared components with no brand-screen behaviour beyond the files cited above: `EmptyContent`, `EmptyTable`, `FormGrid`, `FormGridRow`, `LoadingLayout`, `LocalizedInput`, `DateValue`, `DropdownFilter`, `SidePanel`. Models read only far enough to see they are not brand-form fields: `Groups.model.ts`, `User.model.ts`, `Mixins.model.ts`, `Metadata.model.ts`, `Localized.model.ts`, `AccessControl.model.ts`, `Settings.model.ts`.
