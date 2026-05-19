# Companies extension — extraction progress

Federa­tion remote: **`emporix-companies-module`** (see `vite.config.ts`). Parent guide: [`management-dashboard/docs/converting-md-modules-to-federation-extensions.md`](../../management-dashboard/docs/converting-md-modules-to-federation-extensions.md).

## Done

- [x] Scaffold Vite + `@originjs/vite-plugin-federation` + CORS preview (port **5174**).
- [x] Shared **`customers/`** stack (api, models, context, hooks, components, helpers) + **`assets/`**.
- [x] **`configs/accessControls.ts`** from MD.
- [x] **`PermissionsProvider`** with `hasPermission(EmployeeDomains)` for **`COMPANIES_*`** and **`CUSTOMERS_*`** (`appState.permissions`; empty map + no scopes ⇒ permissive **`true`** for dev).
- [x] **`Companies.module.tsx`** — list.
- [x] **`CompaniesAddEdit.module.tsx`** — company detail/add/edit (tabs, mixins, subsidiaries, locations block, contacts, customer groups, policies, approval groups).
- [x] **`components/companies/*`** from MD (incl. **`LocationAddEdit`**, **`Contact.scss`**).
- [x] **`components/contacts/*`** (assignments + contact/customer flows), **`components/data-table/*`**, **`shared/DotIndicator`**.
- [x] **`hooks/useForm.ts`**, **`NavigationConfirmProvider`**, **`navigation`** i18n (en/de); **`SelectionValuesProvider`**; **`models/Webhooks.ts`** for `Metadata`.
- [x] **`LegalEntity`**: `ContactType.CONTACT`, **`restrictions?: string[]`**.
- [x] **`helpers/params`**: **`NumberFilterMode`**, **`isNumberFilterValue`** (for `NumberFilterTemplate`).
- [x] **Translations**: customers bundle + MD **`companies`** + **`contacts`** + **`navigation`**.
- [x] **`RemoteComponent` routes** (order: specific → list):
  - `#/apps/management/companies`
  - `#/apps/management/companies/add`
  - `#/apps/management/companies/:companyId`
  - `#/.../locations`, `#/.../locations/:locationId`
  - `#/.../assignments/contact` (+ optional `:contactAssignmentId`)
  - `#/.../assignments/customer` (+ optional `:contactAssignmentId`)
- [x] **`npm run build:dev`** passes (avoid **`from 'primereact'`** barrel — use **`primereact/inputtext`** etc., or Vite pulls `chart.js`).

## In progress / follow-ups

- [ ] **Runtime QA** in MD against real tenant (permissions shape, contact/assignment APIs).
- [ ] **Bundle size** — trim unused `customers` surface when stable.
- [ ] **Yarn v1** — use **`npm install`** or add a working lockfile policy.
- [ ] **Strict ESLint on full tree** — optional; build is the current gate.

## Quick commands

```bash
cd companies
cp .env.example .env
npm install
npm run serve:prod
```
