# Returns

Last scanned: 05d8d1d (2026-11-06)
Sources: `returns/README.md`, `returns/package.json`, `returns/src/RemoteComponent.tsx`, `returns/src/constants/paths.ts`, `returns/src/pages/ReturnsList.page.tsx`, `returns/src/pages/ReturnCreate.page.tsx`, `returns/src/pages/ReturnEdit.page.tsx`, `returns/src/contexts/ReturnForm.provider.tsx`, `returns/src/models/Returns.model.ts`, `returns/src/models/Order.model.ts`, `returns/src/models/Customer.model.ts`, `returns/src/models/Metadata.model.ts`, `returns/src/models/Schema.model.ts`, `returns/src/hooks/api/returns.ts`, `returns/src/hooks/api/orders.ts`, `returns/src/hooks/api/customers.ts`, `returns/src/hooks/usePagination.tsx`, `returns/src/helpers/tables.ts`, `returns/src/helpers/tables.test.ts`, `returns/src/helpers/returnsSiteAccess.ts`, `returns/src/helpers/returnsSiteAccess.test.ts`, `returns/src/helpers/latestRequest.ts`, `returns/src/helpers/latestRequest.test.ts`, `returns/src/helpers/hostUrls.ts`, `returns/src/configs/accessControls.ts`, `returns/src/context/PermissionsProvider.tsx`, `returns/src/context/ReferenceOptionsProvider.tsx`, `returns/src/components/returns/ReturnsTable.tsx`, `returns/src/components/returns/ReturnEditDetails.tsx`, `returns/src/components/returns/ReturnEditDetailsExpansion.tsx`, `returns/src/components/returns/ReturnAddCustomers.tsx`, `returns/src/components/returns/ReturnAddOrders.tsx`, `returns/src/components/returns/ReturnAddProducts.tsx`, `returns/src/components/returns/ReturnAddProductsExpansion.tsx`, `returns/src/components/mixins/useMixinsForm.tsx`, `returns/src/components/mixins/MixinsFormBox.tsx`, `returns/src/components/mixins/MixinsAccordionForms.tsx`, `returns/src/components/mixins/MixinsForm.tsx`, `returns/src/components/mixins/useReferenceSelectorConfig.tsx`, `returns/src/components/mixins/localizedMixin.helpers.ts`, `returns/src/components/mixins/siteAwareMixin.helpers.ts`, `returns/src/components/shared/BatchDeleteButton.tsx`, `returns/src/components/shared/TableExtensions.tsx`, `returns/src/components/shared/MixinColumns.tsx`, `returns/src/context/FeatureTogglesProvider.tsx`

Operator UI for returns inside the Management Dashboard. This remote does not own return persistence. HTTP paths and server rules live in `@emporix/api-calls`, which this module calls and does not define (`returns/src/hooks/api/returns.ts`). What the return service accepts, rejects, or emits is unknown from this repo.

Actor: a dashboard user. The host passes `appState` (`tenant`, `language`, `token`, optional `currency`, `contentLanguage`, optional `user`, `onError`) into `RemoteComponent` (`returns/README.md`, `returns/src/models/AppState.model.ts`). `user` seeds the submitter on create (`returns/src/contexts/ReturnForm.provider.tsx`). The provider tree adds `ReferenceOptionsProvider`, which loads custom entities for mixin reference fields (`returns/src/RemoteComponent.tsx`, `returns/src/context/ReferenceOptionsProvider.tsx`). Permissions are loaded here from IAM, not from `appState` (`returns/README.md`, `returns/src/context/PermissionsProvider.tsx`).

## Screens

Hash routes inside the remote (`returns/README.md`, `returns/src/RemoteComponent.tsx`, `returns/src/constants/paths.ts`):

| Hash path | Screen |
|---|---|
| `/` | Returns list |
| `/add` | Create wizard (customer, orders, products, review) |
| `/:id` | Return detail: general tab, then one tab per mixin schema |
| other | Redirect to `/` |

`/add` is wrapped in `ReturnFormProvider`. No route checks a permission (`returns/src/RemoteComponent.tsx`).

Leaving the remote uses `window.location.assign` (`returns/src/constants/paths.ts`):

- Customer: `/apps/management/customers/${customerId}`
- Order: `/apps/management/orders/${orderId}`

`returns/README.md` describes the orders target as `/apps/management/orders#/:id`. `returns/src/constants/paths.ts` still builds the pathname form and comments that the host redirects `/orders/:id` to `/orders#/:id` after the orders remote is live. Which URL the running host actually serves is unknown from this module.

## What the UI treats as a return

List row `Return` (`returns/src/models/Returns.model.ts`): `id`, `approvalStatus`, `expiryDate`, `requestor` (`customerId`, `firstName`, `lastName`, `email`), optional `siteCode`, `metadata`.

Detail `ReturnDetails`: those ideas (including optional `siteCode`) plus `reason` (`code`, `details`), `submitter` (`userType`, `firstName`, `lastName`, `email`), `received`, optional `total` (`value`, `currency`), optional `calculatedPrice.finalPrice` (`grossValue`, `netValue`, optional `taxValue`, optional `currency` from `returns/src/models/Order.model.ts`), `orders`, `mixins`, `expiryDate`.

Each `ReturnOrder` is `id` plus `items`. An item has `id`, `name`, `quantity`, optional `reason`, `total`, `unitPrice`, and optional calculated prices.

`approvalStatus` is `ReturnStatus`: `PENDING`, `APPROVED`, `REJECTED`, `CLOSED`, `REVIEWED` (`returns/src/models/Returns.model.ts`). The detail dropdown lists every value (`returns/src/components/returns/ReturnEditDetails.tsx`). This module has no allowed-transition table. Which changes the API stores is unknown.

`received` is a boolean the manager can toggle (`returns/src/components/returns/ReturnEditDetails.tsx`). No further effect is implemented here.

`expiryDate` and `metadata.createdAt` are shown and are not inputs (`returns/src/components/returns/ReturnEditDetails.tsx`, `returns/src/components/returns/ReturnsTable.tsx`). What `expiryDate` means in the return service is unknown.

`Metadata` allows `createdAt`, `modifiedAt`, `version`, and any other key (`returns/src/models/Metadata.model.ts`). Mixin schema URLs are read from `metadata.mixins` (`returns/src/pages/ReturnEdit.page.tsx`).

Order and customer types here are a subset used by the wizard (`returns/src/models/Order.model.ts`, `returns/src/models/Customer.model.ts`). An order line `Entry` has `id`, `amount`, numeric `unitPrice` and `totalPrice`, `product`, and optional calculated prices. Customer fields used: `id`, `firstName`, `lastName`, `email`, `company`.

## List

`ReturnsListPage` shows a create button and `ReturnsTable` (`returns/src/pages/ReturnsList.page.tsx`).

Load: `getReturnsCall(tenant, pagination)` (`returns/src/hooks/api/returns.ts`). Default page is 10 rows, sort `metadata.createdAt` descending (`returns/src/components/returns/ReturnsTable.tsx`). Columns: requestor first name, last name, created at, id, expiry date, site (display only, not filterable), approval status. The other columns filter and sort. Status filter options are an explicit All value plus every `ReturnStatus`.

Site filter (`returns/src/pages/ReturnsList.page.tsx`, `returns/src/components/returns/ReturnsTable.tsx`, `returns/src/helpers/tables.ts`):

- A dropdown under the title lists a placeholder (all sites) and every tenant site as `name - code`. The list starts with no site selected. It does not follow the host's current site.
- A chosen site adds an exact `siteCode` filter to the request (`withSiteEqualsFilter`); a blank choice removes it. Other filters, including the created-date range, are kept (tests in `returns/src/helpers/tables.test.ts`).
- Changing the site while on a later page resets to page 1 before loading.
- A site outside the user's restriction is refused with an error toast and the selection does not change. Restricted sites come from IAM scopes `returns.returns_read` and `returns.returns_manage`: an exact scope means unrestricted, `returns.returns_read--SITE_A#SITE_B` lists the allowed sites, the first suffixed scope found wins (`returns/src/helpers/returnsSiteAccess.ts`, tests in `returnsSiteAccess.test.ts`). Whether the API also enforces this is unknown.
- Rebuilding the columns (for example when the site list refreshes) keeps filter values already typed (`columnFiltersKeepingValues`, `returns/src/hooks/usePagination.tsx`).
- Only the newest request may update the table or the loading flag; a slower response from before a site change is dropped (`returns/src/helpers/latestRequest.ts`, test `keeps the newer response when an older request finishes later`).
- The list refetches when filters, pagination, tenant, the refresh flag, or the selected site change.

Row click and the edit action open `/${id}` (`returns/src/components/returns/ReturnsTable.tsx`).

Delete, one row or a selection, confirms, then `Promise.all` of `deleteReturnCall(tenant, id)` (`returns/src/hooks/api/returns.ts`, `returns/src/components/shared/BatchDeleteButton.tsx`, `returns/src/components/shared/TableActions.tsx`). There is no batch-delete call. If one id fails, `Promise.all` rejects after any earlier deletes have already been sent. Whether those earlier deletes are committed is unknown.

Column visibility and mixin columns persist under configuration key `ext_returns` for schema type `RETURN` (`returns/src/components/returns/ReturnsTable.tsx`, `returns/src/models/Schema.model.ts`). A missing saved flag means the column stays visible (`returns/src/components/shared/TableExtensions.tsx`). Adding a custom mixin column is shown only when feature toggle `custom-mixin-columns` is enabled (`returns/src/components/shared/MixinColumns.tsx`). No returns screen calls `useFeatureToggles` for any other code (`returns/src/context/FeatureTogglesProvider.tsx`).

## Create

Wizard tabs, in order: customers, orders, products, review (`returns/src/pages/ReturnCreate.page.tsx`). Products stays disabled until at least one order is selected. Review stays disabled until the form is valid. Tabs stay mounted so selections survive tab changes.

Save calls `createReturnCall` and navigates to `/${res.id}` (`returns/src/contexts/ReturnForm.provider.tsx`). Fields of that response other than `id` are unknown; the call result is cast with `as never` (`returns/src/hooks/api/returns.ts`).

Form defaults (`returns/src/contexts/ReturnForm.provider.tsx`): submitter first name, last name, and email from `appState.user`; requestor `customerId` and `email` empty; reason code and details empty; orders empty. `submitter.userType` is on the model and is not set here. Whether the API requires it is unknown.

Validation (`returns/src/contexts/ReturnForm.provider.tsx`): at least one order; each order at least one item; reason code and details are paired so that if either is blank the other is required. A line-level reason is collected in the UI and is not part of this schema (`returns/src/components/returns/ReturnAddProductsExpansion.tsx`).

Customers (`returns/src/components/returns/ReturnAddCustomers.tsx`): paged list, single select, filter and sort on first and last name. Selecting the same customer again clears the selection. Changing customer clears selected orders and line selections (`returns/src/contexts/ReturnForm.provider.tsx`). `?customerId` on first load fetches that customer with `getCustomer` (`returns/src/hooks/api/customers.ts`). The list call `getCustomers` runs only when the user has the Customers Viewer domain; otherwise it rejects with `No permissions`. The single-customer fetch does not check that domain. The customer edit action leaves for the host customer path and does not check Customers Viewer (`returns/src/components/returns/ReturnAddCustomers.tsx`).

Orders (`returns/src/components/returns/ReturnAddOrders.tsx`, `returns/src/hooks/api/orders.ts`): multiple select. `getOrdersCall` is called with site code `undefined` so a return can use orders from any site. The call runs only for Orders Viewer or Vendor Orders Viewer; otherwise it rejects with `No permissions`. Filters:

- A customer is selected: `customer.id` equals that id.
- No customer: `customer.id` equals `ANONYMOUS`.
- An anonymous order is already selected: also `customer.email` equals that order's email.

The first anonymous order's email is stored and, on submit, the requestor becomes `{ customerId: '', anonymous: true, email }` (`returns/src/contexts/ReturnForm.provider.tsx`). A named customer submit does not set `anonymous`. An anonymous order row has no customer link (`returns/src/components/returns/ReturnAddOrders.tsx`).

Products (`returns/src/components/returns/ReturnAddProducts.tsx`, `returns/src/components/returns/ReturnAddProductsExpansion.tsx`): expand an order and select lines. Quantity choices are `1` through the order line `amount`; the initial quantity is `amount`. Selected lines can carry their own reason code and details. An empty selection removes that order from the payload so a selected order with zero items does not keep Save disabled. Header reason code and details are editable on the products step and read-only on review. Review shows the selected customer name, or the no-customer state, and only the chosen lines.

Displayed total is the sum of `quantity * (calculatedUnitPrice.grossValue ?? unitPrice)` across selected lines, in the currency of the first selected order (`returns/src/contexts/ReturnForm.provider.tsx`, `returns/src/components/returns/ReturnAddProducts.tsx`). This total is not a field on `ReturnForm`. Whether the API recomputes money is unknown.

## Edit

`/:id` loads `getReturnsDetailsCall` (`returns/src/pages/ReturnEdit.page.tsx`). Missing `mixins` or `metadata.mixins` is replaced with `{}` in component state before mixin tabs load. Fetch failure shows the fetch error toast. The page does not redirect when the id is unknown.

Details save sends the whole `ReturnDetails` through `updateReturnCall` without `siteCode` (the site is read-only), then reloads (`returns/src/pages/ReturnEdit.page.tsx`). Discard reloads from the API. Save is enabled only when the form is dirty and valid. The same reason rule as create applies: code or details must be non-blank. `received` and `approvalStatus` are not in that schema.

With Returns Manager, the operator can change status to any `ReturnStatus`, reason code, reason details, and `received` (`returns/src/components/returns/ReturnEditDetails.tsx`). Without it those controls are disabled or read-only. Created date, expiry date, site, and submitter name are display-only. The details Save and Discard buttons are not themselves permission-checked; a viewer cannot dirty those fields through the controls.

Orders on the detail are read-only (`returns/src/components/returns/ReturnEditDetails.tsx`, `returns/src/components/returns/ReturnEditDetailsExpansion.tsx`). Expansion columns: item id, name, reason code, reason details, quantity, line money. Line money is `calculatedPrice.finalPrice.grossValue`, or `total.value` when that gross value is absent. Header total uses the same gross-value fallback against `returnDetails.total.value`, with currency `total.currency` (empty string when `total` is absent). The total row is omitted when both the gross value and `total.value` are absent. View order leaves for the host order path and is disabled unless the user has Orders Viewer or Vendor Orders Viewer.

## Mixin tabs

The mixin forms are the same port of the Management Dashboard mixins used by the orders remote (`returns/src/components/mixins/`). See `ai-project-knowledge/modules/orders.md`, section Mixins, for field types, localized values (v1 array, v2 map, localized OBJECT), version switching, and reference types. Returns-specific facts:

- Schemas and references are loaded for type `RETURN`, merged with schema URLs already stored on the return (`returns/src/components/mixins/useMixinsForm.tsx`, `returns/src/pages/ReturnEdit.page.tsx`). One tab per merged schema, after the details tab. A disabled loading tab shows while schemas load. A schema that fails to load is logged and skipped. The remote does not author schemas (`returns/src/hooks/api/schema.ts`).
- With `?tab=<mixin>` in the URL, the loading tab stays selected until the mixin tabs exist, so the page does not fall back to details.
- When a schema has a newer version, the form offers keep old, new version, and a technical diff dialog, and the tab label gets a `(vN)` suffix (`MixinsVersionButtons.tsx`, `MixinsTechnicalDialog.tsx`).
- Reference fields use the hooks in `returns/src/hooks/api/` (products, categories, carts, customers, companies, media, segments, custom instances, orders). An `ORDER` reference opens the orders remote at `/apps/management/orders#/<id>`; a product reference opens `/apps/management/products#/<id>` (`returns/src/helpers/hostUrls.ts`). The order reference loads orders of the host's current site (`syncOrders` in `returns/src/hooks/api/orders.ts`), unlike the wizard, which loads orders from every site.
- Site-aware overlays exist in the code and are off unless a caller passes `siteAware`; the return page does not.

Saving a mixin sends `patchReturnCall` with `ReturnUpdateRequest` operations (`returns/src/pages/ReturnEdit.page.tsx`). `ReturnEditOp` defines `ADD`, `REMOVE`, and `REPLACE` (`returns/src/models/Returns.model.ts`). This screen sends only `ADD`:

- Mixins object already has keys: `{ op: ADD, path: /mixins/${key}, value: data }`.
- Otherwise: `{ op: ADD, path: /mixins, value: { [key]: data } }`.
- The same split for `/metadata/mixins/${key}` (value is the schema URL) versus `/metadata/mixins`.

`REMOVE` and `REPLACE` are unused. Whether `ADD` overwrites an existing key is unknown.

Mixin Save and Discard require the form to be dirty, and Save also requires valid, and both require Returns Manager (`returns/src/components/mixins/MixinsForm.tsx`). Inputs on a mixin form are disabled without that permission.

## Who can act

`hasPermission` is true only when every access control of that domain is in the user's set, after higher roles imply lower ones (`returns/src/context/PermissionsProvider.tsx`, `returns/src/helpers/accessControls.ts`). Administrator implies Manager, Manager implies Editor, Editor implies Viewer, repeatedly until nothing new is added.

Employee domains used by returns screens (`returns/src/configs/accessControls.ts`):

| Domain | What this module does with it |
|---|---|
| Returns Manager | Create button, row and batch delete, column and mixin configuration, detail field edits, mixin save. The domain lists the Returns Manager access control and the Configuration Manager access control, so both are required. |
| Returns Viewer | Defined as its own domain. No screen calls `hasPermission` with it. |
| Customers Viewer | Customer list in the wizard. |
| Orders Viewer, or Vendor Orders Viewer | Order list in the wizard, and the view-order button on a saved return. |

Returns API helpers check tenant only. Missing tenant rejects with `No tenant` (`returns/src/hooks/api/returns.ts`). They do not check Returns Viewer or Returns Manager. Server-side enforcement is unknown.

Create stays reachable at `/add` when the list button is disabled (`returns/src/RemoteComponent.tsx`, `returns/src/pages/ReturnsList.page.tsx`). Whether a viewer who opens that URL can create a return is an API question and is unknown here.

Host menu visibility for the returns remote is not in this module.

## Tests

Specs that pin returns behaviour:

- `returns/src/helpers/returnsSiteAccess.test.ts` — site restriction from scopes (unrestricted, suffix list, blank site, first suffixed scope)
- `returns/src/helpers/tables.test.ts` — filters kept on column rebuild, exact site filter next to a date range
- `returns/src/helpers/latestRequest.test.ts` — a slower old request cannot overwrite a newer result

No spec names a return status, create, update, delete, or wizard rule. Mixin suites (`returns/src/components/mixins/*.test.ts`) are the same files as in the orders remote. Other suites:

- `returns/src/helpers/api.test.ts` — HTTP and IAM error parsing
- `returns/src/helpers/schema.helper.test.ts` — mixin column flatten
- `returns/src/helpers/tree.test.ts` — dot-path reads
- `returns/src/helpers/paginationUtils.test.ts` — paging all records
- `returns/src/helpers/utils.test.ts` — empty-value removal
- `returns/src/helpers/localized.test.ts` — locale key case
- `returns/src/helpers/settings.helpers.test.ts` — local dev tenant and token storage

Wizard and edit behaviour above is from the implementation, not from tests.

## Unknown

- HTTP paths, status codes, and whether create, update, patch, or delete is authorized server-side.
- Legal transitions among `PENDING`, `APPROVED`, `REJECTED`, `CLOSED`, and `REVIEWED`.
- Effect of `received`, and the business meaning of `expiryDate`.
- Whether `submitter.userType` or line-level reasons are required.
- Whether the API scopes returns by `siteCode` beyond the `siteCode` filter the list sends, and what sets `siteCode` on create (the create form does not send it).
- Create response fields besides `id`.
- Whether mixin `ADD` replaces an existing key.
- Host route guard that decides who can open the remote.

## Not yet scanned

`returns/src/translations/**`, `returns/src/**/*.scss`, mixin widget internals (`MixinsFormInput.tsx`, `MixinsFormItemTemplate.tsx`, `ReferenceSelector.tsx` rendering, per-type loader bodies in `useReferenceSelectorConfig.tsx`), `returns/src/hooks/api/{schema,iam,configuration}.ts` request shapes, the access-control UUID catalog in `returns/src/configs/accessControls.ts`, and the mixin test bodies. `node_modules`, `dist`, `.env*`, and the synced AI rule folders were skipped.
