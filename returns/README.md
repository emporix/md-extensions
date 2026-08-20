# Returns

Management Dashboard "Returns" module, extracted into an `md-extensions` federated remote ([COP-6256](https://emporix.atlassian.net/browse/COP-6256), epic COP-5597). React + Vite, using the [vite-plugin-federation](https://github.com/originjs/vite-plugin-federation) Module Federation implementation.

> Scaffolded from [md-module-template](https://github.com/emporix/md-module-template) (`md-module-migration` branch); Tier 1 infrastructure taken from the `brands` and `customer-groups` remotes. See the `md-module-extraction` skill in this repo for the full workflow.

| | |
|---|---|
| Federation `name` | `returns` (must equal the MD route `key` and `ExternalModule.moduleName`) |
| Exposes | `./RemoteComponent` → `src/RemoteComponent.tsx` (named **and** default export) |
| Local dev port | `5176` (`strictPort`) |
| Host env var | `VITE_RETURNS_URL` → `.../assets/remoteEntry.js` |
| Component library | `@emporix/component-library` `2.5.0` |
| MD wiring mode | A — permanent remote (`url:` on the route) |

## Screens

| Route (hash-relative) | Screen |
|---|---|
| `/` | Returns list — filterable/sortable table, batch delete, column visibility + mixin columns |
| `/add` | Create wizard — customer → orders → products → review |
| `/:id` | Return detail — general tab plus one tab per mixin schema |

Customer and order links leave the remote via `window.location.assign` to the host-owned `/apps/management/customers/:id` and `/apps/management/orders/:id` routes (see `src/constants/paths.ts`); there is no in-remote equivalent.

## Component library substitutions

The remote is PrimeReact-free. Where the dashboard used a PrimeReact widget the library does not export, this remote substitutes:

| MD used | Here |
|---|---|
| `Sidebar` (table extensions) | CL `Dialog` |
| `InputNumber` | CL `InputText` with `type="number"` |
| `Calendar` (mixin date fields, date column filters) | CL `InputText` with `type="date"` / `type="datetime-local"` |
| `InputMask` `"99:99"` (mixin time fields) | CL `InputText` with `type="time"` |
| `Dropdown showClear` (status filter) | explicit "All" option |
| `TabView renderActiveOnly={false}` | CL `Tabs` with `keepMounted` |

`InputSwitch`, `MoneyValue` and `StatusBadge` were promoted into the component library in 2.5.0 rather than substituted.

## AppState

The host passes an `appState` prop to `RemoteComponent`, built in `ExternalModule` and forwarded through module federation (`DynamicComponent`).

| Field | Type | Description |
|-------|------|-------------|
| `tenant` | `string` | Current tenant identifier. |
| `language` | `string` | UI language from the dashboard (`en` / `de`). |
| `token` | `string` | JWT access token for Emporix API calls. |
| `currency` | `Currency` | Active currency. |
| `contentLanguage` | `string` | Content language selected in the dashboard. |
| `user` | `SessionUser` | Logged-in user; seeds the `submitter` on a new return. |
| `onError` | `(error: unknown) => void` | Host error handler — the dashboard uses it to re-authenticate on `401`. |

Permissions are **not** on AppState: the remote's own `PermissionsProvider` fetches IAM access controls with the token.

## Provider stack

`RemoteComponent` wraps routes in the full playbook stack (outer → inner): `ToastProvider` (CL) → `DashboardProvider` → `PermissionsProvider` → `FeatureTogglesProvider` → `ConfigurationProvider` → `SitesProvider` → `UIBlockerProvider` → `HashRouter` → `RefreshValuesProvider` (in `Returns.module.tsx`).

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
npm run dev          # standalone shell on http://localhost:5176 (loads .env.dev)
npm run typecheck
npm run lint
npm run test:run
npm run build:dev
```

Run `typecheck`, `lint`, `test:run` and `build:dev` before committing.

### Local dev against the dashboard

```bash
# Terminal 1 — this remote
cd md-extensions/returns && npm run dev

# Terminal 2 — the host
cd management-dashboard && npm run serve
# .env.local-dev: VITE_RETURNS_URL=http://localhost:5176/assets/remoteEntry.js
```

Running `npm run dev` and opening the port directly gives a standalone shell that prompts for tenant, token and language, then renders `RemoteComponent` with that `appState`.

### Deploying

Firebase Hosting sites (`emporix-returns-develop`, `emporix-returns-stage`, `emporix-returns`) are declared in the repo root `.firebaserc` / `firebase.json` and deployed by the workflows under `.github/workflows/`. Hosting must send `Access-Control-Allow-Origin: *` so the dashboard can load `remoteEntry.js`.
