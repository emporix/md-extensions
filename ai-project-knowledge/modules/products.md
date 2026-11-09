# Products

Last scanned: 05d8d1d (2026-11-06)
Sources: `products/package.json`, `products/vite.config.ts`, `products/README.md`, `products/src/RemoteComponent.tsx`, `products/src/App.tsx`, `products/src/Products.module.tsx`, `products/src/api/`, `products/src/constants/paths.ts`, `products/src/context/`, `products/src/pages/ProductsList.page.tsx`, `products/src/components/products/`, `products/src/components/products/dynamicVariants/`, `products/src/components/mixins/`, `products/src/components/shared/`, `products/src/components/auditLog/`, `products/src/hooks/`, `products/src/helpers/`, `products/src/configs/`, `products/src/models/Category.model.ts`, and the `*.test.ts(x)` files named below.

Management Dashboard (MD) remote for product list, create and edit. It replaced the legacy `emporix-product-module` remote (COP-6993). It is a port of the MD code: comments say "MD parity", and `products/README.md` describes the extraction. It does not own product persistence; every call goes to Emporix REST through `@emporix/api-calls` 1.5.1 and UI comes from `@emporix/component-library` (CL) 2.21.0 (`products/package.json`). Federation name `products`, exposes `./RemoteComponent` (named and default export), dev port 5178, MD wiring mode A (`products/vite.config.ts`, `products/README.md`). Unit tests are Vitest.

## Boot and host contract

- The host passes `appState`: `tenant`, `language`, `token`, `currency`, `contentLanguage`, optional `user`, `onError` (`products/src/models/AppState.model.ts`). There is no `permissions` field; the remote loads its own (see Permissions). `onError` is accepted but nothing in `products/src` calls it.
- `useApiCredentials` keeps the shared `@emporix/api-calls` client in sync with tenant and token in a layout effect; the base URL is `VITE_API_URL` and the client creation throws when it is unset (`products/src/api/bootstrap.ts`). Other env var: `VITE_DASHBOARD_ORIGIN` (in `.env*`, no reader found in `products/src`). `VITE_MRWORKER_DEMO` gates the CSV import button (see List).
- UI language follows `appState.language` (`RemoteComponent.tsx`). Provider order: Toast, Dashboard, Permissions, FeatureToggles, Configuration, Sites, ReferenceOptions, UIBlocker, HashRouter, NavigationConfirm.
- Dev only (`import.meta.env.DEV`): `App.tsx` shows a tenant/token/language dialog backed by `localStorage` keys `tenant`, `language`, `token`, `contentLanguage`; it opens when tenant or token is blank (`products/src/helpers/settings.helpers.ts`, pinned by `settings.helpers.test.ts`).
- Sites: `SitesProvider` loads sites when tenant and token are set. Current site is the host's `currentSite` (read from `localStorage`) when it is still a site of this tenant, else the site with `default`, else the first (`products/src/context/SitesProvider.tsx`).
- Feature toggles load per tenant; an unknown toggle is false (`products/src/context/FeatureTogglesProvider.tsx`). Used: `DCP_PRODUCT_SUBSCRIPTION` (create dialog), `DCP_PRODUCT_AI_ASSISTANT` (assistant button).

## Routes

Hash routes under the module root (`products/src/RemoteComponent.tsx`, `products/src/constants/paths.ts`):

| Path | Screen |
|---|---|
| `/` | List |
| `/add` | Create (`?type=`, `?subscription=true`, `?parentVariantId=`, `?siblingId=`) |
| `/:id` | Edit (`?tab=`) |
| anything else | Redirect to `/` |

Tenant change on the editor navigates to the list (`ProductAddEdit.tsx`). The list remounts its browser per tenant and returns to the first page with no selection (`ProductsList.page.tsx`). Host-owned targets (orders, categories, price lists, templates, customers, segments, media assets, custom instances) are paths in `products/src/helpers/hostUrls.ts`; leaving the remote uses `window.location.assign`. Only `product` entities link inside the remote from the audit log (`products/src/configs/entityLinkConfig.ts`).

## Settings and configuration loading (COP-4287)

- `ConfigurationProvider` calls `fetchBasicConfiguration(tenant)` on tenant or content-language change. The configuration is stored with the tenant it belongs to; another tenant sees none until its own request finishes, and a late answer for an earlier request is ignored. A failed first request counts as loaded; a failed refresh keeps the same tenant's last configuration but never gives it to a new tenant (`products/src/context/ConfigurationProvider.tsx`; pinned by `ConfigurationProvider.test.tsx`).
- Saved table settings live in the configuration under `tableConfigurations` (key `ext_products` for the list). `updateTableConfiguration` writes one key through `updateSingleConfiguration` and then refreshes (`TableExtensions.tsx` saves columns plus selected mixin columns).
- The list shows a spinner until `isConfigurationLoaded`, because the saved columns decide the first query (`ProductsList.page.tsx`; test "waits for the saved settings before the first load").

## List

`ProductsList.page.tsx` wraps the CL `ProductsBrowser`.

- Views: `list`; `tree` is added only with `categories.viewer`. The tree comes from `getCategoryTrees({ type: STANDARD })` through `toProductsBrowserCategoryNodes` (`products/src/hooks/api/categoryTree.ts`). The `type` filter needs backend change COP-6124; a backend without it returns trees of both types (comment in that file). A selected category loads its whole branch via `withCategoryScope` (test "loads the products of the whole branch of a selected category").
- Columns: the CL registry columns (image, name, id, code, product type, vendor, price); a column the saved settings do not know stays visible. Mixin columns come from the saved configuration (`products/src/helpers/productsList.helpers.ts`, pinned by `productsList.helpers.test.ts`).
- Load: `syncPaginatedProductsRows` fetches the page, then prices for the page ids unless the price column is hidden (test "loads no prices when the saved settings hide the price column"). A failed price search is logged and rows get price 0 and currency `''` (`products/src/hooks/api/products.ts`). Names are resolved in the content language; a content-language change reloads.
- Page and rows are kept in the URL (`page`, `rows`) and read back on mount; invalid or fractional values are ignored (`pageFromSearchParams`; test "starts on the page the URL holds"). Row click opens the product.
- CSV export: header `id,name,price`; fetches every page (100 per page) for the last load's scope (filters, sort, category) and names the file after the first category id or `products`. The button shows only after a load.
- Create: a dialog with cards Basic, Bundle, Parent variant, Dynamic variant, and Subscription when `DCP_PRODUCT_SUBSCRIPTION` is on. Subscription opens create as `PARENT_VARIANT` with `subscription=true` (`CreateProductDialog.tsx`). `VARIANT` is not a create option. Create, row delete and batch delete need `products.manager` or `Vendor Products Manager`.
- Delete: row and batch delete call `deleteProductWithForceCall(tenant, id, force)`; `force` is true for `DYNAMIC_VARIANT` rows. Batch runs in parallel. With dynamic variants selected, a "recalculate variants" action calls `triggerDynamicVariantRecalculationCall` and toasts job and skipped counts.
- CSV import is a mock: a dialog and a 3 s timeout that toasts success; it appears only when `VITE_MRWORKER_DEMO` is set and the tenant id contains `mrworker`.

## Product model and loading

`Product` (`products/src/models/Category.model.ts`) types: `BASIC`, `BUNDLE`, `VARIANT`, `PARENT_VARIANT`, `DYNAMIC_VARIANT`. Fields with business meaning: `code`, localized `name` and `description`, `published`, `media`, `mixins`, `metadata` (`overridden`, `mixins` schema urls, `dynamicVariantInfo`), `parentVariantId`, `parentVariantPath`, `template` (`id`, `version`), `taxClasses`, `relatedItems`, `bundledProducts`, `brandId`, `labelIds`, `weightDependent`, `vendor` (`id`, `name`), `variantAttributes`; dynamic variants add `sellable`, `dynamicVariantType`, `ownVariantAttributes`, `inheritedVariantAttributes`, `variants` (map of descendants).

- `ProductDataProvider` loads by route `:id` and reloads on `id`, `type`, `subscription`, `parentVariantId`, `siblingId` (`products/src/context/ProductDataProvider.tsx`). `getProduct` fills a missing name or description with an empty localized value and `ownVariantAttributes` with `{}` for dynamic variants. Missing `mixins` and `metadata.mixins` become `{}`.
- With `parentVariantId`, the parent is loaded; a `PARENT_VARIANT` parent lends its `template` to the child; a missing parent toasts an error and leaves `parentProduct` unset. A `PARENT_VARIANT`, or a `DYNAMIC_VARIANT` without parent, is its own `parentProduct`.
- New drafts: unpublished, empty media, type from `?type=` when valid else `BASIC`. `?subscription=true` sets mixin `subscription.status` to `Active` and binds the subscription schema url (url not repeated here). A new dynamic variant starts with `ownVariantAttributes` `{}` and `sellable` false.

## Edit screen

Tabs in order (`products/src/components/products/ProductAddEdit.tsx`): general; categories; classifications (when the product has classification mixins); prices; availability; bundle (only `BUNDLE`); media; linked products; variants; one tab per mixin schema; audit log (only with `AuditLog` viewer access). `?tab=` takes a tab id or a legacy numeric index (`products/src/hooks/useTabs.tsx`). All tabs except general are disabled without `product.id`. Availability is also disabled for `PARENT_VARIANT` and without `products.viewer` or `Vendor Availability Viewer`; media without `products.viewer` or `Vendor Media Viewer`; variants without a `parentProduct`.

- Delete (needs `products.manager` or the vendor equivalent) calls the same force-delete call (force for dynamic variants); success or failure both return to the list. The confirm dialog lists the codes of all descendants for a dynamic variant.
- Save errors: HTTP 400 and 409 get distinct toasts; other failures a generic one with `details`, `message` or the error text (`products/src/helpers/api.ts`, pinned by `api.test.ts`).
- General and mixin saves drop `metadata.createdAt` and `metadata.modifiedAt` before the update call; the general update also runs `removeEmptyValues`. A `VARIANT` general update also drops `template` and appends dirty field names to `metadata.overridden` (not deduplicated). After create, the screen opens the new product.

### General tab (`ProductDetailsForm.tsx`)

- Save needs a valid, dirty form and `products.manager` or `Vendor Products Manager`. `name` and `code` are required. `id` is editable only on create. `code` and `weightDependent` are read-only for `VARIANT`.
- `published` switch: `products.manager`, or `Vendor Product Publish Manager` while unpublished, or `Vendor Product Unpublish Manager` while published.
- Brand and label dropdowns load `fetchBrands` and `fetchLabels`. Vendor is an autocomplete over `getVendors` (page 1, 100 rows, name filter `(~text)`); the dropdown button lists vendors unfiltered even with a vendor selected (CL 2.18.1, COP-7121). Changing the vendor needs `products.manager`; without `Vendors` viewer access the field shows the no-permissions placeholder.
- Assistant: the button shows when configuration `openAiApiToken` has a value and `DCP_PRODUCT_AI_ASSISTANT` is on. The open dialog shows a short informational AI warning in the UI language before generation (`products/src/translations/en/assistantBox.ts`, `products/src/translations/de/assistantBox.ts`, pinned by `products/src/components/products/AssistantBox.test.tsx`). It calls the AI text endpoint with `{ id, prompt }` (`generateTextRequest`); languages come from the configuration; Generate stays disabled when no language is selected; apply fills only the selected language radios and dirties `description` (`AssistantBox.tsx`).
- The attributes box shows template selection (below) or, for a dynamic variant, `DynamicVariantAttributes`.

### Templates and parent variants (`ProductAttributes.tsx`)

- Template is required for `PARENT_VARIANT`; the dropdown is disabled for `VARIANT`. Templates load 1000 per page; versions offered are `1..metadata.version` of the newest template (a single version is set to `1`).
- Choosing a version with a `variantAttribute` attribute sets the type to `PARENT_VARIANT` unless it is `VARIANT`, clears `mixins.productVariantAttributes` and `mixins.productTemplateAttributes`, and writes mandatory attributes as template values. For a new parent, `variantAttributes` is filled from the template. For an existing parent, changing the version keeps only current values whose key still exists in the new template and takes the template values for unknown attributes.
- Variants tab (`Variants.tsx`): lists products whose `parentVariantId` contains the parent id (own id for `PARENT_VARIANT` and `DYNAMIC_VARIANT`, `parentVariantId` for `VARIANT`), sorted by `metadata.createdAt`. Row delete uses the plain delete call (no force) and needs `products.manager` or `Vendor Products Manager`; row click opens the variant with `backTo`.

### Dynamic variants (`products/src/components/products/dynamicVariants/`)

- A hierarchy sidebar (`DynamicVariantHierarchySidebar.tsx`, `useHierarchyTree.tsx`) loads the root product and builds the tree from its `variants` map (`hierarchy.helpers.ts`; pinned by `hierarchy.helpers.test.ts`). The root id is the last element of `parentVariantPath`, else the product or its parent. A child's `sellable` and `published` fall back to its parent's value when undefined. If the product is missing from the root's `variants` after create, the tree reloads after 1 s.
- Add child: `/add?type=DYNAMIC_VARIANT&parentVariantId=<id>`; the draft is a copy of the parent with identity, `variants`, `template`, `parentVariantPath` and `metadata.overridden` removed, the parent's own plus inherited attributes as `inheritedVariantAttributes`, and empty own attributes. Add sibling adds `&siblingId=<id>` and copies that sibling, keeping its own attributes and its `metadata.overridden` (`helpers/dynamicVariantChildDraft.ts`). Selecting another node during an add flow asks for confirmation; selecting in other cases keeps `?tab=`.
- Inheritance: inheritable fields are `name`, `published`, `sellable`, `brandId`, `labelIds`, `description`, `media`, `taxClasses`, `relatedItems` (`helpers/dynamicVariants/inheritableFields.helpers.ts`). A field edited on a child is marked overridden and shows a reset-to-inherited addon (`InheritedFieldAddon.tsx`, `ActiveNodeProvider.tsx`). On create and update of a child, non-overridden inheritable fields are stripped from the payload so the backend keeps inheriting; the stripping uses the live overridden set on the general form and only the persisted `metadata.overridden` on mixin-only saves (tests in `inheritableFields.helpers.test.ts`). On create of a child, mixins are also stripped unless overridden (not for a sibling copy). `template`, `variants`, `inheritedVariantAttributes` and `metadata.overridden` are always removed from dynamic-variant payloads.
- Own attributes are `key -> { name, value: { type, qualifier, name, unit? } }`; value types `STRING`, `NUMBER`, `DECIMAL`, `BOOLEAN` (`attribute.helpers.ts`, pinned by `attribute.helpers.test.ts`). Adding an existing key is ignored. Inherited attributes show read-only. `metadata.dynamicVariantInfo` with `cycleDetected` or `missingAncestorId` shows a warning.
- Deleting a node: force delete; deleting the open node waits 1 s, then opens its parent or the list. Only `products.manager` (no vendor role) can manage the tree.

## Categories tab

`CategoriesAssignmentForm.tsx` loads assignments only with `categories.viewer`. Save posts an assignment for each added category and deletes removed ones (`assignProductToCategoryCall`, `deleteAssignmentToCategoryCall` in `products/src/hooks/api/categories.ts`), waits 1 s for the backend, then reloads the product. Discard needs `products.manager` and `categories.manager`; Save needs only the products role. The selector is the CL `PaginatedSelector` (`components/shared/CategoriesSelector.tsx`).

## Prices and tax

- Prices load through `searchPricesCall` for the product (`products/src/hooks/api/prices_v2.ts`). The price UI needs `Price Models` viewer access, otherwise the no-permissions field shows. Price models load 10000 per page; the default is the one with `default`, else the first. A new local price has `itemId` of type `PRODUCT`, currency from the current currency or `EUR`, site code from the current site or `main`, an empty country and one empty value per tier. Adding another price is disabled while an unsaved price exists, while `taxClasses` is missing, or without `products.manager` or `Vendor Prices Manager`.
- Price form (`ProductPricesPanelForm.tsx`): discount is `ABSOLUTE` or `PERCENT` (amount over 0 selects absolute, else rate over 0 percent, else absolute); fields are read-only without the manage role; create, edit and delete go through the price v2 calls; errors toast the server message and details.
- Tax rows are the `taxClasses` map (`TaxConfiguration.tsx`). Options need `Taxes` viewer access and come from taxes with a known country. A country already on the product is disabled. Save patches `taxClasses` (`{}` when empty) and reloads. Edit needs the products role and taxes viewer; delete rows need only the products role.

## Availability, bundle, linked, media

- Availability: for every loaded site, one search for the product (`searchAvailabilitiesCall`) is merged per site; a site without a record gets a row with stock 0 and popularity 0 and no id (create), others edit (`ProductAvailability.tsx`). A failed search yields empty rows for every site. Leaving a dirty expanded row asks for confirmation. Edit needs `products.manager` or `Vendor Availability Manager` (`AvailabilityRecordExpansion.tsx`).
- Bundle (`ProductBundle.tsx`): only for `BUNDLE`. Items are `bundledProducts`; new lines have amount 1; search blocks the bundle itself and items already in it; save patches `bundledProducts`. Changes need the products role.
- Linked (`ProductLinked.tsx`): `relatedItems` are `refId` plus type (`CONSUMABLE`, `ACCESSORY`, `YOU-MIGHT-LIKE-THIS`, `SUGGESTED-RELATED-ITEMS`, `SIMILAR-ITEMS`). Types come from configuration `relation_types` (JSON). A new row gets the first type; save is full update with `relatedItems`. Empty `relation_types` is not guarded in the add handler.
- Media: the viewer and upload use media assets with ref type `PRODUCT` (`hooks/api/mediaAssets.ts`, `components/shared/MediaAssetUpload.tsx`); manage needs `products.manager` or `Vendor Media Manager`.
- Audit log tab: pages the entity changelog for `product` and the product id, only while active (`components/auditLog/EntityChangelogTab.tsx`; helpers pinned by `entityChangelog.helpers.test.ts` and `changelog.helpers.test.ts`).

## Mixins

- Tabs come from `useMixinsForm` for schema type `PRODUCT`, with `siteAware: true` (`products/src/components/mixins/useMixinsForm.tsx`). A schema is site-aware only when its `siteAware` is true (`schema.helpers.tsx`). Site-aware values are stored per site under key `<schemaId>__<siteCode>`; a null payload in a site-aware batch deletes that key (`helpers.ts`, `siteAwareMixin.helpers.ts`, pinned by `siteAwareMixin.helpers.test.ts`, `helpers.siteAware.test.ts`). Array fields use a `$__emporixSiteArrayOverrides` form flag that is stripped before save.
- Classification mixins (from `metadata.classificationMixins`) render in one "Classifications" tab, labelled with `(!)` when a newer schema version exists; they save by PATCH of `mixins` and `metadata.mixins`. Other mixin tabs save by full PUT of the loaded product (PATCH would merge and keep removed fields).
- Localized values: v1 arrays and v2 language maps are both read; the schema version decides what is written (`localizedMixin.helpers.ts`, pinned by `localizedMixin.helpers.test.ts`, `helpers.localized.v1.test.ts`, `productMixinSave.v1.test.ts`, `productMixinSave.v2.test.ts`). Localized OBJECT fields (v2 `patternProperties` keyed by language) and arrays of them are edited per language; a language is dropped when its last editable value is cleared; required children are checked per language and a site overlay may omit a required field (`localizedObjectLanguages.helpers.ts`, pinned by `localizedObjectLanguages.helpers.test.ts`; COP-6911). Id/value pair fields of mixin objects are kept on save (`helpers.idValuePair.test.ts`).
- Variant overrides (COP-7112): Product Service keeps a `VARIANT`'s own mixin values only for paths in `metadata.overridden`. A mixin save on a `VARIANT` writes `mixins.<storageKey>.<path>` for each field that differs from the loaded (parent-merged) value, plus `metadata.mixins.<key>`, without duplicates. Objects are walked; arrays and other values count as one path. Blank, null or removed values get no path and `''` fields are dropped so they inherit again. `productVariantAttributes` is never listed (backend answers 400). Pinned by `products/src/helpers/variantMixinOverrides.helpers.test.ts`. Dynamic-variant mixin saves also strip inherited fields (see Dynamic variants).
- Reference fields choose among `PRODUCT`, `ORDER`, `CART`, `CUSTOMER`, `COMPANY`, `MEDIA`, `PRICE_LIST`, `CUSTOMER_SEGMENT`, `CATEGORY` plus the tenant's custom entities (`context/ReferenceOptionsProvider.tsx`).

## Permissions

The remote reads permissions itself: user access controls, tenant access controls, templates and scopes through IAM calls (`products/src/context/PermissionsProvider.tsx`, `hooks/api/iam.ts`); children render only after they load. `hasPermission(domain)` needs every access control of the domain after viewer/editor/manager implication expansion (`products/src/helpers/accessControls.ts`; domains and ids in `products/src/configs/accessControls.ts`). Domains used here: Products viewer/manager, Categories viewer/manager, Vendors viewer, Price Models viewer, Taxes viewer, Audit Log viewer, and the vendor-scoped domains for products, prices, availability, media, publish and unpublish. `restrictions.ts` parses order-scope site restrictions (`parseRestrictions`); no caller in the products screens was found.

## Host wiring

| Fact | Value |
|---|---|
| Kind | playbook-aligned (`products/package.json`) |
| Federation `name` | `products` (`products/vite.config.ts`) |
| Host route `key` → path | `products` → `apps/management/products/*` (`management-dashboard` `src/router/module-routes.tsx`) |
| Host env var | `VITE_PRODUCTS_URL` (`management-dashboard` `.env.*`) |
| Local port | `5178`, `strictPort` |
| Local deviations | none |

## Not yet scanned

- Mixin form widgets: `MixinsFormInput.tsx`, `MixinsFormArray.tsx`, `MixinsFormBox.tsx`, `MixinsAccordion*.tsx`, `ReferenceSelector.tsx`, `useReferenceSelectorConfig.tsx`, `MixinsTechnicalDialog.tsx`, `MixinsLanguageTabs.tsx`; `helpers.ts` beyond the storage-key helpers.
- Unused or secondary `hooks/api/*` clients (carts, orders, customers, segments, units, currencies, countries, schema, custom instances) and `models/*` bodies beyond `Category.model.ts`.
- `usePagination.tsx` filter and URL handling beyond defaults (page 1, 10 rows, options 10/25/50/100, sort descending), `SitesSelect`, `SidePanel`, `AddProductsDialog`, `ProductPricesPanelForm.tsx` field rules, `TierQuantityListWithPrices`, `PaginatedSelector` internals, styling and i18n bundles.
