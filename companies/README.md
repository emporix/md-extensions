# Companies

Management Dashboard "Companies" module (Customer Management → Companies), extracted into an `md-extensions` federated remote (COP-7186, epic COP-5597). A company is a **legal entity** of the Customer Management Service, with its subsidiaries, locations, approval group and contact assignments. React + Vite, using the [vite-plugin-federation](https://github.com/originjs/vite-plugin-federation) Module Federation implementation.

Scaffolded from [md-module-template](https://github.com/emporix/md-module-template) (`md-module-migration` branch); Tier 1 infrastructure is aligned with `status-codes` (providers, tenant-switch guards) and `orders` (column visibility, mixins, audit log). See the `md-module-extraction` skill at the repository root for the workflow.

## Screens

Hash routes inside the remote (`src/constants/paths.ts`), mounted by the host on `/apps/management/companies/*`. They mirror MD's former pathname routes:

| Path                                     | Screen                                                                                                                                                                                                           |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                                      | List: lazy table with filters and sorting, `ext_companies` column visibility with company mixin columns, row edit and delete, batch delete                                                                       |
| `/add`                                   | Create a company (`?parentCompany=` creates a subsidiary)                                                                                                                                                        |
| `/:companyId`                            | Edit a company: details and primary contacts, subsidiaries, locations, policies (account limit, approval group), customers (contact assignments), customer groups, mixin tabs, audit log (`?tab=` selects a tab) |
| `/:companyId/locations[/:locationId]`    | Create or edit a location (tags, location mixins; `?mixin=` selects a mixin tab)                                                                                                                                 |
| `/:companyId/assignments/contact[/:id]`  | Create or edit a contact (a `CONTACT` customer, its address and the assignment)                                                                                                                                  |
| `/:companyId/assignments/customer[/:id]` | Assign an existing customer                                                                                                                                                                                      |

`Companies Viewer` can view; `Companies Manager` can create, edit and delete. Contact screens also check `Customers Viewer` / `Customers Manager`, and the audit log tab `Audit Log Viewer`. The remote loads permissions itself (`PermissionsProvider`). Customer and customer-group links leave the remote for the host (`window.location.assign`).

API calls: legal entity, location and contact-assignment calls (`fetchLegalEntitiesCall`, `createContactFlow`, …) and customer calls (`getCustomers`, `addCustomer`, …) from `@emporix/api-calls`, bound to the host tenant in `src/hooks/api/customerManagement.ts` and `src/hooks/api/customers.ts`.

## AppState

When the module is embedded in the Management Dashboard, the host passes an `appState` prop to `RemoteComponent`.

| Field             | Type                       | Description                                    |
| ----------------- | -------------------------- | ---------------------------------------------- |
| `tenant`          | `string`                   | Current tenant identifier.                     |
| `language`        | `string`                   | UI language from the dashboard (`en` or `de`). |
| `token`           | `string`                   | JWT access token for Emporix API calls.        |
| `currency`        | `Entry`                    | Active currency.                               |
| `contentLanguage` | `string`                   | Content language selected in the dashboard.    |
| `user`            | `User`                     | Logged-in user.                                |
| `onError`         | `(error: unknown) => void` | Host error handler.                            |

`src/models/AppState.model.ts` defines the fields this remote reads. Read them through `useDashboardContext()`. The shared `@emporix/api-calls` client is created in `src/api/bootstrap.ts` from `VITE_API_URL`.

## Development

### Environment variables

Copy `.env.example` to `.env` and set:

- **VITE_API_URL** – Base URL for the Emporix API (e.g. `https://api-develop.emporix.io`).
- **VITE_DASHBOARD_ORIGIN** – Dashboard origin the build checks against the CORS list in `vite.config.ts`.

### Checks

```bash
npm install
npm run typecheck
npm run lint
npm run test:run
npm run build:dev
```

### Loading the remote in the Management Dashboard

The remote runs on a fixed local port, `5183` (`server.port` and `preview.port` in `vite.config.ts`, `strictPort: true`). The dashboard's `.env.local-*` files point `VITE_COMPANIES_URL` at `http://localhost:5183/assets/remoteEntry.js`.

```bash
npm run build:dev
npx vite preview --mode dev
```

Then start the dashboard with `serve:local-qa` (or another `local-*` mode) and open `/apps/management/companies`.

Every `build*` script first runs `scripts/ensure-cors-origin.mjs`, which checks that the dashboard origin for that mode is in the `corsOrigins` list of `vite.config.ts` (`npm run check:cors -- --mode dev`).

### Standalone

```bash
npm run dev
```

The dev shell asks for tenant, token and language.

### Deploying

Firebase Hosting targets `emporix-companies-develop`, `emporix-companies-stage` and `emporix-companies` (root `firebase.json`, `.firebaserc`). Workflows: `.github/workflows/companies-firebase-*.yaml` — a preview per PR, dev and stage on merge to `master`, prod on a `companies-*` tag. The Firebase Hosting sites must exist before the first deploy.

## UI

No PrimeReact, PrimeFlex or PrimeIcons dependency. UI comes from `@emporix/component-library` (≥ 2.20.0 for `Chips` and `SplitButton`), whose stylesheet is imported once in `RemoteComponent.tsx`; feature styles are SCSS Modules. See `docs/CL_WIDGET_STATUS.md` for the component-library equivalent of each PrimeReact widget.
