# Sites Settings

Management Dashboard "Sites Settings" module (Settings → Sites), extracted into an `md-extensions` federated remote (COP-7195). A site holds a shop's languages, currencies, ship-to countries, payment methods, home base address, coordinates, assisted-buying storefront and site mixins. React + Vite, using the [vite-plugin-federation](https://github.com/originjs/vite-plugin-federation) Module Federation implementation.

Scaffolded from [md-module-template](https://github.com/emporix/md-module-template) (`md-module-migration` branch); Tier 1 and config from `taxes`, mixins engine and audit-log tab from `customers`. See the `md-module-extraction` skill at the repository root for the workflow.

## Screens

Hash routes inside the remote (`src/constants/paths.ts`), mounted by the host on `/apps/management/sites-settings/*`:

| Path         | Screen                                                                                                                                            |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`          | List: every site of the tenant (inactive ones for a Sites Manager) with client-side filters and sort; row and batch delete (default site refused) |
| `/add`       | Create a site (General, Home Base Address, Location Coordinates, Assisted Buying)                                                                 |
| `/:siteCode` | Edit a site: Details, a tab per site mixin (toggle `filter-site-mixins` hides ten of them), and the entity changelog with `Audit Log Viewer`      |

`Sites Viewer` can view (fields read-only); `Sites Manager` can create, edit and delete. The remote loads permissions itself (`PermissionsProvider`).

API calls: `listSitesCall`, `getSiteCall` (`expand=mixin:*`), `createSiteCall`, `updateSiteCall`, `patchSiteCall`, `deleteSiteCall`, `listPaymentModesCall` and `listCountriesCall` from `@emporix/api-calls/next`, bound to the host tenant in `src/hooks/api/`.

## AppState

When the module is embedded in the Management Dashboard, the host passes an `appState` prop to `RemoteComponent`.

| Field             | Type                       | Description                                                                                                                    |
| ----------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `tenant`          | `string`                   | Current tenant identifier.                                                                                                     |
| `language`        | `string`                   | UI language from the dashboard (`en` or `de`).                                                                                 |
| `token`           | `string`                   | JWT access token for Emporix API calls.                                                                                        |
| `currency`        | `Entry`                    | Active currency.                                                                                                               |
| `contentLanguage` | `string`                   | Content language selected in the dashboard.                                                                                    |
| `user`            | `User`                     | Logged-in user.                                                                                                                |
| `onError`         | `(error: unknown) => void` | Host error handler.                                                                                                            |
| `onSitesChanged`  | `() => void` (optional)    | Host callback that reloads the dashboard's own site list (site switcher). Called after a create, update, mixin save or delete. |

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

The remote runs on a fixed local port, `5190` (`server.port` and `preview.port` in `vite.config.ts`, `strictPort: true`). The dashboard's `.env.local-*` files point `VITE_SITES_SETTINGS_URL` at `http://localhost:5190/assets/remoteEntry.js`.

```bash
npm run build:dev
npx vite preview --mode dev
```

Then start the dashboard with `serve:local-qa` (or another `local-*` mode) and open `/apps/management/sites-settings`.

Every `build*` script first runs `scripts/ensure-cors-origin.mjs`, which checks that the dashboard origin for that mode is in the `corsOrigins` list of `vite.config.ts` (`npm run check:cors -- --mode dev`).

### Standalone

```bash
npm run dev
```

The dev shell asks for tenant, token and language.

### Deploying

Sites Settings has no Firebase Hosting site of its own. It is published into the `sites-settings/` folder of the shared site of each environment: `https://frontend-extensions-develop.web.app/sites-settings/remoteEntry.js`, `https://frontend-extensions-stage.web.app/sites-settings/remoteEntry.js` and `https://frontend-extensions.web.app/sites-settings/remoteEntry.js` (prod). Workflows: `.github/workflows/sites-settings-firebase-*.yaml` — a preview per PR, dev and stage on merge to `master`, prod on a `sites-settings-*` tag. Each calls `.github/actions/deploy-remote`, which builds the remote flat with base `/sites-settings/` and replaces only this folder on the site. The remote imports `audit-log/`, so a change there redeploys it too.

## UI

No PrimeReact, PrimeFlex or PrimeIcons dependency. UI comes from `@emporix/component-library`, whose stylesheet is imported once in `RemoteComponent.tsx`; feature styles are SCSS Modules. See `docs/CL_WIDGET_STATUS.md` for the component-library equivalent of each PrimeReact widget.
