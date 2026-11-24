# System Preferences

Management Dashboard "System Preferences" module, extracted into an `md-extensions` federated remote (COP-7194, epic COP-5597). It lists a fixed set of tenant configuration keys of the Configuration Service and edits each one inline in its table row. React + Vite, using the [vite-plugin-federation](https://github.com/originjs/vite-plugin-federation) Module Federation implementation.

Scaffolded from [md-module-template](https://github.com/emporix/md-module-template) (`md-module-migration` branch); Tier 1 infrastructure is aligned with `status-codes`. See the `md-module-extraction` skill at the repository root for the workflow.

## Screens

One hash route, `/`, mounted by the host on `/apps/management/system-preferences/*`: a client-side table (Name, Key, Value, contains filters, 10 rows a page) of the keys in `src/configs/systemPreferences.ts`.

- A key the tenant has not set shows its default (or nothing).
- The row editor matches the type: dropdown (`ENUM`), switch (`BOOLEAN`), comma-separated text (`LIST`), empty password field (`PASSWORD`), text otherwise. Save creates the key when the tenant does not have it, else updates it (a 404 on update creates it). Values are stored typed: number, boolean, string array.
- `openAiApiToken` is `secured`: saved with `secured: true`, never read back, shown as `********`; an empty value is not saved, and **Clear value** (in edit mode, with a confirmation) deletes it.

`System Preferences Viewer` can view; `System Preferences Manager` can edit and clear. The remote loads permissions itself (`PermissionsProvider`).

API calls: `getConfigurationCall`, `createConfigurationsCall`, `deleteConfigurationCall` from `@emporix/api-calls/next` and `upsertConfiguration` from `@emporix/api-calls/platform`, bound to the host tenant in `src/hooks/api/configuration.ts`.

## AppState

When the module is embedded in the Management Dashboard, the host passes an `appState` prop to `RemoteComponent`.

| Field | Type | Description |
|-------|------|-------------|
| `tenant` | `string` | Current tenant identifier. |
| `language` | `string` | UI language from the dashboard (`en` or `de`). |
| `token` | `string` | JWT access token for Emporix API calls. |
| `currency` | `Entry` | Active currency. |
| `contentLanguage` | `string` | Content language selected in the dashboard; not used by this module. |
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

The remote runs on a fixed local port, `5191` (`server.port` and `preview.port` in `vite.config.ts`, `strictPort: true`). The dashboard's `.env.local-*` files point `VITE_SYSTEM_PREFERENCES_URL` at `http://localhost:5191/assets/remoteEntry.js`.

```bash
npm run build:dev
npx vite preview --mode dev
```

Then start the dashboard with `serve:local-qa` (or another `local-*` mode) and open `/apps/management/system-preferences`.

Every `build*` script first runs `scripts/ensure-cors-origin.mjs`, which checks that the dashboard origin for that mode is in the `corsOrigins` list of `vite.config.ts` (`npm run check:cors -- --mode dev`).

### Standalone

```bash
npm run dev
```

The dev shell asks for tenant, token and language.

### Deploying

System Preferences has no Firebase Hosting site of its own. It is published into the `system-preferences/` folder of the shared site of each environment: `https://frontend-extensions-develop.web.app/system-preferences/remoteEntry.js`, `https://frontend-extensions-stage.web.app/system-preferences/remoteEntry.js` and `https://frontend-extensions.web.app/system-preferences/remoteEntry.js` (prod). Workflows: `.github/workflows/system-preferences-firebase-*.yaml` — a preview per PR, dev and stage on merge to `master`, prod on a `system-preferences-*` tag. Each calls `.github/actions/deploy-remote`, which builds the remote flat with base `/system-preferences/` and replaces only this folder on the site.

## UI

No PrimeReact, PrimeFlex or PrimeIcons dependency. UI comes from `@emporix/component-library`, whose stylesheet is imported once in `RemoteComponent.tsx`; feature styles are SCSS Modules. Inline row editing uses the CL `DataTable` pass-through of PrimeReact row editing (`editMode="row"`, a `rowEditor` column whose `body` draws the edit, save, cancel and clear buttons). See `docs/CL_WIDGET_STATUS.md` for the component-library equivalent of each PrimeReact widget.
