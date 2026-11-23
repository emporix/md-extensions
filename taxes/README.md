# Taxes

Management Dashboard "Taxes" module (Settings → Tax), extracted into an `md-extensions` federated remote (COP-7191). The Tax Service keeps one record per country; each record holds that country's tax classes (code, localized name and description, rate in percent). React + Vite, using the [vite-plugin-federation](https://github.com/originjs/vite-plugin-federation) Module Federation implementation.

Scaffolded from the `units` remote (itself from [md-module-template](https://github.com/emporix/md-module-template), `md-module-migration` branch). See the `md-module-extraction` skill at the repository root for the workflow.

## Screens

Hash routes inside the remote (`src/constants/paths.ts`), mounted by the host on `/apps/management/taxes/*`:

| Path                          | Screen                                                                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `/`                           | List: server-paged country records with a country-code filter and sort; a row expands to its tax classes; row and batch delete |
| `/add`                        | Add a tax class (creates the country record or appends to it)                                                                  |
| `/:countryCode/:taxClassCode` | Edit a tax class (country read-only)                                                                                           |

`Taxes Viewer` can view (a class opens read-only); `Taxes Manager` can add, edit and delete. The remote loads permissions itself (`PermissionsProvider`).

API calls: `listTaxesCall`, `getTaxCall`, `createTaxCall`, `updateTaxCall`, `deleteTaxCall` and `listCountriesCall` from `@emporix/api-calls/next`, bound to the host tenant in `src/hooks/api/taxes.ts` and `src/hooks/api/countries.ts`.

## AppState

When the module is embedded in the Management Dashboard, the host passes an `appState` prop to `RemoteComponent`.

| Field             | Type                       | Description                                                                    |
| ----------------- | -------------------------- | ------------------------------------------------------------------------------ |
| `tenant`          | `string`                   | Current tenant identifier.                                                     |
| `language`        | `string`                   | UI language from the dashboard (`en` or `de`).                                 |
| `token`           | `string`                   | JWT access token for Emporix API calls.                                        |
| `currency`        | `Entry`                    | Active currency.                                                               |
| `contentLanguage` | `string`                   | Content language selected in the dashboard; the name column and filter use it. |
| `user`            | `User`                     | Logged-in user.                                                                |
| `onError`         | `(error: unknown) => void` | Host error handler.                                                            |

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

The remote runs on a fixed local port, `5189` (`server.port` and `preview.port` in `vite.config.ts`, `strictPort: true`). The dashboard's `.env.local-*` files point `VITE_TAXES_URL` at `http://localhost:5189/assets/remoteEntry.js`.

```bash
npm run build:dev
npx vite preview --mode dev
```

Then start the dashboard with `serve:local-qa` (or another `local-*` mode) and open `/apps/management/taxes`.

Every `build*` script first runs `scripts/ensure-cors-origin.mjs`, which checks that the dashboard origin for that mode is in the `corsOrigins` list of `vite.config.ts` (`npm run check:cors -- --mode dev`).

### Standalone

```bash
npm run dev
```

The dev shell asks for tenant, token and language.

### Deploying

Taxes has no Firebase Hosting site of its own. It is published into the `taxes/` folder of the shared site of each environment (COP-7348, as Classifications and Quotes): `https://frontend-extensions-develop.web.app/taxes/remoteEntry.js`, `https://frontend-extensions-stage.web.app/taxes/remoteEntry.js` and `https://frontend-extensions.web.app/taxes/remoteEntry.js` (prod). Workflows: `.github/workflows/taxes-firebase-*.yaml` — a preview per PR, dev and stage on merge to `master`, prod on a `taxes-*` tag. Each calls `.github/actions/deploy-remote`, which builds the remote flat with base `/taxes/` (`.github/scripts/hosting/build-remote.mjs`) and replaces only this folder on the site. Local `npm run build:*` and `preview` are unchanged and still serve `/assets/remoteEntry.js`.

## UI

No PrimeReact, PrimeFlex or PrimeIcons dependency. UI comes from `@emporix/component-library`, whose stylesheet is imported once in `RemoteComponent.tsx`; feature styles are SCSS Modules. See `docs/CL_WIDGET_STATUS.md` for the component-library equivalent of each PrimeReact widget.
