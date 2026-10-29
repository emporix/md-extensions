# Products

Management Dashboard "Products" module (list, create, edit), extracted into an `md-extensions` federated remote ([COP-6993](https://emporix.atlassian.net/browse/COP-6993), epic COP-5597). React + Vite, using the [vite-plugin-federation](https://github.com/originjs/vite-plugin-federation) Module Federation implementation.

> Scaffolded from [md-module-template](https://github.com/emporix/md-module-template) (`md-module-migration` branch), replacing the legacy `emporix-product-module` remote that used to live in this folder. Tier 1 infrastructure taken from the `orders` remote (media components from `brands`). See the `md-module-extraction` skill in this repo for the full workflow.

| | |
|---|---|
| Federation `name` | `products` (must equal the MD route `key` and `ExternalModule.moduleName`) |
| Exposes | `./RemoteComponent` → `src/RemoteComponent.tsx` (named **and** default export) |
| Local dev port | `5178` (`strictPort`) |
| Host env var | `VITE_PRODUCTS_URL` → `.../assets/remoteEntry.js` |
| Component library | `@emporix/component-library` `2.12.0` (adds `Tree`) |
| MD wiring mode | A — permanent remote (`url:` on the route) |

## Screens

| Route (hash-relative) | Screen |
|---|---|
| `/` | Products list — lazy table (filters, sort, multi-select, batch delete incl. dynamic-variant recalculation), column visibility + mixin columns (`ext_products`), list ↔ category-tree view, create dialog (basic / bundle / parent variant / variant hierarchy / subscription), mocked CSV import (MD parity) |
| `/add?type=…` | Create product (`type`, `subscription`, `parentVariantId`, `siblingId` query params as in MD) |
| `/:id?tab=…` | Edit product — General (+ AI assistant), Categories, Classifications, Prices (+ tax), Availability (+ availability mixins), Bundle, Media, Linked, Attributes & Variants, product mixins (site-aware), Audit log; variant-hierarchy sidebar for dynamic variants |

The host redirects the old pathname deep links (`/apps/management/products/:id`, `/apps/management/products/add?…`) to these hash routes (`ProductsPathRedirect` in MD).

Links to host-owned screens (media assets, price models/lists, carts, customers, companies, segments, custom instances, orders) leave the remote via `window.location.assign` with the builders in `src/helpers/hostUrls.ts`; there is no in-remote equivalent. Links between products stay inside the remote.

## Component library substitutions

The remote is PrimeReact-free. `Tree` was promoted into the component library in 2.12.0 for this module. Remaining substitutions:

| MD used | Here |
|---|---|
| `Panel` (price panels) | CL `SectionBox` with a custom collapsible header |
| `MultiSelect` (labels, AI languages, attribute values, price sites) | CL `Dropdown multiple display="chip"` |
| `Dropdown showClear` | explicit empty / "All" option |
| `InputMask` `"99:99"` (time mixins) | CL `InputText type="time"` |
| `TabView` / `TabPanel` (incl. mixin tabs with badges) | CL `Tabs`; a newer schema version shows as `(vN)` in the label |
| `TreeTable` mode of `CategoriesTree` | dropped (not used by products) |
| MD `InputField` | local products-aware `components/shared/InputField` (CL `FieldLabel` + "Inherited from parent") |
| Calendar `showSeconds` (price validity) | not available in CL `Calendar` (minutes precision) |

## AppState

The host passes an `appState` prop to `RemoteComponent`, built in `ExternalModule` and forwarded through module federation (`DynamicComponent`).

| Field | Type | Description |
|-------|------|-------------|
| `tenant` | `string` | Current tenant identifier. |
| `language` | `string` | UI language from the dashboard (`en` / `de`). |
| `token` | `string` | JWT access token for Emporix API calls. |
| `currency` | `Currency` | Active currency. |
| `contentLanguage` | `string` | Content language selected in the dashboard. |
| `user` | `SessionUser` | Logged-in user (optional, contract compatibility). |
| `onError` | `(error: unknown) => void` | Host error handler — the dashboard uses it to re-authenticate on `401`. |

Permissions are **not** on AppState: the remote's own `PermissionsProvider` fetches IAM access controls (and scopes) with the token.

## Provider stack

`RemoteComponent` wraps routes in the full playbook stack (outer → inner): `ToastProvider` (CL) → `DashboardProvider` → `PermissionsProvider` → `FeatureTogglesProvider` → `ConfigurationProvider` → `SitesProvider` → `UIBlockerProvider` → `HashRouter` → `RefreshValuesProvider` (in `Products.module.tsx`) → `ProductDataProvider` + `ActiveNodeProvider` (create/edit route, inside `ProductAddEdit`).

## AI and code-assistant rules

Coding standards come from the shared [frontend-ai-rules](https://github.com/emporix/frontend-ai-rules) package. Generic rules and index files are **not committed** — they are downloaded and customized on `npm install` via the `postinstall` script.

| Agent | Index file (generated) | Generic rules (generated) |
|-------|------------------------|---------------------------|
| **Cursor** | `.cursorrules` | `.cursor/rules/*.mdc` |
| **GitHub Copilot** | `.github/copilot-instructions.md` | `.github/instructions/*.instructions.md` |
| **Claude Code** | `.claude/CLAUDE.md` | `.claude/rules/*.md` |

> Synced files are overwritten on install. Do not edit `00-core`, `api-data`, etc.

## Development

### Environment variables

Copy `.env.example` to `.env` and set:

- **VITE_API_URL** – Base URL for the Emporix API (e.g. `https://api-develop.emporix.io`).
- **VITE_DASHBOARD_ORIGIN** – Dashboard origin that must be allowed in the `vite.config.ts` CORS list (checked on build).
- **VITE_MRWORKER_DEMO** – optional; together with a tenant containing `mrworker` it shows the (mocked) CSV import button, as in MD.

### Commands

```bash
npm install
npm run dev          # standalone shell on http://localhost:5178 (loads .env.dev)
npm run typecheck
npm run lint
npm run test:run
npm run build:dev
```

Run `typecheck`, `lint`, `test:run` and `build:dev` before committing.

### Local dev against the dashboard

```bash
# Terminal 1 — this remote
cd md-extensions/products && npm run dev

# Terminal 2 — the host
cd management-dashboard && npm run serve
# .env.local-dev: VITE_PRODUCTS_URL=http://localhost:5178/assets/remoteEntry.js
```

Running `npm run dev` and opening the port directly gives a standalone shell that prompts for tenant, token and language, then renders `RemoteComponent` with that `appState`.

### Deploying

Firebase Hosting sites (`emporix-products-develop`, `emporix-products-stage`, `emporix-products`) are declared in the repo root `.firebaserc` / `firebase.json` and deployed by the workflows under `.github/workflows/`. Hosting must send `Access-Control-Allow-Origin: *` so the dashboard can load `remoteEntry.js`.
