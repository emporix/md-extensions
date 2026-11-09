# Coupons

Last scanned: d8edeb2 (2026-11-06)
Sources: `coupons/README.md`, `coupons/package.json`, `coupons/vite.config.ts`, `coupons/src/RemoteComponent.tsx`, `coupons/src/Coupons.module.tsx`, `coupons/src/constants/paths.ts`, `coupons/src/pages/` (all), `coupons/src/components/coupons/` (all), `coupons/src/components/shared/{Customers,Segments,Categories,Vendors}Selector.tsx`, `coupons/src/components/shared/PriceInput.tsx`, `coupons/src/context/{Coupon,Currency}.provider.tsx`, `coupons/src/hooks/api/{coupons,customers,segments,categories,vendors,currencies}.ts`, `coupons/src/hooks/{useCouponPermissions,useCouponsColumns,useCurrencies}.ts(x)`, `coupons/src/helpers/coupon*.helpers.ts` (+ tests), `coupons/src/configs/entityLinkConfig.ts`, `coupons/src/translations/`, `docs/MIGRATED_MODULES.md`

Management Dashboard (MD) Management → Coupons as a Vite federated remote, extracted in COP-7188 (`docs/MIGRATED_MODULES.md`). Federation name `coupons` (the MD route key, unchanged), exposes `./RemoteComponent` (named and default), local port `5181` with `strictPort` (`coupons/vite.config.ts`). Tier 1 providers, shared UI and session code come from `status-codes`; the table extensions (column visibility, mixin columns), the mixins subsystem and the audit log tab from `orders`; `PriceInput`, `useCurrencies` and the categories selector from `products`. The only widget the remote needed from the component library that it lacked, `Divider`, was promoted in `@emporix/component-library` 2.19.0.

## Record

`Coupon` is the type exported by `@emporix/api-calls` (with `DiscountType`, `MoneyAmount`, `ValidationError`). Discount type `PERCENT`, `ABSOLUTE` or `FREE_SHIPPING`; validity dates, minimum order value; audience restriction (all, registered, specific customers by customer number, segments, included/excluded categories); optional vendor restriction; mixins. The code is the key in URLs and API paths.

- New form (`createCouponForm`): `ABSOLUTE`, amount 0, calculation base `SUBTOTAL`, audience "registered customers", no vendor restriction.
- Validation, payload mapping (edit replaces the whole coupon by `PUT`, so the payload starts from the stored coupon and rewrites only the changed groups), audience flags and save-error mapping are the MD helpers moved as they are: `coupons/src/helpers/coupon{Form,Validation,Restrictions,Errors,Currency}.helpers.ts`, pinned by the tests next to them. Details of each rule: `management-dashboard` `ai-project-knowledge/modules/coupons-and-delivery.md` § Coupons.

## API

`useCouponsApi` (`coupons/src/hooks/api/coupons.ts`) binds `fetchCoupons` (server-side page, sort and `q` filters), `fetchCoupon`, `createNewCoupon` (resolves to the code), `modifyCoupon` (`PUT` by the original code), `patchCouponCall` (mixins only) and `removeCoupon` to the host tenant. Paths per api-calls: `/coupon/{tenant}/coupons[/{code}]`. The selectors use `getCustomers` (only with `Customers Viewer`), `getSegmentsCall`, `getCategories` and `getVendorsCall`; currencies come from `fetchCurrencies`, loaded once per edit page (`CurrencyProvider`).

## Routes

Hash routes (`coupons/src/constants/paths.ts`, `coupons/src/RemoteComponent.tsx`): `/` list, `/add` create (case-sensitive), `/:code` edit; other paths redirect to `/`. The code is URL-encoded into one path segment (`SALE#1` → `#/SALE%231`); the add/edit route is keyed by code so `add` → created coupon remounts the form (`coupons/src/pages/CouponRoute.tsx`).

## Permissions

`Coupons Viewer` can view — without it the module renders "No permissions" and requests nothing (`coupons/src/Coupons.module.tsx`; the host only hides the menu entry). `Coupons Manager` is needed for Add, row and batch delete, Save, Discard, field changes and mixin saves. An audience or vendor restriction is editable only when the operator manages coupons **and** can view the restricted entity (`Customers Viewer`, `Segments Viewer`, `Categories Viewer`, `Vendors Viewer`); categories are also locked for free-shipping coupons. `Audit Log Viewer` shows the Audit log tab (`coupons/src/hooks/useCouponPermissions.ts`). Permissions come from the remote's own `PermissionsProvider`.

## List

`CouponsTable` (`coupons/src/components/coupons/CouponsTable.tsx`):

- Server-side paging, sorting and filters. Columns code, name, discount type (dropdown filter), discount percentage, discount amount (`MoneyValue`), redemption count (number filter), category coupon (true/false filter). Percentage and amount are not filterable (the service returns no rows for them). Every filter can be cleared: code, name and redemption count with the column clear button, discount type and category coupon with the dropdown's × (CL `Dropdown` `showClear`, 2.22.0).
- Column visibility and coupon mixin columns are stored under the configuration key `ext_coupons` (`TableExtensions`), the same shape MD used.
- Row click and row edit open `/:code`. Delete (row or batch) asks for confirmation, deletes in parallel, shows one summary toast (failed codes with their messages plus the deleted ones), keeps only failed rows selected and reloads. A page that comes back empty after deletes steps back to the last page with rows.
- A host tenant switch drops the rows and the selection. The configuration, feature-toggle, reference-option and sites providers ignore a late response for the previous tenant (`coupons/src/context/tenantSwitch.test.tsx`).

Pinned by `coupons/src/pages/Coupons.page.test.tsx`.

## Create and edit

`CouponPage` (`coupons/src/pages/Coupon.page.tsx`): header "Coupon" (name as subtitle), back to the list, Discard and Save in the header; tabs General (name, code, description), Type (discount type, percentage with a `%` addon or amount + currency, calculation base), Rules (validity and value, divider, "applies to" cards, divider, vendor restriction), then mixin tabs and the Audit log tab (edit only; the audit tab is shown disabled on create). All tabs stay mounted so validation covers them.

- The code is read-only after create.
- Save: an invalid form shows the field messages, jumps to the first tab with an error and toasts "Please correct the highlighted fields". A rejected save maps service field errors onto the fields and their tab; HTTP 409 on create marks the code as a duplicate.
- Create: success toast, then the page switches to `/:code` (replace). Update: `PUT` by the original code, success toast, form reset, coupon reloaded.
- A code that cannot be loaded shows an error toast and goes to the list.
- A host tenant switch on the add/edit page goes to the list without reloading the coupon under the new tenant (`coupons/src/pages/CouponRoute.tsx`, MD parity).
- Mixin save is a `PATCH` of `mixins` and `metadata.mixins`.

Pinned by `coupons/src/pages/Coupon.page.test.tsx`.

## Audit log links

`coupons/src/configs/entityLinkConfig.ts` links only `coupon` entities (in-remote `/:code`); other entity types render as plain text. Mixin reference fields to orders, carts and customers leave the remote with `window.location.assign` (`coupons/src/helpers/hostUrls.ts`; orders as `/apps/management/orders#/<id>`).

## Translations

`coupons/src/translations/{en,de}/coupons.ts` keep MD's `coupons.*` keys; `auditLog`, `errors`, `mixins`, `navigation` and `global` come with the copied shared code. EN and DE key parity and the absence of `primereact` are pinned by `coupons/src/translations/translations.test.ts`.

## Host wiring

| Fact | Value |
|---|---|
| Kind | playbook-aligned |
| Federation `name` | `coupons` (`coupons/vite.config.ts`) |
| Host route `key` → path | `coupons` → `/apps/management/coupons/*` (`management-dashboard` `src/router/module-routes.tsx`) |
| Host env var | `VITE_COUPONS_URL` (`management-dashboard` `.env.*`) |
| Host deep link | `management-dashboard` `src/helpers/couponsUrl.helpers.ts` (`/apps/management/coupons#/<encoded code>`, audit log) |
| Local port | `5181`, `strictPort` |
| Hosting | Firebase targets `emporix-coupons`, `-stage`, `-develop`; `.github/workflows/coupons-firebase-*.yaml` |
| Staying in MD | `src/hooks/api/coupons.ts` for the segments coupon tab and the customer referral coupon |
| Local deviations | `CurrencyProvider` around the edit page (MD had a host-wide one) |

## Not yet scanned

- Tier 1 copies shared with `status-codes` and `orders` (providers, IAM hooks, mixins, audit log) — see `ai-project-knowledge/modules/status-codes.md` and `ai-project-knowledge/modules/orders.md`.
