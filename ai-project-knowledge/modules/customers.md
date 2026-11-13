# Customers

Last scanned: written with COP-7185 (2026-11-12)
Sources: `customers/README.md`, `customers/package.json`, `customers/vite.config.ts`, `customers/src/RemoteComponent.tsx`, `customers/src/constants/paths.ts`, `customers/src/models/Customer.model.ts`, `customers/src/hooks/api/{customers,coupons,iam,segments,configuration}.ts`, `customers/src/helpers/customerForm.helpers.ts`, `customers/src/components/customers/`, `customers/src/pages/*.page.tsx`, `customers/src/translations/`, `customers/src/**/*.test.ts(x)`, `docs/MIGRATED_MODULES.md`

Management Dashboard (MD) Customer Management → Customers as a Vite federated remote, extracted in COP-7185 (`docs/MIGRATED_MODULES.md`). A customer is a record of the Customer Service (`caas-customer`), with addresses, mixins and B2B legal-entity assignments. Federation name `customers`, exposes `./RemoteComponent` (named and default), local port `5184` with `strictPort` (`customers/vite.config.ts`). Tier 1 providers, session code, column visibility, mixins, audit log, restriction parsing and `useCustomerApi` come from `companies`. Needs component library ≥ 2.26.0 (password `InputText` eye toggle).

## Records

`customers/src/models/Customer.model.ts` (MD shapes): id, customer number (read-only), title (`MRS`, `MS`, `MR`), first and last name, contact email and phone, preferred site and currency, `onHold`, `active`, `restriction` (one value or `null`), `businessModel` (`B2B` default, not editable), `b2b.legalEntities` (read-only), `password` (create only), `addresses`, `mixins` and `metadata.mixins`, `metadataCreatedAt`, `lastLogin`. An address has an id (editable before it is saved), contact name, company name, street, appendix, number, city, zip code, country, tags, contact phone, `isDefault`, mixins.

## API

`useCustomerApi` (`customers/src/hooks/api/customers.ts`) binds the api-calls customer calls to the host tenant; the list call rejects without Customers Viewer (the list stays empty, as in MD). Create sends `sendPasswordResetNotifications` from api-calls (`true` unless the type is `CONTACT`). Edit uses `updateCustomer` (PATCH); mixins use `patchCustomerCall`. Addresses are saved one at a time: `addCustomerAddress`, `updateCustomerAddress`, `patchCustomerAddress` (address mixins), `removeCustomerAddress`. Other calls: `fetchCoupons` with `issuedTo:<id> referralCoupon:true` (`hooks/api/coupons.ts`), `getAllGroupsForUserCall` (IAM groups of the customer), `getSegmentsCall` with `customerId` (all pages), configurations `restrictions` and `enableSyncBetweenRestrictionsAndSiteCodes`, and `getAssistedBuyingLoginCall`.

## Routes

Hash routes (`customers/src/constants/paths.ts`, `customers/src/RemoteComponent.tsx`), mirroring MD's former pathnames; ids are URL-encoded:

| Path | Page |
|---|---|
| `/` | `pages/CustomersList.page.tsx` |
| `/add`, `/:customerId` | `pages/CustomerAddEdit.page.tsx` (`?tab=`) |

Other paths redirect to `/`. Segment (`/customer-management/segments/:id?backTo=`), company (`/apps/management/companies#/<id>?customerId=<customer>`, so the company page returns here) and customer-group (`/administration/customer-groups#/groups/:id`) links are host routes, opened with `window.location.assign`. A host tenant switch sends the edit page back to the list and drops the list rows of the previous tenant.

## Permissions

Customers Viewer views; Customers Manager is needed to create, edit, delete, save, discard and change addresses and mixins (controls render disabled or read-only otherwise, as in MD). The audit log tab needs Audit Log Viewer. Restrictions come from the `customer.customer_manage` / `customer.customer_read` scopes (`--site1#site2` suffix, `helpers/restrictions.ts`); `null` means full access. Assisted buying needs the `customer.assistedBuying_manage` scope and the `DCP_ASSISTED_BUYING` feature toggle.

## List

`components/customers/CustomersTable.tsx`: lazy table, 10 rows, sorted by `metadataCreatedAt` descending; id, first name, last name, contact email and preferred site, each with a row filter and sorting sent to the service. Column visibility and customer mixin columns persist under `ext_customers`. Row click and the edit action open `/:id`; row delete and batch delete (`Promise.all`) confirm, toast, clear the selection and reload the list 500 ms later (MD's workaround for a stale read after delete).

## Editor

`pages/CustomerAddEdit.page.tsx`, a react-hook-form form. Tabs: details, addresses (disabled until the customer exists), customer mixin tabs, audit log (`entity="customer"`). Save is enabled when the form is dirty, valid and the user is a manager.

- Required: contact email and preferred currency (defaults to the host currency); the preferred site when restrictions are synced to site codes and the user is restricted. A typed password must have at least 6 characters; "Autogenerate" fills and locks a random 12-character one. The password is masked with a show/hide eye (CL `InputText` `type="password"`).
- Restriction: the configured values, filtered to the user's restrictions; clearable only with full access; locked when the user is restricted and sync is on. With sync on, picking a site sets the restriction to that site code.
- On save, an empty restriction is sent as `null` and an empty password is left out. Create opens the new id; update reloads the customer. Errors show the service message.
- Read-only: customer number, creation date, last login, assigned segments, companies and groups (link chips), marketing information (bonus points, referral coupon, newsletter sign-on/off, last delivery and order dates from the `marketing`, `customerNewsletter` and `generalAttributes` mixins).
- Assisted buying (`components/customers/AssistedBuying.tsx`): one menu entry per site with `assistedBuying.storefrontUrl`; picking one logs in as the customer and opens the storefront in a new tab with `customerToken`, `customerTokenExpiresIn`, `refreshToken`, `refreshTokenExpiresIn` and `saasToken`.
- Addresses (`components/customers/Address.tsx`): each card saves (contact name and country required) or deletes on its own; a new, unsaved card is just dropped. Address mixin tabs show once the address has a contact name and save with a patch of the address.
- Mixin save sends `mixins` with the new value and `metadata.mixins` with the schema URL for that key (MD spread the mixin URLs into `metadata` itself).
- Delete (header) confirms with a real message and returns to the list.

## Translations

`customers/src/translations/{en,de}/customers.ts` keep the MD `customers.*` keys the screens use. Added: `actions.deleteMessage` (MD showed the raw key), `address.general` (MD hard-coded "General"), `details.passwordToggle.*`, and the DE values MD lacked; DE `details.title` is "Anrede" (MD had "Kunde bearbeiten"). Yes/No options use `global.yes` / `global.no` (English literals in MD). EN and DE key parity is pinned by `customers/src/translations/translations.test.ts`.

## Host wiring

| Fact | Value |
|---|---|
| Kind | playbook-aligned |
| Federation `name` | `customers` (`customers/vite.config.ts`) |
| Host route `key` → path | `customers` → `/apps/management/customers/*`; MD `CustomersPathRedirect` on `apps/management/customers/:customerId/*` moves former pathname links (`/<id>`, `/add`) and their query into the hash. The MD keys `customersAdd` and `customersEdit` were removed in COP-7185 |
| Host env var | `VITE_CUSTOMERS_URL` (`management-dashboard` `.env.*`) |
| Local port | `5184`, `strictPort` |
| Hosting | Firebase targets `emporix-customers`, `-stage`, `-develop`; `.github/workflows/customers-firebase-*.yaml` |
| Local deviations | none |

## Not yet scanned

- Mixin form widgets and the audit-log components (shared copies from `companies`).
