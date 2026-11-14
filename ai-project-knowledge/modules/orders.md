# Orders

Last scanned: 05d8d1d (2026-11-06)
Sources: `orders/README.md`, `orders/src/RemoteComponent.tsx`, `orders/src/Orders.module.tsx`, `orders/src/constants/paths.ts`, `orders/src/pages/OrdersList.page.tsx`, `orders/src/pages/OrderView.page.tsx`, `orders/src/contexts/OrderData.provider.tsx`, `orders/src/models/Order.model.ts`, `orders/src/models/PaymentGateway.model.ts`, `orders/src/models/Configuration.model.ts`, `orders/src/models/Schema.model.ts`, `orders/src/hooks/api/orders.ts`, `orders/src/hooks/api/paymentGateway.ts`, `orders/src/hooks/api/invoice.ts`, `orders/src/hooks/api/changelog.ts`, `orders/src/hooks/api/configuration.ts`, `orders/src/hooks/api/featureToggles.ts`, `orders/src/hooks/useOrderRestrictions.ts`, `orders/src/hooks/orders/useEntriesColumns.tsx`, `orders/src/helpers/orders.ts`, `orders/src/helpers/restrictions.ts`, `orders/src/helpers/auditLog/changelog.helpers.ts`, `orders/src/helpers/auditLog/entityChangelog.helpers.ts`, `orders/src/configs/accessControls.ts`, `orders/src/configs/entityLinkConfig.ts`, `orders/src/context/PermissionsProvider.tsx`, `orders/src/context/FeatureTogglesProvider.tsx`, `orders/src/context/ConfigurationProvider.tsx`, `orders/src/components/orders/OrdersTable.tsx`, `orders/src/components/orders/OrdersTableAction.tsx`, `orders/src/components/orders/ChangeStatusDialog.tsx`, `orders/src/components/orders/ExtendedOrderStatusSwitcher.tsx`, `orders/src/components/orders/OrderDocumentActions.tsx`, `orders/src/components/orders/OrderCSVExportDialog.tsx`, `orders/src/components/orders/MasterOrderDialog.tsx`, `orders/src/components/orders/OrderSubOrders.tsx`, `orders/src/components/orders/OrderStatusBadge.tsx`, `orders/src/components/orders/DeliveryTimeForm.tsx`, `orders/src/components/orders/details/OrderDetails.tsx`, `orders/src/components/orders/details/OrderDetailsGeneral.tsx`, `orders/src/components/orders/details/OrderDetailsCustomer.tsx`, `orders/src/components/orders/details/OrderDetailsDelivery.tsx`, `orders/src/components/orders/entries/OrderEntries.tsx`, `orders/src/components/orders/entries/OrderEntriesList.tsx`, `orders/src/components/orders/entries/AddEntryDialog.tsx`, `orders/src/components/orders/entries/OrderEntryExpansion.tsx`, `orders/src/components/orders/legacy/OrderData.tsx`, `orders/src/components/orders/legacy/EntryTable.tsx`, `orders/src/components/orders/legacy/OrderCustomer.tsx`, `orders/src/components/orders/payment/OrderPaymentInfo.tsx`, `orders/src/components/orders/payment/paymentStatus.ts`, `orders/src/components/auditLog/EntityChangelogTab.tsx`, `orders/src/components/auditLog/ChangelogCard.tsx`, `orders/src/helpers/orders.test.ts`, `orders/src/helpers/restrictions.test.ts`, `orders/src/components/orders/payment/paymentStatus.test.ts`, `orders/src/components/orders/entries/AddEntryDialog.tsx`, `orders/src/components/orders/entries/AddEntryDialog.test.tsx`, `orders/src/components/orders/entries/OrderEntriesList.tsx`, `orders/src/components/orders/entries/OrderEntriesList.test.tsx`, `orders/src/components/orders/entries/OrderEntryExpansion.tsx`, `orders/src/components/orders/legacy/EntryTableExpansion.tsx`, `orders/src/helpers/productsBrowser.helpers.ts`, `orders/src/helpers/tables.ts`, `orders/src/helpers/hostUrls.ts`, `orders/src/components/mixins/useMixinsForm.tsx`, `orders/src/components/mixins/MixinsFormBox.tsx`, `orders/src/components/mixins/MixinsAccordionForms.tsx`, `orders/src/components/mixins/MixinsForm.tsx`, `orders/src/components/mixins/useReferenceSelectorConfig.tsx`, `orders/src/components/mixins/localizedMixin.helpers.ts`, `orders/src/components/mixins/localizedObjectLanguages.helpers.ts`, `orders/src/components/mixins/siteAwareMixin.helpers.ts`, `orders/src/context/ReferenceOptionsProvider.tsx`, `orders/src/hooks/api/{carts,categories,customEntities,customInstances,customerManagement,mediaAssets,segments,mixins}.ts`, `orders/package.json`

Management Dashboard orders remote. Hash routes: `/` list, `/:id` detail, any other path redirects to `/` (`orders/src/RemoteComponent.tsx`, `orders/README.md`). Cart, quote, and customer links leave the remote for `/apps/management/{carts,quotes,customers}/:id` (`orders/src/constants/paths.ts`). Master and sub-order links stay inside the remote.

Actors used by the screens: employee `Orders Viewer` / `Orders Manager`, vendor `Vendor Orders Viewer` / `Vendor Orders Manager`, and employee `Audit Log Viewer` (`orders/src/configs/accessControls.ts`). `hasPermission` requires every access control of that domain (`orders/src/context/PermissionsProvider.tsx`). `Customer Orders Viewer` is declared and is not referenced by the order screens. Whether a customer user can open the remote is unknown.

`Orders Viewer` or `Vendor Orders Viewer` is required to list orders. Without either, `fetchOrders` rejects with `No permissions` (`orders/src/hooks/api/orders.ts`). Detail load (`syncOrder`) checks the tenant and does not check those viewer domains. Missing tenant rejects with `No tenant`.

## Order

`Order` fields used by the screens (`orders/src/models/Order.model.ts`): `id`, `status`, `entries`, `customer`, `currency`, `totalPrice`, `totalAuthorizedAmount`, `payments`, `calculatedPrice`, `billingAddress`, `shippingAddress`, `cartId`, `quoteId`, `masterOrder`, `subOrders`, `vendor`, `restriction`, `siteCode`, `deliveryWindow`, `shipments`, `discounts`, `mixins`, `metadata`, `created`.

`OrderStatus`: `IN_CHECKOUT`, `CREATED`, `CONFIRMED`, `DECLINED`, `SHIPPED`, `COMPLETED`. Badge colours are fixed in `OrderStatusColor`.

Well-known mixins: `generalAttributes.extendedOrderStatus`, `invoice` (`invoiceNo`, `invoiceDocument`), `payment.paymentType`, `deliveryTime` (`deliveryTimeFrom`, `deliveryTimeTo`, `deliveryDate`), `deliveryOptions.personalHandover`. Entry mixin `pliPicking.deliveryAmount`. Customer mixin `generalAttributes` (`customerType`, `customerNumber`, `birthday`). Address mixin `customAttributes.vatId`.

An order with `calculatedPrice` uses the current data and entries views. An order without it uses `orders/src/components/orders/legacy/` (`orders/README.md`, `orders/src/pages/OrderView.page.tsx`).

Authorized amount is `totalAuthorizedAmount` when set, otherwise the first payment's `authorizedAmount` (`orders/src/helpers/orders.ts`, `orders/src/helpers/orders.test.ts`).

## List

`OrdersListPage` starts with all sites (`activeSite` false). Choosing a site scopes the list to `currentSite.code` (`orders/src/pages/OrdersList.page.tsx`, `orders/src/hooks/api/orders.ts`). Default page is 10 rows, sort `created` descending (`orders/src/components/orders/OrdersTable.tsx`).

Columns: id, customer name, email (contains), customer id (contains), price, payment method, delivery cycle, created, status. Price filter field is `calculatedPrice.finalPrice.grossValue`; the cell shows that gross value, or `totalPrice` when it is absent. Payment options come from `getPaymentMethods`. Status options are the `OrderStatus` enum plus All. Row expansion shows entries read-only. A row click opens `/:id`. An id with `subOrders.length > 0` opens `MasterOrderDialog` instead of rendering a plain id.

`MasterOrderDialog` shows the master id (in-remote link), customer name, email, and `calculatedPrice.finalPrice.grossValue`, then loads sub-orders (`orders/src/components/orders/MasterOrderDialog.tsx`). Sub-orders are fetched with `syncOrdersNotSiteSpecific`, filter `id: (id1,id2,...)`, page size 100 (`orders/src/components/orders/OrderSubOrders.tsx`).

Column visibility and mixin columns persist under configuration key `ext_orders` (`orders/src/models/Configuration.model.ts`). Configuration comes from `fetchBasicConfiguration` (`orders/src/context/ConfigurationProvider.tsx`).

Site restriction: configuration key `enableSyncBetweenRestrictionsAndSiteCodes` (`orders/src/hooks/api/configuration.ts`). It defaults to enabled until that call returns; a failed call leaves it enabled. Restrictions come from IAM scopes `order.order_read`, `order.order_create`, `order.order_update`, `order.order_post` (`orders/src/hooks/useOrderRestrictions.ts`). An exact scope means unrestricted (`null`). A scope `order.order_read--SITE_A#SITE_B` means those site codes. No matching scope is also `null` (`orders/src/helpers/restrictions.ts`, `orders/src/helpers/restrictions.test.ts`). When sync is on and the current site is outside the list, the table is cleared. On the site-scoped list the UI toasts and switches to the first allowed site. On the all-sites list that toast and switch are skipped.

`buildOrderQueryParams` adds `excludeSuborders: 'true'` only when `isVendorAware` is true and `vendor` is null or undefined (`orders/src/helpers/orders.ts`). The routed list leaves `isVendorAware` at its default `false`, so the list request omits that parameter. `vendor` is the IAM `vendorId` (`orders/src/context/PermissionsProvider.tsx`).

## List actions

Manager is `Orders Manager` or `Vendor Orders Manager`. Viewer row actions are disabled when that is absent (`orders/src/components/orders/OrdersTableAction.tsx`).

- Open detail.
- Delete one order via `deleteOrder`, or batch-delete the selection with `Promise.all` (`orders/src/components/orders/OrdersTable.tsx`).
- Change status: dialog loads `getPossibleStatusChanges`. Submit calls `changeSalesOrderStatus`. Empty possible list shows the no-statuses message and disables submit (`orders/src/components/orders/ChangeStatusDialog.tsx`).
- Invoice PDF: when `mixins.invoice.invoiceDocument` is set, `getOrderInvoiceLink` supplies the link. The action stays disabled until that link exists.
- CSV: date range, `getOrdersToCsv` paged until exhausted (`orders/src/hooks/api/orders.ts`, `orders/src/components/orders/OrderCSVExportDialog.tsx`). Columns: order id, created date, customer name, company, customer type, shipping zip, shipping city, customer number, status, invoice number, payment type. `customerType === 'private'` maps to private; every other value maps to company. Payment types mapped: `paymentByInvoice`, `paymentByDebit`, `paymentByCash`, `paymentByCredit`; anything else is an empty cell. The CSV button is not gated by the manager domain.

## Detail

`OrderDataProvider` loads `getOrder` for the route id. A falsy body is treated as not found and passed to the host `onError`. A failed load shows retry (`orders/src/contexts/OrderData.provider.tsx`, `orders/src/pages/OrderView.page.tsx`).

Header: status dropdown and Save / Discard. The dropdown is disabled without manager. Options are the possible statuses from `getPossibleStatusChanges`, plus the current status (disabled when it is not in that list). Discard calls `refreshData`.

Save: the page re-fetches the order and compares entry `id` and `amount`. When they differ and `canSaveEntries` is true, Save sends `putOrder` with the local order and does not call the status API. Otherwise Save calls `changeSalesOrderStatus` with the dropdown value. `canSaveEntries` is false when status is `COMPLETED`. When the order is not completed and authorized amount is undefined, it is true. Otherwise the gross final price (`calculatedPrice.finalPrice.grossValue`, or `totalPrice`) must be less than or equal to the authorized amount.

Tabs, in order: order data, entries, payment when feature toggle `PAYMENT_GATEWAY` is enabled, one tab per order mixin schema, audit log when `Audit Log Viewer` is held. `isToggleValid` is true only when a toggle with that code has `isEnabled` (`orders/src/context/FeatureTogglesProvider.tsx`).

### Order data

Calculated orders (`orders/src/components/orders/details/OrderDetails.tsx`, `OrderDetailsGeneral.tsx`): net/gross subtotal, fees, shipping, discounts (shown negated), uplift, final price, tax lines with a tax rate, total tax. Side fields: cart link, quote link when `quoteId` is set, master-order link when `masterOrder` is set, first payment method uppercased, extended status, vendor name or id, restriction when set. Sub-orders render under the general section when `subOrders` is non-empty. Customer block shows id, email, first and last name, billing address, and `customer.type` from `syncCustomer` (`orders/src/components/orders/details/OrderDetailsCustomer.tsx`). Delivery block is the delivery-time form plus shipping address (`orders/src/components/orders/details/OrderDetailsDelivery.tsx`).

Legacy orders (`orders/src/components/orders/legacy/OrderData.tsx`): same document actions, `OrderInfo`, customer (host customer link in `orders/src/components/orders/legacy/OrderCustomer.tsx`), shipping address, delivery-time form, invoice block. The current customer section does not use `HOST_CUSTOMER_PATH`.

Extended status is `mixins.generalAttributes.extendedOrderStatus`. Options come from `configuration.extendedOrderStatuses` (`orders/src/components/orders/ExtendedOrderStatusSwitcher.tsx`). When the current status has `possibleTransitions`, the dropdown is those transitions plus the current status disabled. With no `possibleTransitions`, every configured status is selectable. Save patches the order with the new mixin value. The badge label is `displayText` in title case, or `--` when the id is unknown (`orders/src/components/orders/OrderStatusBadge.tsx`). Which configuration document fills `extendedOrderStatuses` beyond `fetchBasicConfiguration` is unknown.

Delivery time (`orders/src/components/orders/DeliveryTimeForm.tsx`) is editable only while status is `CREATED` and the user can manage. Save patches `{ mixins }` (`deliveryTimeFrom`, `deliveryTimeTo`, `deliveryDate`). `personalHandover === true` displays the global "no" label; `false` displays "yes"; a missing `deliveryOptions` displays the empty placeholder.

### Entries

Calculated entries (`orders/src/components/orders/entries/OrderEntries.tsx`): when status is not `COMPLETED` and authorized amount is below `calculatedPrice.finalPrice.grossValue`, a warning is shown. Add entry is hidden when status is `COMPLETED` or the list is read-only, and disabled without manager (`orders/src/components/orders/entries/OrderEntriesList.tsx`). A quantity change posts the full deduplicated entry list immediately via `addEntries` (`orders/src/hooks/orders/useEntriesColumns.tsx`). Quantity `0` is a legal value on that call.

Add-entry dialog (`orders/src/components/orders/entries/AddEntryDialog.tsx`, tests in `AddEntryDialog.test.tsx`), built on the component-library `ProductsBrowser` (CL 2.18.0, `orders/package.json`):

- Two views, list and tree. Columns: image, name, id, code, product type. The image is the first media item that is an image (or has no content type), resized to a 32x32 thumbnail (`orders/src/helpers/productsBrowser.helpers.ts`).
- Products load through `syncPaginatedProducts`. A selected category loads the products of its whole branch, via `withCategoryScope` from `@emporix/api-calls` (test `loads the products of the whole branch of a selected category`).
- The category tree loads only when the user holds `Categories Viewer`; otherwise the tree is not requested and the empty-tree label is the no-permissions text (test `does not request the tree without access to categories`). Nodes come from `toProductsBrowserCategoryNodes`, with a published dot. A failed tree or product load shows a categories or products error toast.
- Each row has a frozen right-hand quantity stepper (minimum 0). Setting `0` removes the pick; the same product is never picked twice. Picks show as a chip row (`{qty}x name`) above the table; the row keeps its height when empty. Each chip can be removed.
- Add posts `{ productId, quantity }` for the picks, merged with `newEntries` and replacing a pending entry for the same product (`addNewEntriesFromProducts` in `orders/src/helpers/orders.ts`). The button is disabled with no picks.
- While saving: the button shows loading, the steppers and chip removal are locked, the dialog cannot be closed, and a second click does not submit again (tests `locks the picks and cannot be closed while saving`, `does not save twice when the button is clicked again during the save`). On success the order is replaced with the response and the dialog closes and clears the picks. On failure a toast with the API error shows and the picks stay for another try (test `keeps the picks for another try when saving fails`).

Expanding a row (`orders/src/components/orders/entries/OrderEntryExpansion.tsx`) shows the `ORDER_ENTRY` mixins as one accordion with one shared Save and Discard, as in MD. Save patches the order with the full `entries` array: the saved schemas' values are merged into that entry's `mixins` and their schema urls into `metadata.mixins`. Collapsing a row with unsaved accordion edits asks for confirmation. The table reads expanded rows both as Prime's `{ [id]: true }` map and as a row array (`getExpandedIds` in `orders/src/helpers/tables.ts`; tests `OrderEntriesList` and `getExpandedIds`, COP-6917).

Legacy entries (`orders/src/components/orders/legacy/EntryTable.tsx`): editable when the table is not read-only and status is not `COMPLETED`. The stepper edits `orderedAmount` with minimum 1 and posts immediately. Delete posts that product with quantity `0`. Delivered quantity is `mixins.pliPicking.deliveryAmount` and is display-only. The add button is disabled when status is `COMPLETED`. The authorized-amount warning compares `totalPrice` with the authorized amount.

Order-level mixin tabs use `SchemaType.ORDER`: one tab per schema, with a disabled loading tab while schemas load. Save patches `mixins[key]` and `metadata.mixins[key]` to the schema url (`orders/src/pages/OrderView.page.tsx`, `orders/src/models/Schema.model.ts`). With `?tab=<mixin>` in the URL, the loading tab stays selected until the mixin tabs exist, so the page does not jump to Data.

See `## Mixins` for how mixin forms behave.

### Documents

`OrderDocumentActions` (`orders/src/components/orders/OrderDocumentActions.tsx`), on both data views:

| Action | Call | Extra gate |
|---|---|---|
| Print delivery note | `orderDeliveryNote`; response opened as `application/pdf` | — |
| Send delivery confirmation | `sendShippingConfirmation` | extended status number `< 60` |
| Create / send invoice | `sendInvoiceJob(orderId)` when `PAYMENT_GATEWAY` is on; otherwise `sendInvoice(order)` | extended status number `< 70` |

All three are disabled without manager, or when status is `CREATED` or `DECLINED`. Extended status is `parseInt` of the mixin (`orders/src/helpers/orders.ts`). `NaN < 60` is false, so a missing extended status does not add that gate (`orders/src/helpers/orders.test.ts`). After success or failure the order is refreshed. `getInvoiceJobStatus` is returned by `orders/src/hooks/api/invoice.ts` and has no caller in `orders/src`. `recalculateOrder` is returned by `orders/src/hooks/api/orders.ts` and has no caller in `orders/src`.

## Payment

The payment tab renders only when `PAYMENT_GATEWAY` is enabled. It uses `payments[0]` (`orders/src/components/orders/payment/OrderPaymentInfo.tsx`): provider, method, transaction id, status, authorized amount, paid amount, `paymentResponse`. The transaction is `fetchTransaction(transactionId)`.

Status colours (`orders/src/components/orders/payment/paymentStatus.ts`, `paymentStatus.test.ts`): `PENDING` info; `AUTHORIZATION_FAILURE`, `CAPTURE_FAILURE`, `CANCELLATION_FAILURE`, `FAILURE` danger; `AUTHORIZATION_SUCCESS`, `CAPTURE_SUCCESS`, `SUCCESS`, `CANCELLATION_SUCCESS` success; any other status warning. Transaction type: `AUTHORIZATION`, `AUTHORIZATION_START`, `AUTHORIZATION_CALLBACK` info; `CANCEL` danger; `CAPTURE` success; other types (including `REFUND`) warning.

Refund is shown only when payment status is `CAPTURE_SUCCESS`. Max amount is `order.totalPrice` minus the sum of transaction entries whose type is `REFUND`. Submit calls `refundCall` with the entered amount and `order.currency`, then reloads the transaction. The input is read-only and the button disabled without manager, or when the amount is `0` or null.

## Mixins

The mixin forms are a port of the Management Dashboard mixins (`orders/src/components/mixins/`); the same code is copied into the returns remote. Order tabs, entry accordions, and legacy entry expansions all use `useMixinsForm`.

- Load (`orders/src/components/mixins/useMixinsForm.tsx`): schemas and references for the schema type (`ORDER`, `ORDER_ENTRY`; legacy entries pass no type) are merged with the schema urls already stored in `metadata.mixins`. Urls that are not Emporix schema or reference urls are mapped to schemas directly. A schema that fails to load is logged and skipped. A newer request supersedes an older one, so a slow earlier load cannot overwrite the current forms. A failed reload clears the forms.
- Versions: when a schema has several versions, the form shows the stored (present) version and the newest one, with buttons to keep the old one, move to the new one, and open a technical diff dialog (added and deleted attributes). Tab labels get a `(vN)` suffix when a newer version exists (`MixinsVersionButtons.tsx`, `MixinsTechnicalDialog.tsx`; test `COP-5948 mixins schema-upgrade field filtering` in `mixinsFilter.test.ts`).
- Field types: text, number (decimal precision follows `multipleOf`), boolean, enum, date and time, reference, nested objects, arrays, and localized values (`helpers.ts`, `MixinsFormInput.tsx`, `MixinsFormArray.tsx`). Read-only schema attributes are not editable; required and nullable come from the schema. Labels are resolved by dotted path so nested attributes keep their own names.
- Localized values: v1 is an array of language/value entries; v2 is a map keyed by language, including localized OBJECT fields and arrays of localized values. Language tabs switch the language, mark languages with content, and flag languages missing required children (`localizedMixin.helpers.ts`, `localizedObjectLanguages.helpers.ts`, `MixinsLanguageTabs.tsx`). Values are serialized back to the stored shape on save (tests `serializeLocalizedFields...`, `product mixin v1/v2 PATCH shape`).
- References: types are `PRODUCT`, `ORDER`, `CART`, `CUSTOMER`, `COMPANY`, `MEDIA`, `PRICE_LIST`, `CUSTOMER_SEGMENT`, `CATEGORY`, plus every custom entity id (`ReferenceOptionsProvider` loads custom entities on boot). The selector searches or loads by id and resolves ids to labels through the matching hook in `orders/src/hooks/api/`. The operator can open a referenced item. Product, cart, customer, company, media, category, price-list, segment, and custom-instance links leave the remote for host routes (`orders/src/helpers/hostUrls.ts`, `orders/src/constants/paths.ts`). An `ORDER` reference opens `/:id` inside this remote. Product links use the products remote's hash route `/apps/management/products#/<id>`. Each reference type checks its own viewer and manager domain (`useReferenceSelectorConfig.tsx`).
- Save and discard (`MixinsForm.tsx`): Discard needs a dirty form, Save needs dirty and valid, and both need the manager permission passed in (`canManage` on the order page, `!readonly` on entries). Inputs are disabled without it. Entry accordions save all schemas at once; a Save is blocked when any schema is invalid (`MixinsAccordionForms.tsx`).
- Site-aware mixins (per-site overlays, `siteAwareMixin.helpers.ts`, `MixinsFormBox.tsx`) are implemented but only active when the caller passes `siteAware`. No orders screen passes it.
- Tests pinning the port: `helpers.*.test.ts`, `localizedMixin.helpers.test.ts`, `localizedObjectLanguages.helpers.test.ts`, `siteAwareMixin.helpers.test.ts`, `mixinsFilter.test.ts`, `productMixinSave.v1.test.ts`, `productMixinSave.v2.test.ts` (all under `orders/src/components/mixins/`).

## Audit log

The tab calls `getChangelogs` with filter `{ entity: 'order', entityId }` and pagination `{ currentPage, rows }` (`orders/src/hooks/api/changelog.ts`, `orders/src/helpers/auditLog/changelog.helpers.ts`). The request runs only while the tab is active (`orders/src/components/auditLog/EntityChangelogTab.tsx`). Empty `totalElements` shows the empty state. Each card shows actor, change type, time, related-entity badge, and path diffs (`orders/src/components/auditLog/ChangelogCard.tsx`). Related items that are the same entity and id are omitted (`orders/src/helpers/auditLog/entityChangelog.helpers.ts`). Only entity type `order` is linked, to `/:id`; other types render as text (`orders/src/configs/entityLinkConfig.ts`). Change-type label lookup is `auditLog.changeTypes.<ui key>` (`orders/src/components/auditLog/ChangelogChangeTypeBadge.tsx`). The mapping inside `@emporix/api-calls` `ChangelogChangeType.toUi` is unknown.

## Tests named

Behaviour specs: `orders/src/components/orders/entries/AddEntryDialog.test.tsx` (add-entry flow, saving lock, category tree), `orders/src/components/orders/entries/OrderEntriesList.test.tsx`, `orders/src/helpers/productsBrowser.helpers.test.ts` (`toProductRow`), `orders/src/helpers/tables.test.ts` (`getExpandedIds`), the mixin suites listed under Mixins, `orders/src/helpers/orders.test.ts` (`orders helpers`), `orders/src/helpers/restrictions.test.ts` (`parseRestrictions`), `orders/src/components/orders/payment/paymentStatus.test.ts` (`payment severities`). Other suite names, bodies unread: `escapeCsvCell`, `mapToCsv`, `getStoredSettings`, `shouldOpenDevSettingsDialog`, `saveStoredSettings`, `createForm`, `fetchAllRecords`, `getApiErrorStatus`, `IAM ErrorResponse parsing`, `platform validation-style error parsing`, `getConflictErrorToast`, `getValueFromPath`, `textToTitleCase`, `removeEmptyValues`, `removeObjectEmptyValues`, `toChangelogPagination`, `toChangelogOptions`, `ChangelogChangeType`, `flatten`, `parseMixinColumns`, `localizedKeysToLowerCase`, `buildRelatedEntityBadgeLabel`, `getOtherRelatedItems`, `getChangeTypeKey`, `formatChangelogValue`, `filterMeaningfulChangelogPaths`, `trimCloudinaryImage`.

A host tenant switch does not remount the remote. `FeatureTogglesProvider` applies toggles, errors and the end of loading only for the tenant that is still current, and `SitesProvider` clears `sites` and `currentSite` on a tenant or token change and ignores a late response for the previous tenant, so no other tenant's site code reaches a form (`orders/src/context/tenantSwitch.test.tsx`).

## Host wiring

| Fact | Value |
|---|---|
| Kind | playbook-aligned (`orders/package.json`) |
| Federation `name` | `orders` (`orders/vite.config.ts`) |
| Host route `key` → path | `orders` → `apps/management/orders/*` (`management-dashboard` `src/router/module-routes.tsx`) |
| Host env var | `VITE_ORDERS_URL` (`management-dashboard` `.env.*`) |
| Local port | `5177`, `strictPort` |
| Local deviations | none |

## Not yet scanned

`orders/src/translations/**` (i18n bodies), `orders/src/**/*.scss`, `orders/src/index.css`, `orders/src/App.tsx`, `orders/src/api/bootstrap.ts`, `orders/src/api/sites.ts`, `orders/src/hooks/api/schema.ts`, `orders/src/hooks/api/iam.ts`, `orders/src/hooks/api/customers.ts` request shapes, `orders/src/helpers/api.ts` error-body parsing, mixin field widget internals (`MixinsFormInput.tsx`, `MixinsFormItemTemplate.tsx`, `ReferenceSelector.tsx` rendering), per-reference-type loader bodies other than `ORDER`/`PRODUCT`, shared chrome under `orders/src/components/shared/` beyond the list/detail calls above, `useSubOrdersColumns.tsx` and `useSubOrderEntriesColumns.tsx` column sets, `OrderTooltip.tsx` and the price-row components, the access-control UUID catalog and non-order domains in `orders/src/configs/accessControls.ts`, `.github/`, `.claude/`, `.cursor/`, and the test bodies listed as names only. `node_modules`, `dist`, and `.env*` were skipped.
