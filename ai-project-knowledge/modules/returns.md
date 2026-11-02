# Returns

Last scanned: da99643 (2026-11-02)
Sources: `returns/...`

Operator UI for returns inside the Management Dashboard. This remote does not own return persistence. HTTP paths and server rules live in `@emporix/api-calls`, which this module calls and does not define (`returns/src/hooks/api/returns.ts`). What the return service accepts, rejects, or emits is unknown from this repo.

Actor: a dashboard user. The host passes `appState` (`tenant`, `language`, `token`, optional `currency`, `contentLanguage`, optional `user`, `onError`) into `RemoteComponent` (`returns/README.md`, `returns/src/models/AppState.model.ts`). `user` seeds the submitter on create (`returns/src/contexts/ReturnForm.provider.tsx`). Permissions are loaded here from IAM, not from `appState` (`returns/README.md`, `returns/src/context/PermissionsProvider.tsx`).

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

List row `Return` (`returns/src/models/Returns.model.ts`): `id`, `approvalStatus`, `expiryDate`, `requestor` (`customerId`, `firstName`, `lastName`, `email`), `metadata`.

Detail `ReturnDetails`: those ideas plus `reason` (`code`, `details`), `submitter` (`userType`, `firstName`, `lastName`, `email`), `received`, optional `total` (`value`, `currency`), optional `calculatedPrice.finalPrice` (`grossValue`, `netValue`, optional `taxValue`, optional `currency` from `returns/src/models/Order.model.ts`), `orders`, `mixins`, `expiryDate`.

Each `ReturnOrder` is `id` plus `items`. An item has `id`, `name`, `quantity`, optional `reason`, `total`, `unitPrice`, and optional calculated prices.

`approvalStatus` is `ReturnStatus`: `PENDING`, `APPROVED`, `REJECTED`, `CLOSED`, `REVIEWED` (`returns/src/models/Returns.model.ts`). The detail dropdown lists every value (`returns/src/components/returns/ReturnEditDetails.tsx`). This module has no allowed-transition table. Which changes the API stores is unknown.

`received` is a boolean the manager can toggle (`returns/src/components/returns/ReturnEditDetails.tsx`). No further effect is implemented here.

`expiryDate` and `metadata.createdAt` are shown and are not inputs (`returns/src/components/returns/ReturnEditDetails.tsx`, `returns/src/components/returns/ReturnsTable.tsx`). What `expiryDate` means in the return service is unknown.

`Metadata` allows `createdAt`, `modifiedAt`, `version`, and any other key (`returns/src/models/Metadata.model.ts`). Mixin schema URLs are read from `metadata.mixins` (`returns/src/pages/ReturnEdit.page.tsx`).

Order and customer types here are a subset used by the wizard (`returns/src/models/Order.model.ts`, `returns/src/models/Customer.model.ts`). An order line `Entry` has `id`, `amount`, numeric `unitPrice` and `totalPrice`, `product`, and optional calculated prices. Customer fields used: `id`, `firstName`, `lastName`, `email`, `company`.

## List

`ReturnsListPage` shows a create button and `ReturnsTable` (`returns/src/pages/ReturnsList.page.tsx`).

Load: `getReturnsCall(tenant, pagination)` (`returns/src/hooks/api/returns.ts`). Default page is 10 rows, sort `metadata.createdAt` descending (`returns/src/components/returns/ReturnsTable.tsx`). Columns: requestor first name, last name, created at, id, expiry date, approval status. All of those filter and sort. Status filter options are an explicit All value plus every `ReturnStatus`. The list refetches when `currentSite.code`, pagination, tenant, or the refresh flag changes. The returns hook does not pass a site code. Whether the API call is site-scoped is unknown.

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

Details save sends the whole `ReturnDetails` through `updateReturnCall`, then reloads (`returns/src/pages/ReturnEdit.page.tsx`). Discard reloads from the API. Save is enabled only when the form is dirty and valid. The same reason rule as create applies: code or details must be non-blank. `received` and `approvalStatus` are not in that schema.

With Returns Manager, the operator can change status to any `ReturnStatus`, reason code, reason details, and `received` (`returns/src/components/returns/ReturnEditDetails.tsx`). Without it those controls are disabled or read-only. Created date, expiry date, and submitter name are display-only. The details Save and Discard buttons are not themselves permission-checked; a viewer cannot dirty those fields through the controls.

Orders on the detail are read-only (`returns/src/components/returns/ReturnEditDetails.tsx`, `returns/src/components/returns/ReturnEditDetailsExpansion.tsx`). Expansion columns: item id, name, reason code, reason details, quantity, line money. Line money is `calculatedPrice.finalPrice.grossValue`, or `total.value` when that gross value is absent. Header total uses the same gross-value fallback against `returnDetails.total.value`, with currency `total.currency` (empty string when `total` is absent). The total row is omitted when both the gross value and `total.value` are absent. View order leaves for the host order path and is disabled unless the user has Orders Viewer or Vendor Orders Viewer.

## Mixin tabs

Schemas and references are loaded for type `RETURN`, merged with schema URLs already stored on the return (`returns/src/components/mixins/useMixinsForm.tsx`, `returns/src/pages/ReturnEdit.page.tsx`). One tab per merged schema that has `metadata.url`. A schema that fails to load is logged and skipped. The remote does not author schemas (`returns/src/hooks/api/schema.ts`).

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

No spec names a return status, create, update, delete, or wizard rule. Suites found:

- `returns/src/helpers/api.test.ts` — HTTP and IAM error parsing
- `returns/src/helpers/schema.helper.test.ts` — mixin column flatten
- `returns/src/helpers/tree.test.ts` — dot-path reads
- `returns/src/helpers/paginationUtils.test.ts` — paging all records
- `returns/src/helpers/utils.test.ts` — empty-value removal
- `returns/src/helpers/localized.test.ts` — locale key case
- `returns/src/components/mixins/helpers.test.ts` — mixin form defaults
- `returns/src/helpers/settings.helpers.test.ts` — local dev tenant and token storage

Behaviour above is from the implementation, not from tests.

## Unknown

- HTTP paths, status codes, and whether create, update, patch, or delete is authorized server-side.
- Legal transitions among `PENDING`, `APPROVED`, `REJECTED`, `CLOSED`, and `REVIEWED`.
- Effect of `received`, and the business meaning of `expiryDate`.
- Whether `submitter.userType` or line-level reasons are required.
- Site filter on the returns list.
- Create response fields besides `id`.
- Whether mixin `ADD` replaces an existing key.
- Host route guard that decides who can open the remote.
