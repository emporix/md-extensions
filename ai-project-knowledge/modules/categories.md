# Categories

Last scanned: c51b985 (2026-11-14)
Sources: `categories/README.md`, `categories/package.json`, `categories/vite.config.ts`, `categories/src/RemoteComponent.tsx`, `categories/src/Categories.module.tsx`, `categories/src/constants/paths.ts`, `categories/src/models/Category.model.ts`, `categories/src/configs/accessControls.ts`, `categories/src/hooks/api/{categories,categoryTree,categoryTreeRebuild,mediaAssets}.ts`, `categories/src/hooks/useCategoriesColumns.tsx`, `categories/src/hooks/useCategoriesTableConfig.ts`, `categories/src/hooks/useCategoryMedia.ts`, `categories/src/helpers/{categoriesTable,categoryForm}.helpers.ts`, `categories/src/helpers/hostUrls.ts`, `categories/src/context/Category.provider.tsx`, `categories/src/pages/`, `categories/src/components/categories/`, `categories/src/components/categoriesTree/`, `categories/src/components/shared/CategoriesSelector.tsx`, `categories/src/translations/`, `categories/src/**/*.test.ts(x)`, `docs/MIGRATED_MODULES.md`

Management Dashboard (MD) Management → Categories as a Vite federated remote, extracted in COP-7181 (epic COP-5597). A category of the Category Service has an id, a code, a localized name, slug and description, ECNs, a parent and a position among its siblings, a validity, a published flag, media and mixins. Federation name `categories`, exposes `./RemoteComponent` (named and default), local port `5184` with `strictPort` (`categories/vite.config.ts`). Only **standard** categories are handled here; Classifications (and every other MD screen with a category selector or tree: Products Browser, price lists, catalogs, segments, media, mixin selectors) stay in MD. Needs component library 2.28.0: `Tree` drag and drop, `AssetsViewer`, `MediaAssetUpload` and `TableExtensions` come from it (`docs/CL_WIDGET_STATUS.md`).

## Records

`categories/src/models/Category.model.ts` (MD shapes; `CategoryType` is re-exported from `@emporix/api-calls`):

- **Category**: `id`, optional `parentId`, `code`, `localizedName`, `localizedSlug`, `localizedDescription`, `ecn` (string list), `position`, `validity` (`from`, `to`), `published`, `index` / `navigation` flags, `mixins`, `metadata` (`version`, `mixins` schema URLs), `type`.
- **Category tree** (`/category-trees` node): `id`, `parentId`, `code`, the three localized fields, `validity`, `position`, `published`, `ecn`, `subcategories`. It carries no `metadata.version`.

Form rules (`helpers/categoryForm.helpers.ts`):

- New form: empty id and code, no ECNs, no position, no validity dates, unpublished (`createCategoryForm`).
- Save payload (`mapCategoryFormToPayload`): an update puts the form on top of the loaded category (the PUT replaces the whole category); a create starts from `navigation: false`, `index: false`. A blank id is left out so the service generates one; a code is sent on update, or on create when given. An empty parent becomes `undefined` (top level). A position is sent only when set. Empty validity dates are dropped.
- Validity type (`getCategoryValidityType`): unpublished reads as *never*, published with a date as *custom*, otherwise *always*. Choosing *always* clears both dates.
- The localized name is required (at least one language value, `hasLocalizedValue`).

Pinned by `helpers/categoryForm.helpers.test.ts`.

## API

All bound to the host tenant (`useDashboardContext`):

- `useCategoriesApi` (`hooks/api/categories.ts`): `getCategories` (paged; type, `showRoots`, `showUnpublished`), `fetchCategory`, `createNewCategory` (returns the id), `modifyCategory` (PUT), `patchCategoryCall` (PATCH), `deleteSingleCategory` (with subcategories by default), `getSubcategoriesCall`, `getCategoryParentsCall`. MD's product-assignment calls were dropped.
- `useCategoryTreeApi` (`hooks/api/categoryTree.ts`): `getCategoryTreesCall` (its `type` filter needs backend change COP-6124), `rebuildCategoryTreeCall`, `getCategoryParentsCall` with unpublished ancestors.
- `useCategoryTreeRebuild` (`hooks/api/categoryTreeRebuild.ts`): `/category-trees` is cached per **root** category, so every change rebuilds the affected roots. `resolveRoots` takes the first parent of each category (a 404 from `/parents` means the category is a root); `rebuildRoots` ignores roots that answer 404 (deleted meanwhile); `rebuildForCategories` does both.
- `useMediaAssets` (`hooks/api/mediaAssets.ts`): `getAssetsForId`, `postFileAsset`, `delAsset`, `downloadAsset` (plus `fetchAsset`, `putAsset`, unused by the media tab).
- Table settings: `updateSingleConfiguration` through `context/ConfigurationProvider.tsx`.

## Routes

Hash routes (`categories/src/constants/paths.ts`, `categories/src/RemoteComponent.tsx`); ids are URL-encoded:

| Path | Page |
|---|---|
| `/` (`?view=list`, default) | `pages/CategoriesList.page.tsx` → `CategoriesTable` list |
| `/?view=tree` (`&categoryId=<id>`) | `CategoriesList.page.tsx` → `CategoriesTree`; `categoryId` is the selected category |
| `/add` (case-sensitive) | `pages/CategoryAddEdit.route.tsx` → `CategoryAddEdit.page.tsx` |
| `/:categoryId` (`?tab=`, `?backTo=`) | same page, edit |

Other paths redirect to `/`. `CategoryAddEditRoute` keys `CategoryDataProvider` by `categoryId`, so create → edit remounts with fresh form state. `ReferenceOptionsProvider` is mounted (as in `orders` / `companies`) for custom-entity mixin references. Category references inside mixins stay in the remote; media assets, products, orders, companies, customers, carts, price lists, segments and custom instances are host or other-remote links opened with `window.location.assign` (`helpers/hostUrls.ts`).

## Permissions

`Categories Viewer` and `Categories Manager` (`configs/accessControls.ts`) bundle `MEDIA_VIEWER` / `MEDIA_MANAGER` access controls, as in MD; the remote loads them in its own `PermissionsProvider`. Without Categories Manager: Add New Category, row and batch delete, table settings, Save and Discard, tree drag and drop, the tree panel's save and delete, and media upload and delete are disabled, and every field is read-only. Without Categories Viewer the tree shows the "no permissions" text instead of loading.

## List

`components/categories/CategoriesTable.tsx`, columns in `hooks/useCategoriesColumns.tsx`:

- Lazy, server-paged table of **standard** categories, unpublished included (`getCategories(…, STANDARD, showRoots=false, showUnpublished=true)`), reloaded on every page, sort, filter, refresh or tenant change; a response for earlier params or a previous tenant is dropped.
- Columns: id (contains), published (`DotIndicator`, true/false dropdown filter), name (content language, contains, sortable), code, slug (contains, sortable), valid from / valid to (`validityFrom` / `validityTo` date filters, "Always" when empty, sortable).
- Column visibility and mixin columns: CL `TableExtensions` with the remote's `MixinColumns` (schema type `CATEGORY`) in its `children` slot; saved under `ext_categories` with MD's shape `{ table: { columns, mixins } }` (`hooks/useCategoriesTableConfig.ts`, `helpers/categoriesTable.helpers.ts`), so a choice saved in the built-in screen still applies. A failed save shows an error toast and keeps the panel open. Shown in the list view only.
- `ViewSwitch` (CL `SelectButton`) sets `?view=list|tree` (replace) and clears the selection.
- Row click and row edit open `/:id`. Row and batch delete resolve the roots first, delete one by one (subcategories included), show one toast (success with the count, or an error naming every failed category), rebuild the surviving roots (a failed rebuild shows its own error) and reload. If the roots cannot be resolved nothing is deleted.
- A host tenant switch clears rows, total and selection.

Pinned by `pages/CategoriesList.page.test.tsx`, `hooks/useCategoriesTableConfig.test.tsx`, `helpers/categoriesTable.helpers.test.ts`.

## Tree

`components/categoriesTree/CategoriesTree.tsx` over `CategoryTreeBase.tsx` (CL `Tree`, `compact`, `borderless`, single selection):

- Loads `getCategoryTreesCall({ type: STANDARD })`, unpublished included, roots and children in `position` order; labels follow the content language without a reload. The selected category's ancestors open and it scrolls into view, also when selected after the load. A tenant switch drops pending deletes and new-category drafts.
- Side panel (`CategoryDetailsPanel.tsx`): quick edit of id, code, name, slug, description, published and position; it warns when the position equals that of siblings (up to three names, then "and N more"). Save PATCHes the changes with the version re-read from `fetchCategory`, then rebuilds that root and swaps it in; a failed rebuild turns the success toast into a warning. Delete asks for confirmation, deletes and removes the node in place (`/category-trees` still lists a deleted root for a few seconds), then rebuilds the root if the category was not one. The pencil opens `/:id` with `?backTo=` the tree URL.
- Node menu (`CategoryNodeTemplate.tsx`, CL `IconButton` + `Menu`): add above, as child, or below; the list page's Add button adds at the end of the top level. `NewCategoryPanel.tsx` creates the category with the computed parent and position; when there is no gap the siblings are renumbered by PATCH (`getInsertPositions`), then the root (or, for top-level inserts, every renumbered root) is rebuilt, and the new category is selected.
- Drag and drop (managers only, `dragdropScope="categories"` + `onDragDrop`): `getCategoryMovePlacements` gives the moved category a free position among its new siblings (or renumbers them) and a new `parentId` (`root` for the top level) when the parent changed; each placement is a PATCH. If every PATCH fails the drop is undone; otherwise the roots of the changed categories and the old root of the moved one are rebuilt (`getCategoryMoveRootKeys`). Any failure shows a move error.

Pinned by `components/categoriesTree/CategoriesTree.test.tsx`, `categoriesTree.helpers.test.ts`, `categoryTreeMove.helpers.test.ts`, `categoryDetails.helpers.test.ts`.

## Create and edit

`pages/CategoryAddEdit.page.tsx`: header "Category" with the content-language name and a back button (list, or `?backTo=`); Discard and Save (`components/categories/CategoryAddEditActions.tsx`). Tabs: details, path, validity, media (disabled until the category exists), then mixin tabs (saved categories only); `?tab=` selects one.

- Details (`CategoryDetails.tsx`): id (editable on create only), code, name (required), slug, description (CL `LocalizedInput`), ECNs (CL `Chips`).
- Path (`CategoryPath.tsx`): parent through `components/shared/CategoriesSelector.tsx` (CL `PaginatedSelector`, standard categories, unpublished included) and position (`InputNumber`, min 0).
- Validity (`CategoryValidity.tsx`): type dropdown (custom / always / never), from and to (`Calendar` with time, enabled for *custom* only), published checkbox.
- Media (`CategoryMedia.tsx`, `hooks/useCategoryMedia.ts`): CL `AssetsViewer` (tiles, selection, bulk download and delete with confirmation) and `MediaAssetUpload` (uploads with ref type `CATEGORY` and progress, then reloads). Clicking an asset leaves the remote: `window.location.assign('/media-assets/<id>')`. A failed download names the file; a failed upload shows `global.toasts.errorUploadAssets`.
- Mixins: each tab PATCHes `mixins.<key>` with `metadata.mixins.<key>` and the loaded version, then reloads the category; mixin tabs reload only when the category's mixins change, so a category save keeps unsaved mixin edits.
- Save is enabled for a dirty form and a manager. Create POSTs, rebuilds the new category's root, toasts and opens `/:id` (replace). Update PUTs, rebuilds the category's root and, after a parent change, the old parent's root too. A failed rebuild turns the success toast into a warning. A failed save shows the service details and keeps the form.
- A category that cannot be loaded shows an error toast and returns to the list; a failed reload after a save keeps the page. A host tenant switch returns to the list.

Pinned by `pages/CategoryAddEdit.page.test.tsx`, `components/categories/CategoryMedia.test.tsx`, `hooks/useCategoryMedia.test.tsx`.

## Translations

`categories/src/translations/{en,de}/` hold `categories`, `global`, `mixins` and `navigation`. The `categories.*` keys are MD's, including `categories.media.*`, which this remote owns (MD's Categories module is where those keys came from). EN and DE key parity, no empty values and the absence of `primereact` are pinned by `categories/src/translations/translations.test.ts`.

## Host wiring

| Fact | Value |
|---|---|
| Kind | playbook-aligned |
| Federation `name` | `categories` (`categories/vite.config.ts`) |
| Host route `key` → path | `categories` → `/apps/management/categories/*`; MD `CategoriesPathRedirect` moves former pathname links (`/apps/management/categories/<id>`) into the hash (`management-dashboard` `src/router/module-routes.tsx`) |
| Host env var | `VITE_CATEGORIES_URL` (`management-dashboard` `.env.*`) |
| Local port | `5184`, `strictPort` |
| Hosting | Firebase targets `emporix-categories`, `-stage`, `-develop`; `.github/workflows/categories-firebase-*.yaml` |
| Local deviations | none |

## Not yet scanned

- Tier 1 copies shared with `orders` / `products` (providers, mixins subsystem, reference selectors, shared UI) — see `ai-project-knowledge/modules/orders.md` and `products.md`.
- `CategoryDetailsFields.tsx` and `NewCategoryPanel.tsx` field-level validation beyond the required name and position.
