# Quotes

Management Dashboard "Quotes" module (Sales → Quotes), extracted into an `md-extensions` federated remote (COP-7116, epic COP-5597). A quote is a Quote Service document a merchant prepares for a B2B company or a B2C customer: lines with prices and discounts, shipping and a validity date, shared as a PDF and approved or declined. React + Vite, using the [vite-plugin-federation](https://github.com/originjs/vite-plugin-federation) Module Federation implementation.

Scaffolded from [md-module-template](https://github.com/emporix/md-module-template) (`md-module-migration` branch); Tier 1 infrastructure comes from `companies` (providers, tenant-switch guards, column visibility, mixins, audit log), pruned to what the module uses. Quotes was first rebuilt as a module in MD (`src/modules/quotes`) and tested end to end there, then ported 1:1. See the `md-module-extraction` skill at the repository root for the workflow.

## Screens

Hash routes inside the remote (`src/constants/paths.ts`, `src/Quotes.routes.tsx`), mounted by the host on `/apps/management/quotes/*`. They mirror MD's former pathname routes:

| Path        | Screen                                                                                                                                                                                                          |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`         | List: lazy table with company, number, creation date, status and total filters and sorting, `ext_quotes` column visibility with quote mixin columns, line expansion, approve and decline, row and batch delete  |
| `/add`      | Create a quote draft: B2B (company, contact, addresses) or B2C (customer dialog). Only General is enabled until the draft exists; saving it opens `/:quoteId`                                                   |
| `/:quoteId` | Edit a quote: General, Products (CL `ProductsBrowser`), Preview (prices, discounts, shipping, validity), Approval (quote PDF, approve, decline), mixin tabs, audit log (`?tab=` selects a tab by name or index) |

An unknown path shows the list. The site select has no "All sites" option, is disabled once a quote is loaded, and a loaded quote switches to its own site. The first site comes from the one MD persisted (read only).

`Quotes Manager` can create, edit, approve, decline and delete; the list and the quote need the user's quote scopes (`quote.quote_read` / `quote.quote_manage`, `src/helpers/restrictions.ts`). The products tree view needs `Categories Viewer`, the audit log tab `Audit Log Viewer`; company, order and customer links follow the matching viewer permission. The remote loads permissions itself (`PermissionsProvider`).

Links that leave the remote for the host (`window.location.assign`):

| Link     | Host path                          |
| -------- | ---------------------------------- |
| Company  | `/apps/management/companies#/{id}` |
| Order    | `/apps/management/orders#/{id}`    |
| Cart     | `/apps/management/carts/{id}`      |
| Customer | `/apps/management/customers#/{id}` |

A host tenant switch sends every page back to the list, and responses for the previous tenant or quote are dropped.

API calls from `@emporix/api-calls`, bound to the host tenant. The quote, price and shipping calls use the `./next` entry point (1.6.0): `listQuotesCall`, `getQuoteCall`, `createQuoteCall`, `patchQuoteCall`, `deleteQuoteCall`, `generateQuotePdfCall` and `listQuoteReasonsCall` in `src/hooks/api/quotes.ts`, `matchPricesCall` in `prices.ts`, `listShippingZonesCall` in `shipping.ts`. The others use the package root: `calculateTaxCall` in `taxes.ts`, legal entities in `customerManagement.ts`, customers in `customers.ts`.

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

`src/models/AppState.model.ts` defines the fields this remote reads. Read them through `useDashboardContext()`. The remote's own `@emporix/api-calls` client is created in `src/api/bootstrap.ts` from `VITE_API_URL`, with `createApiCredentials` holding the AppState tenant and token; root and `./next` calls share it.

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

The remote runs on a fixed local port, `5188` (`server.port` and `preview.port` in `vite.config.ts`, `strictPort: true`). The dashboard's `.env.local-*` files point `VITE_QUOTES_URL` at `http://localhost:5188/assets/remoteEntry.js`.

```bash
npm run build:dev
npx vite preview --mode dev
```

Then start the dashboard with `serve:local-qa` (or another `local-*` mode) and open `/apps/management/quotes`.

Every `build*` script first runs `scripts/ensure-cors-origin.mjs`, which checks that the dashboard origin for that mode is in the `corsOrigins` list of `vite.config.ts` (`npm run check:cors -- --mode dev`).

### Standalone

```bash
npm run dev
```

The dev shell asks for tenant, token and language.

### Deploying

Firebase Hosting targets `emporix-quotes-develop`, `emporix-quotes-stage` and `emporix-quotes` (root `firebase.json`, `.firebaserc`). Workflows: `.github/workflows/quotes-firebase-*.yaml` — a preview per PR, dev and stage on merge to `master`, prod on a `quotes-*` tag. The Firebase Hosting sites must exist before the first deploy.

## UI

No PrimeReact, PrimeFlex or PrimeIcons dependency. UI comes from `@emporix/component-library` (≥ 2.29.1: `Calendar` `hideOnDateTimeSelect` since 2.29.0, MD's 0.75rem `StatusBadge` text since 2.29.1), whose stylesheet is imported once in `RemoteComponent.tsx`; feature styles are SCSS Modules. MD's icon glyphs are kept (`pi pi-*` classes from the CL stylesheet, react-icons `Bs*`). See `docs/CL_WIDGET_STATUS.md` for the component-library equivalent of each PrimeReact widget.
