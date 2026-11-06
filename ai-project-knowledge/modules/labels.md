# Labels

Last scanned: 05d8d1d (2026-11-06)
Sources: `labels/README.md`, `labels/package.json`, `labels/vite.config.ts`, `labels/src/RemoteComponent.tsx`, `labels/src/Labels.module.tsx`, `labels/src/App.tsx`, `labels/src/main.tsx`, `labels/src/constants/paths.ts`, `labels/src/models/Label.model.ts`, `labels/src/models/Assets.model.ts`, `labels/src/api/labels.ts`, `labels/src/api/bootstrap.ts`, `labels/src/helpers/labels.helpers.ts`, `labels/src/helpers/media.helpers.ts`, `labels/src/helpers/settings.helpers.ts`, `labels/src/pages/Labels.page.tsx`, `labels/src/pages/Label.page.tsx`, `labels/src/components/labels/`, `labels/src/components/shared/MediaAssetUpload.tsx`, `labels/src/hooks/`, `labels/src/configs/accessControls.ts`, `labels/src/context/PermissionsProvider.tsx`, `labels/src/**/*.test.ts`, `docs/MIGRATED_MODULES.md`

Management Dashboard labels UI as a Vite federated remote, extracted in COP-7043 (`docs/MIGRATED_MODULES.md`). A label is a small tag with a name, rich-text description, optional image, and an overlay position. Federation name `labels`, exposes `./RemoteComponent`, local port `5179` with `strictPort` for dev and preview (`labels/vite.config.ts`). Shared singletons: `react`, `react-dom`, `react-router`, `react-i18next`. Standalone boot is `labels/src/main.tsx` → `labels/src/App.tsx`. Embedded boot is `labels/src/RemoteComponent.tsx`.

Same shape as `brands` (list, add/edit with Details and Media tabs). See `ai-project-knowledge/modules/brands.md` for the shared session, permission, and provider code, which is copied here. The differences are listed below. `labels/README.md` is the module template text (AppState table, `emporixApiUrl`); behaviour below follows `labels/src`.

## Record

`Label` (`labels/src/models/Label.model.ts`): required `id` and `name`; optional `description`, `image`, `cloudinaryUrl`, `overlay.position`, and `metadata` (`createdAt`, `modifiedAt`, `version`, `mixins`). The comment says the metadata shape mirrors `@emporix/api-calls`. Mixins are carried in the type only; no screen edits them.

`OverlayPositions` is a numeric enum: `NONE` 0, `TOP_LEFT` 1, `TOP_RIGHT` 2, `BOTTOM_LEFT` 3, `BOTTOM_RIGHT` 4. It says where the label sits on top of an image. What reads it (storefront, product screens) is unknown — not found in this repo.

Editable form fields are `name`, `description`, and `overlay.position` (`LabelFormFields`, `createLabelForm`). Missing name or description becomes `''`. Missing position stays `undefined`. `NONE` (0) is kept as a value, not treated as empty. `id`, `image`, and `cloudinaryUrl` are not form values (`labels/src/models/Label.model.test.ts`).

`name` is a plain string, not a locale map. No client rule for unique names, required image, or max length.

## Routes

Hash router (`labels/src/RemoteComponent.tsx`, `labels/src/constants/paths.ts`):

| Hash path | Screen |
|---|---|
| `/` | Label list (`Labels.page.tsx`) |
| `/add` | Create (`Label.page.tsx`, no `:id`) |
| `/:id` | Edit (`Label.page.tsx`) |
| anything else | `Navigate` to `/` |

`Labels.module.tsx` wraps the outlet in `RefreshValuesProvider`. The refresh value is a number that the list and the asset load both depend on.

Provider order in `RemoteComponent`: toast, dashboard, permissions, feature toggles, configuration, sites, UI blocker, hash router. UI copy exists for `en` and `de` (`labels/src/translations/`); `RemoteComponent` follows `appState.language`.

## Who can change labels

Screens call `hasPermission(EmployeeDomains.LABELS_MANAGER)` only (`Labels.page.tsx`, `LabelsTable.tsx`, `Label.page.tsx`). `LABELS_VIEWER` is never checked, so opening the list and a label is not gated in this remote. Whether the host hides the menu is unknown.

`LABELS_MANAGER` needs both access controls on the domain: the Labels Manager id and `CONFIGURATION_MANAGER` (`labels/src/configs/accessControls.ts`). `hasPermission` is true only when the user holds every access control of the domain (`labels/src/context/PermissionsProvider.tsx`). The static catalog-manager template includes Labels Manager (`labels/src/configs/accessControlsTemplates.tsx`). Without manage permission: Add, Save, Discard, batch delete, row delete, column settings, uploads, and asset delete are disabled; the name input is `disabled` and the description editor is `readOnly`.

While permissions load, children are replaced by `LoadingLayout`. Empty tenant or token clears all permission state and ends loading (`PermissionsProvider.tsx`). Access-control calls go through `useIamApi` (`labels/src/hooks/api/iam.ts`).

## List

`LabelsTable` calls `fetchLabelsPage(params, i18n.language)` (`labels/src/components/labels/LabelsTable.tsx`, `labels/src/api/labels.ts`). This is a local replacement for `fetchLabels` from `@emporix/api-calls`, which sends filters as raw query params the label service ignores. It does `GET label/labels` through the shared client with:

- Query: `pageNumber`, `pageSize`, optional `sort` as `field:ASC|DESC`, optional `q` (`labels/src/helpers/labels.helpers.ts`).
- Name search: trimmed, regex-escaped, sent as `q=name:~(<text>)`. Empty or cleared value sends no `q`.
- Headers: `x-total-count: true` to get the total from the response header (missing means 0), and `Accept-Language` set to the UI language. The comment says the client default `*` makes the service sort names by byte value (uppercase before lowercase).

Defaults (`labels/src/hooks/usePagination.tsx`): page 1, 10 rows, page sizes 10 / 25 / 50 / 100. The table passes no initial sort, so labels keep the API default order (comment in `LabelsTable.tsx`). The table is `lazy`. Refetch runs on refresh, page, rows, sort, filter JSON, UI language, or tenant change. A request tracker drops responses of superseded requests (`labels/src/helpers/api.ts`). Fetch failure toasts `labels.toasts.errorFetch` plus the API error details.

Columns (`labels/src/hooks/useLabelsTableColumns.tsx`): `image` (not sortable, no filter; `--` when no image) and `name` (sortable, filter `CONTAINS`). Column visibility is stored under configuration key `ext_labels`. No saved entries means all columns show. A saved entry decides its column, columns without an entry stay visible, and an all-hidden selection stays empty (`filterVisibleColumns`).

Row click and the edit action open `/${id}` with a `backTo` query; a row with no `id` does not navigate. The edit page ignores that query: Back always goes to `/` (`Label.page.tsx` passes a fixed `backTo`).

## Create and edit

Add and edit share `Label.page.tsx`. Calls come straight from `@emporix/api-calls`: `fetchLabel`, `createLabel`, `editLabel`.

- Edit loads the label on `id` or tenant change; stale responses are dropped. Failure toasts `errorFetch` and replace-navigates to `/`.
- Tabs are `details` and `media`; active tab is the hash query `tab` (`labels/src/hooks/useTabs.tsx`).
- Details: `name` (required text), `overlay.position` (dropdown with None, Top left, Top right, Bottom left, Bottom right), `description` (rich-text editor, required, stored as HTML).
- Save is disabled unless the form is dirty, valid, and the user can manage. Discard resets to the last loaded or saved values.
- Submit sends `{ ...label, ...data }`. An unset overlay position is sent as `{}`, as the old MD form did (comment in `Label.page.tsx`). On edit the fetched `id`, `image`, `cloudinaryUrl`, and `metadata` go back with the payload.
- Update success replaces local state, resets the form, toasts `successUpdate`, and stays on the page.
- Create success toasts `successCreate` and replace-navigates to `/${created.id}` when an id is returned.
- Failures toast `errorCreate` or `errorUpdate` plus `getApiErrorDetails`.

## Media

The media tab is visible but `disabled` until a label id exists. Assets load with `getAssetsForId(tenant, id)` from `@emporix/api-calls` (`labels/src/hooks/api/mediaAssets.ts`). A failed load sets assets to `[]` without a toast.

Upload (`MediaAssetUpload.tsx`) uses ref type `MediaRefIdType.LABEL` (`'LABEL'`), `multiple={false}`, access `PUBLIC`, and passes `assets[0]` as the current asset. A single-asset upload deletes the current asset first, then uploads; the delete step is covered by `labels/src/helpers/media.helpers.test.ts`. The viewer shows image files only. Whether an upload updates `label.image` on the label API is unknown; this UI does not patch `image`.

## Delete

Single and batch delete both call `deleteLabelWithImage(label)` (`labels/src/helpers/labels.helpers.ts`), kept from the MD behaviour:

1. If `label.image` is set, call `removeLabelImageFromCloudinary(image)`.
2. Call `deleteLabel(label)`.
3. If either step throws, log, then call `deleteLabel(label)` once more. The label is deleted even when the image removal failed. If that second delete fails, the error goes to the caller.

Batch delete walks labels one by one. A failure toasts `errorDelete` and continues. Labels that failed stay selected. The list refreshes after the loop. The table shows loading for the whole loop. The confirm box takes the entity from `deleteConfirm` (`TableActions`, `BatchDeleteButton`).

## States

| State | Where | Effect |
|---|---|---|
| Permissions loading | `PermissionsProvider` | Shell replaced until user AC, scope, and template calls settle |
| UI blocked | `UIBlockerProvider` | Overlay while `makeCall` or upload runs |
| Add | no `:id` | Empty form; media tab disabled |
| Edit | `:id` | Fetch label; subtitle is the label name; media enabled |
| Dirty / invalid | react-hook-form `onChange` | Save off until dirty and valid |
| No image | `LabelsTableImage` | Cell text `--` |
| No saved columns | `ext_labels` empty | All columns shown |
| Label fetch error | `Label.page` | Toast and replace-navigate to `/` |
| Asset load error | `Label.page` | `assets = []`, no toast |

## Host and standalone session

`AppState` (`labels/src/models/AppState.model.ts`): `tenant`, `language`, `token`, optional `currency`, `contentLanguage`, optional `user`, and `onError`. Defaults when omitted: tenant and token `default`, language `en`, `onError` no-op (`RemoteComponent.tsx`). `labels/README.md` also lists `emporixApiUrl`, which the model does not have.

The API client is created once; base URL comes from `VITE_API_URL` only and a missing value throws (`labels/src/api/bootstrap.ts`). Tenant and token are kept in sync from `appState`. Label screens never call `appState.onError`.

Standalone dev (`import.meta.env.DEV`, `App.tsx`): a settings dialog opens when stored tenant or token is blank. Save writes `tenant`, `language`, `token`, `contentLanguage` to `localStorage` (`labels/src/helpers/settings.helpers.ts`).

Feature toggles, sites, languages, and currencies load in the providers, but no label screen reads them. The host passes tenant switches without remounting, so loads depend on `tenant`.

Build scripts run `scripts/ensure-cors-origin.mjs` first (`labels/package.json`); CORS origins for dev, stage, prod admin and `localhost:4200` are in `labels/vite.config.ts`. `VITE_LABELS_URL` in the MD `.env.local-*` files must match port 5179 (comment in `vite.config.ts`).

## Dependencies

`@emporix/api-calls` 1.2.14 and `@emporix/component-library` 2.18.0 (`labels/package.json`). Calls used from api-calls: `fetchLabel`, `createLabel`, `editLabel`, `deleteLabel`, `removeLabelImageFromCloudinary`, `getAssetsForId`, `postFileAsset`, `delAsset`, `downloadAsset`, `fetchAsset`, `putAsset`, plus IAM, configuration, site, and feature-toggle calls through the hooks. Only the list call is local (`labels/src/api/labels.ts`).

## Tests

Names only (vitest, beside the source):

- `labels/src/models/Label.model.test.ts` — `createLabelForm`: empty add form; maps an existing label; keeps `NONE` overlay; empty-string fallbacks; omits `id`, `image`, `cloudinaryUrl`.
- `labels/src/api/labels.test.ts` — `fetchLabelsPage`: sends params, headers and UI language and reads the total; zero when the total header is missing.
- `labels/src/helpers/labels.helpers.test.ts` — `deleteLabelWithImage`: image removed before label; no image skips Cloudinary; still deletes when image removal fails; rejects after two failed deletes. `filterVisibleColumns`. `toLabelsQueryParams`: paging defaults, `ASC`/`DESC`, `q` search, regex escaping, empty search.
- `labels/src/helpers/media.helpers.test.ts` — file size sum; replace-asset delete step (none, deleted, delete failure stops).
- `labels/src/helpers/api.test.ts` — error status and detail extraction, conflict toast text, request tracker and `loadLatest` superseding.
- `labels/src/helpers/paginationUtils.test.ts`, `settings.helpers.test.ts`, `localized.test.ts` — shared helpers copied from `brands`.

No page, table, or provider specs.

## Host wiring

| Fact | Value |
|---|---|
| Kind | playbook-aligned (`labels/package.json`) |
| Federation `name` | `labels` (`labels/vite.config.ts`) |
| Host route `key` → path | `labels` → `/apps/management/labels/*` (`management-dashboard` `src/router/module-routes.tsx`) |
| Host env var | `VITE_LABELS_URL` (`management-dashboard` `.env.*`) |
| Local port | `5179`, `strictPort` |
| Local deviations | the list call is local (`src/api/labels.ts`) because the service ignores the filter params the api-calls `fetchLabels` sends |

## Not yet scanned

Skipped on purpose: `labels/node_modules`, `labels/dist`, `.env*`, lockfile, styles, translation bodies, `labels/.claude`, `labels/.cursor`, `labels/.github`. Not read in detail: `labels/scripts/`, shared components other than the upload (`SidePanel`, `FormGrid`, `HeaderSection`, `TableExtensions`), `labels/src/context/ConfigurationProvider.tsx`, `SitesProvider.tsx`, `FeatureTogglesProvider.tsx`.
