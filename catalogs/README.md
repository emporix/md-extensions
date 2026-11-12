# Catalogs

Management Dashboard "Catalogs" module (Management → Catalogs), extracted into an `md-extensions` federated remote (COP-7180, epic COP-5597). A catalog of the Catalog Service has an id, a localized name and description, the root categories it exposes, the sites it is published to, and a visibility window (`from`, `to`, `visible`); the service derives its `status`. React + Vite, using the [vite-plugin-federation](https://github.com/originjs/vite-plugin-federation) Module Federation implementation.

Scaffolded from [md-module-template](https://github.com/emporix/md-module-template) (`md-module-migration` branch); Tier 1 infrastructure is aligned with `units`, the column-visibility panel with `labels`, the date filter and categories selector with `coupons`. See the `md-module-extraction` skill at the repository root for the workflow.

## Screens

Hash routes inside the remote (`src/constants/paths.ts`), mounted by the host on `/apps/management/catalogs/*`:

| Path | Screen |
|------|--------|
| `/` | List: server-paged, sortable table with visible dot, name (filter), published to (filter), visibility start / end and last published (date filters); column visibility saved under `ext_catalogs`; row edit and delete, batch delete |
| `/add` | Create a catalog (id optional; the service generates one) |
| `/:id` | Edit a catalog (id read-only). Tabs Details, Categories, Published, Visibility (`?tab=` deep links) |

`Catalogs Viewer` can view; `Catalogs Manager` can create, edit and delete. The categories selector also needs `Categories Viewer` to show categories and `Categories Manager` to change them; the sites picker needs `Categories Viewer`, as in MD. The remote loads permissions itself (`PermissionsProvider`).

Differences from MD: a rejected save shows an error toast; an empty visibility date shows an empty picker and is not sent; Save needs a name in at least one language; the "catalog could not be loaded" toast has a translated title.

API calls: `fetchCatalogs`, `fetchCatalog`, `createNewCatalog`, `modifyCatalog`, `removeCatalog` from `@emporix/api-calls`, bound to the host tenant in `src/hooks/api/catalogs.ts`; categories through `src/hooks/api/categories.ts`, sites through `SitesProvider`.

## AppState

When the module is embedded in the Management Dashboard, the host passes an `appState` prop to `RemoteComponent`.

| Field | Type | Description |
|-------|------|-------------|
| `tenant` | `string` | Current tenant identifier. |
| `language` | `string` | UI language from the dashboard (`en` or `de`); the name filter uses it, as in MD. |
| `token` | `string` | JWT access token for Emporix API calls. |
| `currency` | `Entry` | Active currency. |
| `contentLanguage` | `string` | Content language selected in the dashboard; the name column shows it. |
| `user` | `User` | Logged-in user. |
| `onError` | `(error: unknown) => void` | Host error handler. |

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

The remote runs on a fixed local port, `5185` (`server.port` and `preview.port` in `vite.config.ts`, `strictPort: true`). The dashboard's `.env.local-*` files point `VITE_CATALOGS_URL` at `http://localhost:5185/assets/remoteEntry.js`.

```bash
npm run build:dev
npx vite preview --mode dev
```

Then start the dashboard with `serve:local-qa` (or another `local-*` mode) and open `/apps/management/catalogs`.

Every `build*` script first runs `scripts/ensure-cors-origin.mjs`, which checks that the dashboard origin for that mode is in the `corsOrigins` list of `vite.config.ts` (`npm run check:cors -- --mode dev`).

### Standalone

```bash
npm run dev
```

The dev shell asks for tenant, token and language.

### Deploying

Firebase Hosting targets `emporix-catalogs-develop`, `emporix-catalogs-stage` and `emporix-catalogs` (root `firebase.json`, `.firebaserc`). Workflows: `.github/workflows/catalogs-firebase-*.yaml` — a preview per PR, dev and stage on merge to `master`, prod on a `catalogs-*` tag. The Firebase Hosting sites must exist before the first deploy.

## UI

No PrimeReact, PrimeFlex or PrimeIcons dependency. UI comes from `@emporix/component-library`, whose stylesheet is imported once in `RemoteComponent.tsx`; feature styles are SCSS Modules. See `docs/CL_WIDGET_STATUS.md` for the component-library equivalent of each PrimeReact widget.
