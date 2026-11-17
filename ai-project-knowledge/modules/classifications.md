# Classifications

Last scanned: COP-7182 (2026-11-16)
Sources: `classifications/README.md`, `classifications/package.json`, `classifications/vite.config.ts`, `classifications/src/RemoteComponent.tsx`, `classifications/src/Classifications.module.tsx`, `classifications/src/constants/paths.ts`, `classifications/src/models/Category.model.ts`, `classifications/src/models/Mixins.model.ts`, `classifications/src/models/Schema.model.ts`, `classifications/src/configs/accessControls.ts`, `classifications/src/hooks/api/{categories,categoryTree,categoryTreeRebuild,schema,featureToggles,iam}.ts`, `classifications/src/hooks/useClassificationsColumns.tsx`, `classifications/src/hooks/useClassificationMixinsColumns.tsx`, `classifications/src/hooks/useClassificationsTableConfig.ts`, `classifications/src/helpers/{classificationsTable,classificationForm,classificationSchema}.helpers.ts`, `classifications/src/context/{Classification,ClassificationSchemas,ClassificationVersion}.provider.tsx`, `classifications/src/pages/`, `classifications/src/components/classifications/`, `classifications/src/components/categoriesTree/`, `classifications/src/components/shared/CategoriesSelector.tsx`, `classifications/src/translations/`, `classifications/src/pages/*.test.tsx`, `classifications/src/components/categoriesTree/CategoriesTree.test.tsx`, `docs/MIGRATED_MODULES.md`, `management-dashboard` `src/router/module-routes.tsx` and `.env.*` (COP-7182 branch)

Management Dashboard (MD) Management → Classifications as a Vite federated remote, extracted in COP-7182 (epic COP-5597). A classification is a category of the Category Service with `type: CLASSIFICATION`; on top of the category fields it carries its own classification schemas (`ownClassificationMixins`). Federation name `classifications`, exposes `./RemoteComponent` (named and default), local port `5187` with `strictPort` (`classifications/vite.config.ts`). Component library 2.29.0 (`classifications/package.json`). Tier 1, the providers, the configuration, the tree, the parent selector and the table settings are copied from the `categories` remote; the screens are ported from MD `src/modules/classifications` and `src/router/Classifications.routes.tsx`. The mixins engine, media and `ReferenceOptionsProvider` are not in this remote. Standard categories are the `categories` remote (`ai-project-knowledge/modules/categories.md`).

## Records

`classifications/src/models/Category.model.ts` (MD shapes; `CategoryType` is re-exported from `@emporix/api-calls`):

- **Category** (the classification): `id`, optional `parentId`, `code`, `localizedName`, `localizedDescription`, `localizedSlug`, `position`, `validity` (`from`, `to`), `published`, `metadata`, `type`, and `ownClassificationMixins`.
- **Classification mixin** (`models/Mixins.model.ts` `ClassificationMixin`): `name` (the key), `required`, `schemaUrl`; the model also carries `usedSchemaUrl`, `mixinPath`, `sourceCategoryId` and `obsoleteSchemaUrlUsed`, which no screen here reads.
- **Category tree** (`/category-trees` node): `id`, `parentId`, `code`, the three localized fields, `validity`, `position`, `published`, `ecn`, `subcategories`. It carries no `metadata.version`.

Form rules (`helpers/classificationForm.helpers.ts`):

- New form (`createClassificationForm`): empty name, code and description, no parent, position `0`, no validity dates, **published**, no schemas.
- Save payload (`mapFormToPayload`): the form on top of the loaded classification (the PUT replaces the whole category), always with `type: CLASSIFICATION`. `ClassificationAddEditActions` passes it through `removeEmptyValues` (`helpers/utils.ts`) before the call.
- Name (at least one language value) and code are required. The code can be entered on create only.

Pinned by `helpers/classificationForm.helpers.test.ts`.

## API

All bound to the host tenant (`useDashboardContext`):

- `useCategoriesApi` (`hooks/api/categories.ts`): `getCategories` (paged, and all pages through `fetchAllRecords`; type, `showRoots`, `showUnpublished`), `fetchCategory`, `createNewCategory` (returns the id), `modifyCategory` (PUT), `patchCategoryCall` (PATCH), `deleteSingleCategory` (with subcategories by default), `getSubcategoriesCall`, `getCategoryParentsCall`. MD's product-assignment calls were dropped. No caller of `getSubCategories` or of this hook's `getCategoryParents` was found outside the hook.
- `useCategoryTreeApi` (`hooks/api/categoryTree.ts`): `getCategoryTreesCall` (its `type` filter needs backend change COP-6124), `rebuildCategoryTreeCall`, `getCategoryParentsCall` with unpublished ancestors.
- `useCategoryTreeRebuild` (`hooks/api/categoryTreeRebuild.ts`): no api-calls import of its own; it uses `useCategoryTreeApi`. `/category-trees` is cached per **root** category, so every change rebuilds the affected roots. `resolveRoots` takes the first parent of each category (a 404 from `/parents` means the category is a root); `rebuildRoots` ignores roots that answer 404 (deleted meanwhile); `rebuildForCategories` does both.
- `useSchemaApi` (`hooks/api/schema.ts`): `getSchemasCall` (Emporix schemas of type `CLASSIFICATION`, `context/ClassificationSchemas.provider.tsx`) and `getSchemaCall` (the old version of a schema, by id and version). `getReferencesCall`, `getReferenceCall` and `useMixinsApi` → `getMixinsSchemaCall` are wrapped too; no caller was found.
- `useFeatureTogglesApi` (`hooks/api/featureToggles.ts`): `getFeatureToggleValuesCall`, all pages.
- `useIamApi` (`hooks/api/iam.ts`): the IAM calls of the Tier 1 copy (users, groups, scopes, access controls and their templates); only `context/PermissionsProvider.tsx` imports the hook.
- Table settings: `fetchBasicConfiguration` and `updateSingleConfiguration` through `context/ConfigurationProvider.tsx`.
- Direct HTTP: an **own** schema is read with `fetch(<schema URL>)` in `components/classifications/ClassificationMixinsTileForm.tsx`.

## Routes

Hash routes (`classifications/src/constants/paths.ts`, `classifications/src/RemoteComponent.tsx`); ids are URL-encoded:

| Path | Page |
|---|---|
| `/` (default; any `view` other than `tree`) | `pages/ClassificationsList.page.tsx` → `ClassificationsTable` list |
| `/?view=tree` (`&categoryId=<id>`) | `ClassificationsList.page.tsx` → `CategoriesTree`; `categoryId` is the selected classification |
| `/add` (case-sensitive) | `pages/ClassificationAddEdit.route.tsx` → `ClassificationAddEdit.page.tsx` |
| `/:classificationId` (`?tab=`, `?backTo=`) | same page, edit |

Other paths redirect to `/`. `ClassificationAddEditRoute` keys `ClassificationDataProvider` by `classificationId`, so create → edit remounts with fresh form state. `Classifications.module.tsx` wraps the routes in `RefreshValuesProvider`. Nothing leaves the remote for a host route.

## Permissions

`Categories Viewer` (`CATEGORIES_VIEWER`) to see, `Categories Manager` (`CATEGORIES_MANAGER`) for every write (`configs/accessControls.ts`; the domains also bundle `MEDIA_VIEWER` / `MEDIA_MANAGER`, as in MD). The remote loads them in its own `PermissionsProvider`. Without Categories Manager: Add new Classification, row and batch delete, table settings, Save and Discard, tree drag and drop, the tree panel's save and delete are disabled, and every field, schema tiles included, is read-only. Without Categories Viewer the tree shows the "no permissions" text instead of loading.

## List

`components/classifications/ClassificationsTable.tsx`, columns in `hooks/useClassificationsColumns.tsx`:

- Lazy, server-paged table of classifications, unpublished included (`getCategories(…, CLASSIFICATION, showRoots=false, showUnpublished=true)`), initial sort field `metadata.createdAt`, reloaded on every page, sort, filter, refresh or tenant change; a response for earlier params or a previous tenant is dropped.
- Columns: name (content language, filter, sortable), valid from and valid to (`validity.from` / `validity.to`, date filters with `DateFilterTemplate`, sortable).
- Column visibility: CL `TableExtensions` with the three columns and no mixin column picker; saved under `ext_classifications` with MD's shape `{ table: { columns, mixins } }` (`hooks/useClassificationsTableConfig.ts`, `helpers/classificationsTable.helpers.ts`). The hook reads the preference with its own `fetchSingleConfiguration` call (a 404 means nothing saved) and writes it with `updateSingleConfiguration`, because `fetchBasicConfiguration` in api-calls returns table configurations for a fixed list of keys that does not include `ext_classifications`; the shared `ConfigurationProvider` is not used for it. In MD the saved preference was never read back for the same reason. The table shows no mixin columns, but mixin columns stored earlier under that key are written back untouched. A failed save shows an error toast and keeps the panel open. The control is shown in both views.
- `ViewSwitch` sets `?view=tree` or removes `view`, and clears the selection.
- Row click and row edit open `/:id`. Row and batch delete resolve the roots first, then delete one by one (subcategories included) with a toast per item (success or error); what failed stays selected. Then the surviving roots are rebuilt (a failed rebuild shows its own error) and the list reloads. If the roots cannot be resolved nothing is deleted.
- A host tenant switch clears rows, total and selection.

Pinned by `pages/ClassificationsList.page.test.tsx`, `hooks/useClassificationsTableConfig.test.tsx`, `helpers/classificationsTable.helpers.test.ts`.

## Tree

`components/categoriesTree/CategoriesTree.tsx` over `CategoryTreeBase.tsx` (CL `Tree`), copied from `categories` with the type fixed to `CLASSIFICATION` (`TREE_TYPE`); `CategoryDetailsPanel.tsx`, `CategoryNodeTemplate.tsx` and the three helper files are identical to the `categories` copies:

- Loads `getCategoryTreesCall({ type: CLASSIFICATION })`, unpublished included. The selection lives in `?categoryId=`; the selected classification's ancestors open and it scrolls into view. A tenant switch drops pending deletes and new-classification drafts.
- Side panel (`CategoryDetailsPanel.tsx`, `CategoryDetailsFields.tsx`): quick edit of name, slug, description, published and position (id and code are read-only for an existing classification); it warns when the position equals that of siblings. Save PATCHes the changed fields with the version re-read from `fetchCategory`, then rebuilds that root and swaps it in. Delete asks for confirmation. The pencil opens `/:id` with `?backTo=` the tree URL.
- Add: the node menu adds above, as child, or below; the list page's Add button adds at the end of the top level (`treeRef.addCategory()`), in the side panel (`NewCategoryPanel.tsx`) instead of opening `/add`. A new classification needs a code and starts published.
- Drag and drop (managers only, `dragdropScope="categories"` + `onDragDrop`, `categoryTreeMove.helpers.ts`): each placement is a PATCH; the old and the new root are rebuilt.

Pinned by `components/categoriesTree/CategoriesTree.test.tsx`, `categoriesTree.helpers.test.ts`, `categoryTreeMove.helpers.test.ts`, `categoryDetails.helpers.test.ts`, and the tree cases of `pages/ClassificationsList.page.test.tsx`. Move, renumbering and rebuild details: `ai-project-knowledge/modules/categories.md` → **Tree** (same code).

## Create and edit

`pages/ClassificationAddEdit.page.tsx` (react-hook-form, `mode: 'onChange'`): header "Classification" with the content-language name and a back button (list, or `?backTo=`); Discard and Save (`components/classifications/ClassificationAddEditActions.tsx`). Four CL `Tabs` (`keepMounted`), in this order: `details`, `classification`, `path`, `validity`; `?tab=` selects one by id, or by MD's numeric index.

- Details (`ClassificationDetails.tsx`): name (required, `LocalizedInput`), code (required, read-only once the classification exists), description.
- Classification (`ClassificationMixins.tsx`): the schema tiles, see below.
- Path (`ClassificationPath.tsx`): parent through `components/shared/CategoriesSelector.tsx` (CL `PaginatedSelector`, single selection, published classifications only, as in MD) and position (`InputNumber`, min 0).
- Validity (`ClassificationValidity.tsx`): published checkbox, type dropdown (custom / always; *custom* when a date is set), from and to (`Calendar`, enabled for *custom* only). Choosing *always* clears both dates.
- Save is enabled for a valid, dirty form and a manager. Create POSTs, rebuilds the new classification's root, toasts and opens `/:id` (replace); a 409 shows the "code already exists" text. Update PUTs, rebuilds the classification's root and, after a parent change, the old parent's root too, then reloads the classification. A failed rebuild turns the success toast into a warning. A failed save shows the service details and keeps the form.
- A classification that cannot be loaded shows an error toast and returns to the list; a failed reload after a save keeps the page (`context/Classification.provider.tsx`). A host tenant switch returns to the list.

Pinned by `pages/ClassificationAddEdit.page.test.tsx`.

## Schema tiles and version rule

`ClassificationMixins.tsx` → `ClassificationMixinsTile.tsx` → `ClassificationMixinsTileForm.tsx`, one tile per entry of `ownClassificationMixins` (a react-hook-form field array); the `+` button appends `{ required: false, schemaUrl: '', name: 'newClassificationSchema' }`, the bin removes a tile. Tiles are collapsed until toggled.

- Schema type: **Emporix** (a dropdown of the tenant's `CLASSIFICATION` schemas; picking one sets the key to the schema id and the URL to `metadata.url`, and the URL field ignores typing) or **own** (the URL is typed). Switching the type remembers the last key and URL of each type.
- Key: required, letters, digits and `_` only (other characters are removed while typing). URL: required, `http(s)://<host>/<path>.json` (`isSchemaUrlValid`). An invalid key or URL blocks Save with a field error.
- Required switch per tile.
- Attribute table (read-only; name, read only, nullable, required, localized): for an Emporix schema from its `attributes`; for an own schema from the fetched JSON schema's `properties` and `required` (`mapOwnSchemaToAttributes`), where *nullable* means the property `type` is, or lists, `"null"`. An own schema that cannot be read shows no attributes. A late answer for an earlier URL is dropped (`AbortController`).
- Which case applies (`findSchemaByUrl`): the stored URL is split as `<base>_v<version>.json` and matched against the `metadata.url` of the Emporix schemas by base. No match → own schema. Match with the same version → Emporix schema, current. Match with another version → **outdated**: the stored version is loaded with `getSchemaCall` (id and version parsed from the URL by `getSchemaIdAndVersion`), the tile header shows `v<new version>` (`VersionBadge`), the tab label becomes `Classification (!)` (`ClassificationTabHeader.tsx`, `context/ClassificationVersion.provider.tsx`), and the table shows the diff (`diffSchemaAttributes`: added, deleted, changed type or flag). "Keep old" shows the old attributes, "New version" the diff, "Apply Version N" sets the tile's URL to the current schema URL and clears the badges. If the old version cannot be loaded the new attributes are shown. Removing an outdated tile clears the tab alert.

Pinned by `helpers/classificationSchema.helpers.test.ts` and the `schema tiles` / `outdated schema` cases of `pages/ClassificationAddEdit.page.test.tsx`.

## Translations

`classifications/src/translations/{en,de}/` hold `categories`, `classifications`, `global` and `mixins`. The `classifications.*` keys are MD's; the tree copy reads `categories.*` keys (`categories.tree.*`, `categories.edit.tab.*`, `categories.actions.rebuild.error`) and the version buttons `mixins.buttons.keepOld` / `newVersion`. EN and DE key parity, no empty values and the absence of `primereact` are pinned by `classifications/src/translations/translations.test.ts`.

## Host wiring

| Fact | Value |
|---|---|
| Kind | playbook-aligned |
| Federation `name` | `classifications` (`classifications/vite.config.ts`) |
| Host route `key` → path | `classifications` → `/apps/management/classifications/*`; MD `ClassificationsPathRedirect` moves former pathname links (`/apps/management/classifications/<id>`, `/add`) into the hash (`management-dashboard` `src/router/module-routes.tsx`, `src/helpers/classificationsUrl.helpers.ts`; COP-7182 host PR) |
| Host env var | `VITE_CLASSIFICATIONS_URL` (`management-dashboard` `.env.*`, eight files) |
| Local port | `5187`, `strictPort` |
| Hosting | Shared Firebase Hosting site per environment (pilot of COP-7348), no site or `firebase.json` target of its own: `https://frontend-extensions-develop.web.app/classifications/remoteEntry.js`, `frontend-extensions-stage`, `frontend-extensions` (prod). Deployed by `.github/actions/deploy-remote` from `.github/workflows/classifications-firebase-*.yaml` |
| Local deviations | none |

## Differences from MD

- *Nullable* in the attribute table of an own schema is detected from the JSON-schema `"null"` type; MD compared the type entries with the value `null` (`helpers/classificationSchema.helpers.ts`).
- The column settings offer no mixin columns; MD's picker offered them but its table rendered none (`ClassificationsTable.tsx`).
- The alert for an outdated schema is the ` (!)` suffix of the tab label, because CL `TabItem.label` is a string; MD showed a corner badge.
- The write controls of a schema tile (type, required, schema, key, URL, delete, add, apply version) are read-only or disabled for a viewer; MD only disabled Save.
- Field errors of the schema tiles show while typing (`mode: 'onChange'`); MD only disabled Save.
- A failed reload after a save keeps the user on the page.
- A saved column visibility is applied; in MD it was stored but never read back, so a choice saved there earlier takes effect here.

## Not yet scanned

- Tier 1 copies shared with `categories` (providers, shared UI, pagination and table helpers) — see `ai-project-knowledge/modules/categories.md`.
- `NewCategoryPanel.tsx` and `CategoryDetailsFields.tsx` field-level validation beyond the required code, and the insert / move placement helpers (identical to `categories`).
- How products consume `ownClassificationMixins` (the `products` remote, `ai-project-knowledge/modules/products.md`).
