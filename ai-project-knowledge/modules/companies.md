# Companies

Last scanned: d8edeb2 (2026-11-09)
Sources: `companies/README.md`, `companies/package.json`, `companies/vite.config.ts`, `companies/src/RemoteComponent.tsx`, `companies/src/Companies.module.tsx`, `companies/src/constants/paths.ts`, `companies/src/models/LegalEntity.model.ts`, `companies/src/models/Customer.model.ts`, `companies/src/hooks/api/customerManagement.ts`, `companies/src/hooks/api/customers.ts`, `companies/src/hooks/useCompaniesColumns.tsx`, `companies/src/pages/*.page.tsx`, `companies/src/components/companies/`, `companies/src/components/contacts/`, `companies/src/helpers/{locationForm,locationMixins,companyFormat}.helpers.ts`, `companies/src/components/shared/TableExtensions.tsx`, `companies/src/translations/`, `companies/src/**/*.test.ts(x)`, `docs/MIGRATED_MODULES.md`

Management Dashboard (MD) Customer Management → Companies as a Vite federated remote, extracted in COP-7186 (`docs/MIGRATED_MODULES.md`). A company is a **legal entity** of the Customer Management Service, with subsidiaries, locations, an approval group and contact assignments. Federation name `companies`, exposes `./RemoteComponent` (named and default), local port `5183` with `strictPort` (`companies/vite.config.ts`). Tier 1 providers and session code come from `status-codes` (tenant-switch guards); column visibility, mixins, audit log and restriction parsing from `orders`; `useCountries`, `useCurrencies`, `useForm` and `NavigationConfirmProvider` from `products`. Needs component library ≥ 2.20.0 (`Chips`, `SplitButton`).

## Records

`companies/src/models/LegalEntity.model.ts` (MD shapes):

- **Legal entity**: `type` `COMPANY` or `SUBSIDIARY`, optional `parentId`, `legalInfo` (legal name, registration date, tax registration number, agency, country, registration id), `accountLimit` (value + currency), `customerGroups` (read-only), `entitiesAddresses` (its locations), `approvalGroup` (contact-assignment ids), `restrictions` (string list, the UI edits one value), `contacts` (assignments loaded with the entity), `mixins`, `metadata`.
- **Location**: `name`, `type` `HEADQUARTER` (default), `WAREHOUSE` or `OFFICE`, `contactDetails` (address lines, city, state, numeric postcode, country code, `tags`), `mixins`.
- **Contact assignment**: links a customer record to a legal entity with `type` (`PRIMARY`, `BILLING`, `LOGISTICS`, `CONTACT`), `primary` and `metadata.version`. A *contact* is a customer with `type: 'CONTACT'`; an assigned existing customer has `type` `CUSTOMER` or none.

## API

`useCustomerManagementApi` (`companies/src/hooks/api/customerManagement.ts`) binds the api-calls legal-entity, location and contact-assignment calls (`fetchLegalEntitiesCall`, `fetchLegalEntityCall`, `create/update/deleteLegalEntityCall`, `fetchLocationCall`, `create/update/deleteLocationCall`, `fetchContactsForEntityCall`, `fetchContactAssignmentCall`, `createContactFlow`, `updateContactFlow`, `deleteContactAssignmentCall`) to the host tenant; `addApprovalGroupContact` / `removeApprovalGroupContact` rewrite `approvalGroup` to `{ id }` entries and PUT the legal entity. `useCustomerApi` (`hooks/api/customers.ts`) wraps the customer calls (`getCustomers` needs Customers Viewer). Restriction values come from configuration key `restrictions` (`hooks/api/configuration.ts` `getRestrictions`).

- `getLegalEntities` with `withContacts` loads each row's assignments (`contact-assignments?legalEntity.id=`, page size 100).
- `createLocationCall` POSTs the location, then re-reads the legal entity and PUTs it with the new location prepended to `entitiesAddresses`.
- `updateContactFlow` sends the PUT only when assignment id, legal entity id, customer id, type and `metadata.version` are present; otherwise it does nothing.

## Routes

Hash routes (`companies/src/constants/paths.ts`, `companies/src/RemoteComponent.tsx`), mirroring MD's former pathnames; ids are URL-encoded:

| Path | Page |
|---|---|
| `/` | `pages/CompaniesList.page.tsx` |
| `/add`, `/:companyId` | `pages/CompanyAddEdit.page.tsx` (`?parentCompany=`, `?customerId=`, `?tab=`) |
| `/:companyId/locations[/:locationId]` | `pages/LocationAddEdit.page.tsx` (`?mixin=`, `?backTo=`) |
| `/:companyId/assignments/contact[/:id]` | `pages/ContactAddEdit.page.tsx` (`?primary=true`, `?approval=true`, `?backTo=`) |
| `/:companyId/assignments/customer[/:id]` | `pages/CustomerAssignmentAddEdit.page.tsx` (`?primary=true`, `?approval=true`, `?backTo=`) |

Other paths redirect to `/`. Customer pages (`/apps/management/customers/:id`) and customer groups (`/administration/customer-groups#/groups/:id`) are host routes, left with `window.location.assign` (`HOST_CUSTOMER_PATH`, `HOST_CUSTOMER_GROUP_PATH`). A host tenant switch sends every page back to the list; loads go through `createRequestTracker` / `loadLatest` so a late response for an earlier tenant or id cannot overwrite the current one.

## Permissions

Companies Viewer views; Companies Manager is needed to create, edit, delete and to use the add/assign actions (they render disabled otherwise, as in MD). Contacts also need Customers Manager to add or edit (Customers Viewer to assign an existing customer); the audit log tab needs Audit Log Viewer. Company restrictions come from token scopes (`helpers/restrictions.ts`) over the remote `PermissionsProvider`.

## List

`CompaniesTable` (`components/companies/CompaniesTable.tsx`, columns in `hooks/useCompaniesColumns.tsx`): lazy table with server paging, sorting and filters — id (contains), name (sortable), type (`CompanyTypeFilter`, Company / Subsidiary with a `pi pi-filter-slash` clear), country of registration, primary contact (the `primary` assignment, else the first, else `-`); hidden by default: groups (filter on `customerGroups.name.<contentLanguage>`), legal name, registration date, created, modified (date range filters). Column visibility and company mixin columns persist under `ext_companies` (`TableExtensions` `defaultHiddenColumns` keeps the MD defaults hidden until the user saves). Row click opens `/:id`; row delete and batch delete (`deleteLegalEntity` per row) ask for confirmation, toast, clear the selection and reload.

## Company editor

`CompanyAddEdit.page.tsx`. Tabs: company details, subsidiaries, locations, policies, customers, customer groups, then company mixin tabs, then audit log (`entity="company"`). Tabs other than details are disabled until the company exists. Save is enabled when the form is dirty and the user is a manager; there is no field validation gate. Create POSTs and opens the new id; update PUTs the whole entity; a mixin save PUTs the whole form too. A company that cannot be loaded shows an error toast and returns to the list.

- Details: id (editable on create only), name, legal name, tax registration number, country of registration (active countries), registration agency and date, registration id, restriction (configuration `restrictions` filtered to the user's company restrictions; a single allowed value is pre-selected on create). Primary contacts block: "Add" opens `…/assignments/contact?primary=true`.
- Subsidiary: `?parentCompany=<id>` sets `parentId` and type `SUBSIDIARY`. Back goes to the host customer (`?customerId=`), else to the parent company, else the list. The header breadcrumb walks the `parentId` chain.
- Subsidiaries tab (`components/companies/Subsidiaries.tsx`): first 100 children with client-side filters; "Add new" opens `/add?parentCompany=<id>`.
- Locations tab (`Locations.tsx`, `LocationRow.tsx`): cards from `entitiesAddresses` with formatted address, tags (CL `Chip`) and location mixin badges (`LocationMixinsRow`, `helpers/locationMixins.helpers.ts`) that open the location on that mixin tab; delete asks for confirmation twice (row action, then the locations confirm box), as in MD.
- Policies tab: account limit (value + currency) and the approval group (`components/companies/ApprovalGroup*.tsx`): add existing contacts from a dialog, add a new contact (`…/assignments/contact?approval=true`), remove.
- Customers tab (`components/contacts/ContactAssignmentList.tsx`): the company's assignments (name, surname, primary, contact type, user type, email); "Assign customer" and "Add new contact" (`AddNewContactButton`, a CL `SplitButton`, a plain button without Customers Manager). Row delete of a `CONTACT`-type assignment also deletes the customer; other rows and batch delete only unassign.
- Customer groups tab: read-only list; the row action opens the customer group in the host.

## Locations, contacts, assignments

- Location (`LocationAddEdit.page.tsx`, `components/companies/LocationDetails.tsx`, `helpers/locationForm.helpers.ts`): country is required; an empty id is omitted so the service generates one; an empty or non-numeric postcode is dropped, a numeric one sent as a number. Tags use CL `Chips` (Enter or blur adds; `", "` splits pasted text). Mixin tabs show only when mixins exist; `?mixin=` selects one. Create opens the new location; delete returns to the company.
- Contact (`ContactAddEdit.page.tsx`): required first name, last name, email, address country, type (CONTACT default, LOGISTICS, BILLING). Create: `createCustomer` (type CONTACT, B2B, the company's first restriction) → `createCustomerAddress` → `createContactWithAssignment` → `addApprovalGroupContact` with `?approval=true`; no rollback when a later step fails. Edit: `updateContactWithAssignment` → re-read customer → `editCustomer` → `editCustomerAddress`. "Change type to customer" patches the customer type to `CUSTOMER` and opens the host customer page.
- Customer assignment (`CustomerAssignmentAddEdit.page.tsx`): pick one customer from a paged list (10 rows); customers already assigned to the company are marked and cannot be picked. With `?approval=true` the new assignment joins the approval group and the page returns to `?tab=policies`. Its Delete unassigns without asking (the confirm box is never opened, as in MD).

## Translations

`companies/src/translations/{en,de}/` keep MD's `companies.*` and `contacts.*` keys, plus the borrowed `customers.*` subset, `priceLists.settings.form.currency.label` and `confirmBox.*`. Added keys: `companies.approvalGroup.add.dialogTitle` (MD hard-coded the string), `contacts.toast.delete.customer.*`, and the DE values MD lacked. EN and DE key parity is pinned by `companies/src/translations/translations.test.ts`.

## Host wiring

| Fact | Value |
|---|---|
| Kind | playbook-aligned |
| Federation `name` | `companies` (`companies/vite.config.ts`) |
| Host route `key` → path | `companies` → `/apps/management/companies/*`; MD `CompaniesPathRedirect` on `apps/management/companies/:companyId/*` moves former pathname links and their query into the hash (`management-dashboard` `src/router/module-routes.tsx`). The MD keys `companiesAdd`, `companiesEdit`, `locationAdd`, `locationEdit`, `contactAdd`, `contactEdit`, `customerAssignmentAdd`, `customerAssignmentEdit` were removed in COP-7186 |
| Host env var | `VITE_COMPANIES_URL` (`management-dashboard` `.env.*`) |
| Local port | `5183`, `strictPort` |
| Hosting | Firebase targets `emporix-companies`, `-stage`, `-develop`; `.github/workflows/companies-firebase-*.yaml` |
| Local deviations | none |

## Not yet scanned

- Tier 1 copies shared with `orders` and `status-codes` (providers, mixins subsystem, audit log, shared UI) — see `ai-project-knowledge/modules/orders.md` and `status-codes.md`.
