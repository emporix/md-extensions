# Products

Last scanned: da99643 (2026-11-02)
Sources: `products/...`

Management Dashboard remote for product list and product edit. It does not own product persistence. `products/README.md` is still the extension template and does not describe these rules. The federation name is `emporix-product-module` and it exposes `./RemoteComponent` (`products/vite.config.ts`). Unit tests are Vitest `*.test.ts(x)` files under `products/src` (`npm run test:run`).

The host passes `appState`: `tenant`, `language`, `token`, `currency`, `contentLanguage`, `permissions`, `onError` (`products/src/models/AppState.model.ts`, `products/src/RemoteComponent.tsx`). Omitted state defaults to tenant, language, token, and content language `default`, empty permissions, and a no-op `onError`. UI language follows `appState.language`. Axios sends `Authorization: Bearer`, `Emporix-Tenant`, `Accept-Language` `*` unless already set, and `Content-Language` `*` (`products/src/context/ApiProvider.tsx`). HTTP 401 calls `onError`. Children render only when `token` and `tenant` are set. The base URL is `VITE_API_URL` (`products/src/api/index.ts`); the value is not recorded here.

Hooks reject when `tenant` is missing. Brand, label, and supplier paths have no `{tenant}` segment; the tenant header is still attached (`products/src/api/brands.ts`, `products/src/api/labels.ts`, `products/src/api/suppliers.ts`).

## Routes

Hash routes (`products/src/RemoteComponent.tsx`):

| Path | Screen |
|---|---|
| `/` | Redirect to `/products` |
| `/products` | List |
| `/products/add` | Create |
| `/products/:id` | Edit |
| other under `products` | Inline “Not Found” |

`products/src/pages/NotFound.tsx` is not mounted. Changing `tenant` on the editor navigates to `/products` (`products/src/pages/ProductAddEdit.tsx`). The list reloads when `tenant` changes (`products/src/components/products/ProductsTable.tsx`).

## Product

`Product` lives in `products/src/models/Category.ts`. Types: `BASIC`, `BUNDLE`, `VARIANT`, `PARENT_VARIANT`. There is no dynamic-variant type in this module. Fields used by the screens: `id`, `code`, `name` and `description` (`Localized` language map), `published`, `productType`, `media` (`url`, `id`), `mixins`, `metadata` (including `overridden` and mixin schema urls), `parentVariantId`, `template` (`id`, `version`), `taxClasses` (country code to tax-class code), `relatedItems`, `bundledProducts` (`productId`, `amount`), `brandId`, `labelIds`, `weightDependent`, `variantAttributes`. `suppliers` is on the type; the suppliers tab does not read that field.

A new draft is unpublished, has empty media, and takes `?type=` when it is one of the four types; otherwise `BASIC` (`products/src/context/ProductDataProvider.tsx`). `?subscription=true` on create sets mixin `subscription.status` to `Active` and `metadata.mixins.subscription` to a Cloudinary raw JSON-schema URL plus a random query. That URL is not repeated here. Load fills a missing name or description with an empty localized value (`products/src/api/products.ts`). Missing `mixins` or `metadata.mixins` become `{}`. A product with `parentVariantId` also loads that parent and copies the parent `template`. A missing parent shows an error toast and leaves `parentProduct` unset. A `PARENT_VARIANT` sets `parentProduct` to itself so the variants tab can open.

Create, update, and patch drop `Content-Language`. Update and patch of a `VARIANT` also drop `template`, and both drop `metadata.createdAt` and `metadata.modifiedAt`.

## List

Default view is `list`. Tree view is disabled without `categories.viewer` (`products/src/pages/ProductsList.tsx`). Columns (`ext_products`): image (first media url, else a local logo), content-language name, id, code, product type, price, then configured mixin columns (`products/src/components/products/ProductsTable.tsx`). A saved visible-column list hides the others. Row click opens `/products/:id`. Selection is multi. Pagination defaults are page 1, 10 rows, options 10/25/50/100, sort order descending (`products/src/hooks/usePagination.tsx`). The product query sends `x-total-count: true` and reads `x-total-count`.

List price is the first searched price, `includesTax` false, `useFallback` true, `expand` `priceModel`, first tier `priceValue`, or `0` (`products/src/api/prices.ts`, `products/src/api/products.ts`). Missing currency becomes `''` on the flat list and `EUR` on the category view (`products/src/api/categories.ts`). A failed price search on the flat list is only logged; the code then reads the unset map, so the list load rejects. Category assignment load does not catch that search.

Create is a split button, disabled without `products.manager`. The main action is `BASIC`. The menu adds `BUNDLE` and `PARENT_VARIANT` (`Product w/ variants`). `VARIANT` is not a create action. A CSV import dialog and a three-second timeout that toasts success exist on the list, and nothing in this module sets the dialog open (`products/src/pages/ProductsList.tsx`).

Batch and row delete call `DELETE /product/{tenant}/products/{id}` in parallel. Delete is disabled without `products.manager`. Edit in the row menu is not (`products/src/components/shared/TableActions.tsx`).

## General edit

Tabs that render (`products/src/pages/ProductAddEdit.tsx`): general; categories, suppliers, prices, media, and linked products once `id` exists; availability unless the type is `PARENT_VARIANT`; bundle only when the type uppercases to `BUNDLE`; variants only when `parentProduct` is set; then one tab per product mixin schema. The tab-key list also contains `images` and `demo`, and those panels are not rendered. Mixin tabs are outside that key list. What the `tab` query does for them was not traced (`products/src/hooks/useTabs.tsx`).

Delete on edit needs `products.manager`. After the call, success or failure, the screen returns to the list.

General save needs a valid dirty form and `products.manager` (`products/src/components/products/ProductDetailsForm.tsx`). `name` and `code` are required. `id` is editable only on create. `code` and `weightDependent` are disabled for `VARIANT`. `published` defaults to false and is not required. Brand and label dropdowns load `brand/brands` and `label/labels`. A `VARIANT` update appends the dirty field names onto `metadata.overridden` (it does not dedupe) and then calls update. HTTP 400 and 409 get distinct toasts; any other failure is a generic create or update toast. Create navigates to a path with a leading space before `products/{id}`.

## Templates and variants

Template is required when the route type or the form type is `PARENT_VARIANT` (`products/src/components/products/ProductAttributes.tsx`). The template dropdown is disabled for `VARIANT`. Templates load with page size 1000. Versions offered are `1..metadata.version` of the newest template; a single version is written as `1`. Choosing a version whose attributes include `metadata.variantAttribute` sets the type to `PARENT_VARIANT` unless it is already `VARIANT`, clears `mixins.productVariantAttributes` and `mixins.productTemplateAttributes`, and for a new parent fills `variantAttributes` from the template. Mandatory attributes are written again as the template values. Attribute types are `TEXT`, `NUMBER`, `BOOLEAN`, `DATETIME`. The rest of the attribute widgets was not read past that branch.

The variants tab lists products whose `parentVariantId` contains the parent id (`products/src/components/products/Variants.tsx`). For a variant, the parent id is `parentVariantId`; for a parent, it is its own id. Row delete needs `products.manager` and then reloads that filter. One confirm flag is shared by every row.

## Categories

The assignment tab loads up to 1000 categories when the user has `categories.viewer`, then `GET category/{tenant}/assignments/references/{productId}` (`products/src/components/products/CategoriesAssignmentForm.tsx`, `products/src/api/categories.ts`). Category calls seen here send `x-version: v2` and `showUnpublished=true` where a category list is loaded. Save posts `{ ref: { id, type: 'PRODUCT' } }` for every currently selected category and deletes assignments that were removed. The multiselect and discard need both `products.manager` and `categories.manager`. The save button checks only `products.manager`. Without the viewer, the field shows a no-permissions value.

Tree view shows assignments for the selected category with `withSubcategories: false` (`products/src/api/categories.ts`). Products are then loaded by `id:(...)` with `x-version: v2` and fields `id,code,name,published,media,prices,mixins`. CSV export, only from the tree extensions, pages those rows by 16 and writes id, name, and price (`products/src/components/products/CategoriesProductsTable.tsx`). Roots come from `showRoots=true` (`products/src/components/products/ProductsCategoryTree.tsx`). Sibling order is `position`. Swap writes the two positions through `patchCategory`, and a failure writes the original positions back. Category row delete uses `withSubcategories` default true and needs `categories.manager`. Edit navigates to `/categories/{id}`, which this remote does not register.

## Suppliers

The tab reads and writes `PUT /supplier/PSRelations/{productId}/{siteCode}` for the current site (`products/src/components/products/ProductSuppliers.tsx`, `products/src/api/suppliers.ts`). The read uses `data[0].suppliers`. The payload is `{ productId, siteCode, suppliers: [{ id }] }`. The control needs `suppliers.viewer` to render and both `products.manager` and `suppliers.manager` to change. It does nothing when product id or current site is missing.

Current site is the site with `default`, otherwise the first site returned (`products/src/context/SitesProvider.tsx`). `getSites` asks for `pageSize` 1000 and `X-Version: v2` and does not pass `includeInactive` (`products/src/api/sites.ts`). The editor header includes a site select (`products/src/pages/ProductAddEdit.tsx`). What that select changes beyond `currentSite` was not read (`products/src/components/shared/HeaderSection.tsx`).

## Prices and tax

Prices load with `GET price/{tenant}/prices/?itemId=` and `x-version: v2` (`products/src/api/prices_v2.ts`, `products/src/components/products/ProductPrices.tsx`). The price UI is hidden without `priceModels.viewer`. Models load with page size 10000. The default model is the one with `default`, else the first. A new local price is `itemType: 'PRODUCT'`, currency from `appState.currency.id` or `EUR`, `siteCodes` of the current site or `main`, empty `countryCode`, and one empty tier value per tier of the default model. Another new price cannot be added while one unsaved price exists, while `taxClasses` is missing, or without `products.manager`. An empty object still counts as present.

Tier types on the model are `BASIC`, `VOLUME`, `TIERED` (`products/src/models/PriceModel.ts`). Changing the model rebuilds tier values (`products/src/components/products/ProductPricesPanelForm.tsx`). Discount is `ABSOLUTE` or `PERCENT`. A stored amount greater than 0 selects absolute; else a rate greater than 0 selects percent; otherwise absolute. Setting one clears the other. Save sends the form plus tier values through price v2 create or update. Errors toast `response.data.message` and `details` joined. The country, site, and currency field rules inside the form were not read line by line.

Tax rows are the `taxClasses` map (`products/src/components/products/TaxConfiguration.tsx`). Options need `taxes.viewer` and come from taxes whose `location.countryCode` is known, page size 1000. A country already on the product is disabled. Save patches `taxClasses`, or `{}` when the form value is missing, then refreshes the product. Edits need `products.manager`.

## Availability

The tab is off for `PARENT_VARIANT`. For every loaded site the screen `GET availability/{tenant}/availability/{productId}?site=` (`products/src/components/products/ProductAvailability.tsx`). A failed site becomes a row with that site, stock 0, and popularity 0, and no id. A row with `id` opens edit; a row without opens create. Channels are `ASSORTMENT`, `HOME_DELIVERY`, `PICKUP` (`products/src/api/availability.ts`, `products/src/components/products/AvailabilityActions.tsx`). Create is disabled without `products.manager`. The edit pencil is not. Dialog fields and submit are.

## Bundle

Only a `BUNDLE` with an id. Items are `bundledProducts`. Search uses `name:~(query)` and blocks the bundle’s own id and ids already in the bundle (`products/src/components/products/ProductSearchAdd.tsx`, `products/src/components/products/ProductBundle.tsx`). A new line has amount 1. Clearing the amount input writes 1. Save patches `bundledProducts` only. Add, remove, amount, and save need `products.manager`.

## Linked products

`relatedItems` are `refId` plus a `RelatedId` (`products/src/models/Category.ts`): `CONSUMABLE`, `ACCESSORY`, `YOU-MIGHT-LIKE-THIS`, `SUGGESTED-RELATED-ITEMS`, `SIMILAR-ITEMS`. The dropdown is `relation_types` from configuration, parsed as JSON (`products/src/components/products/ProductLinked.tsx`, `products/src/api/configuration.ts`). `CONSUMABLE` and `ACCESSORY` use fixed labels; any other type uses its localized name for the UI language, else its id. A new row gets `types[0]`. Save stays disabled while any type is missing. Save calls full `updateProduct` with the loaded product plus `relatedItems`, so a variant also drops `template` in the API helper. Search blocks the product itself and existing related ids. Whether `types[0]` exists when configuration is empty was not guarded in the add handler.

## Media, mixins, assistant

The media tab lists assets for the product id and uploads with ref type `PRODUCT` (`products/src/pages/ProductAddEdit.tsx`, `products/src/models/Assets.ts`). Upload and the viewer receive `products.manager`. Asset access `PUBLIC` / `PRIVATE` and types `BLOB` / `LINK` are on the model; which the upload sends was not read (`products/src/components/shared/MediaAssetUpload.tsx`).

`products/src/api/productsMedia.ts` is a second image API (`/media` and `/media2`, `X-Version: v2`, Cloudinary multipart, tags `product`). After add or update it reloads the product and, for a `VARIANT`, appends `media` onto `metadata.overridden` and PUTs the product. `products/src/components/products/ProductImages.tsx` uses that API and treats the first image as main. It is not imported by the editor. `useProductsApi.addImage` posts `media2` as `image/jpeg` at position 0 and is not called from `products/src`.

Mixin tabs use schema type `PRODUCT` (`products/src/components/products/ProductAddEdit.tsx`, `products/src/models/Schema.ts`). Save PUTs the loaded product with the saved mixin storage keys applied and sets `metadata.mixins[key]` to the schema url. Product Service keeps a `VARIANT`'s own mixin values only for paths listed in `metadata.overridden`, so a variant save adds, without duplicates, `mixins.<storageKey>.<path>` for every field whose value differs from the loaded (parent-merged) mixin, plus `metadata.mixins.<key>` (`products/src/helpers/variantMixinOverrides.helpers.ts`). Objects are walked; arrays and other values are one field. Blank, null, or removed fields get no path and `''` fields are dropped, so they inherit from the parent again. `productVariantAttributes` is never listed. Pinned by `products/src/helpers/variantMixinOverrides.helpers.test.ts`. Forms are sorted by schema id. The field widgets and schema-to-form mapping were not read (`products/src/components/shared/mixins/`).

The assistant button appears when configuration `openAiApiToken` has a value (`products/src/components/products/ProductDetailsForm.tsx`). The token is not sent by the text call. The call is `POST ai-service/{tenant}/texts` with `{ id, prompt }` (`products/src/api/ai.ts`). The default prompt asks for a long description of the product name in that language; the name falls back to `en`, then `''` (`products/src/components/products/AssistantBox.tsx`). Languages come from configuration. Apply writes the suggestion only where that language’s radio is selected, and otherwise keeps the original description, then dirties the description field. Generate is disabled when no language is selected. The button needs `products.manager`.

## Permissions

`permissions` is a map of resource to role flags (`products/src/helpers/accessConfig.ts`). This module reads `products.manager`, `categories.viewer`, `categories.manager`, `suppliers.viewer`, `suppliers.manager`, `taxes.viewer`, and `priceModels.viewer`. It does not check `products.viewer` on the list or the editor. Whether the host hides the remote is unknown.

## Not yet scanned

- Mixin form widgets and schema conversion: `products/src/components/shared/mixins/helpers.ts`, `MixinsForm.tsx`, `MixinsFormInput.tsx`.
- `ProductImages.tsx` beyond the main-image flag; currency, country, tax, price-model, schema, and media-asset clients beyond the calls cited above.
- `Order.ts`, `Shipping.ts`, `Groups.ts`, `LegalEntity.ts`, and `PriceList.ts` bodies. Product code uses `Metadata` and `Mixins` re-exported from `Order.ts`.
- `products/src/helpers/params.ts` filter syntax, configuration save, table-extension persistence, styling, and i18n message bodies.
