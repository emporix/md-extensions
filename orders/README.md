# Orders

Management Dashboard "Orders" module, extracted into an `md-extensions` federated remote ([COP-6917](https://emporix.atlassian.net/browse/COP-6917), epic COP-5597). React + Vite, using the [vite-plugin-federation](https://github.com/originjs/vite-plugin-federation) Module Federation implementation.

> Scaffolded from [md-module-template](https://github.com/emporix/md-module-template) (`md-module-migration` branch); Tier 1 infrastructure taken from the `returns` remote (audit-log tab from `customer-groups`). See the `md-module-extraction` skill in this repo for the full workflow.

| | |
|---|---|
| Federation `name` | `orders` (must equal the MD route `key` and `ExternalModule.moduleName`) |
| Exposes | `./RemoteComponent` → `src/RemoteComponent.tsx` (named **and** default export) |
| Local dev port | `5177` (`strictPort`) |
| Host env var | `VITE_ORDERS_URL` → `.../assets/remoteEntry.js` |
| Component library | `@emporix/component-library` `2.11.0` |
| MD wiring mode | A — permanent remote (`url:` on the route) |

## Screens

| Route (hash-relative) | Screen |
|---|---|
| `/` | Orders list — site selector, filterable/sortable lazy table, row expansion (entries), batch delete, CSV export, column visibility + mixin columns (`ext_orders`), master/sub-order dialog |
| `/:id` | Order detail — order data, entries, payment (`PAYMENT_GATEWAY` toggle), one tab per order mixin schema, audit log |

Orders priced by the calculation engine (`calculatedPrice`) use the current data/entries views; older orders fall back to the legacy views under `src/components/orders/legacy/`.

Cart, quote and customer links leave the remote via `window.location.assign` / a plain link to the host-owned `/apps/management/{carts,quotes,customers}/:id` routes (see `src/constants/paths.ts`); there is no in-remote equivalent. Links between orders (master / sub-orders) stay inside the remote.

## Component library substitutions

The remote is PrimeReact-free. `InputNumber`, `Skeleton` and `Chip` were promoted into the component library in 2.11.0 for this module. Remaining substitutions:

| MD used | Here |
|---|---|
| `InputMask` `"99:99"` (delivery time) | CL `InputText` with `type="time"` |
| `Badge` severity (payment / transaction status) | CL `StatusBadge` with a severity → colour map |
| `Dropdown showClear` (status, payment filters, site selector) | explicit "All" option |
| `Sidebar` (table extensions) | local `SidePanel` + CL `InputSwitch` |
| MD `RestrictionsProvider` | `useOrderRestrictions()` over the remote `PermissionsProvider` scopes |
| Entry mixins accordion (one shared Save) | one `MixinsForm` section per schema with its own Save (dirty rows still confirm before collapsing) |

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

Permissions are **not** on AppState: the remote's own `PermissionsProvider` fetches IAM access controls (and scopes, for order restrictions) with the token.

## Provider stack

`RemoteComponent` wraps routes in the full playbook stack (outer → inner): `ToastProvider` (CL) → `DashboardProvider` → `PermissionsProvider` → `FeatureTogglesProvider` → `ConfigurationProvider` → `SitesProvider` → `UIBlockerProvider` → `HashRouter` → `RefreshValuesProvider` (in `Orders.module.tsx`) → `OrderDataProvider` (detail route).

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

### Commands

```bash
npm install
npm run dev          # standalone shell on http://localhost:5177 (loads .env.dev)
npm run typecheck
npm run lint
npm run test:run
npm run build:dev
```

Run `typecheck`, `lint`, `test:run` and `build:dev` before committing.

### Local dev against the dashboard

```bash
# Terminal 1 — this remote
cd md-extensions/orders && npm run dev

# Terminal 2 — the host
cd management-dashboard && npm run serve
# .env.local-dev: VITE_ORDERS_URL=http://localhost:5177/assets/remoteEntry.js
```

Running `npm run dev` and opening the port directly gives a standalone shell that prompts for tenant, token and language, then renders `RemoteComponent` with that `appState`.

### Deploying

Firebase Hosting sites (`emporix-orders-develop`, `emporix-orders-stage`, `emporix-orders`) are declared in the repo root `.firebaserc` / `firebase.json` and deployed by the workflows under `.github/workflows/`. Hosting must send `Access-Control-Allow-Origin: *` so the dashboard can load `remoteEntry.js`.
