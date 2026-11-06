# Status codes

Management Dashboard "Status codes" module (Quotes → Status codes), extracted into an `md-extensions` federated remote (COP-7172, epic COP-5597). A status code is a **quote reason** of the Quote Service: a `CHANGE` or `DECLINE` type, a code, and a localized comment. React + Vite, using the [vite-plugin-federation](https://github.com/originjs/vite-plugin-federation) Module Federation implementation.

Scaffolded from [md-module-template](https://github.com/emporix/md-module-template) (`md-module-migration` branch); Tier 1 infrastructure is aligned with `labels`. See the `md-module-extraction` skill at the repository root for the workflow.

## Screens

Hash routes inside the remote (`src/constants/paths.ts`), mounted by the host on `/apps/management/status-codes/*`:

| Path | Screen |
|------|--------|
| `/` | List: code and type columns with contains filters and sorting, row edit and delete, batch delete |
| `/add` | Create a status code |
| `/:id` | Edit a status code (sends the loaded `metadata.version`) |

`Status Codes Viewer` can view; `Status Codes Manager` can create, edit and delete. The remote loads permissions itself (`PermissionsProvider`).

API calls: `getQuotesReasonsCall`, `getQuoteReasonByIdCall`, `createQuoteReasonCall`, `editQuoteReasonCall`, `deleteQuoteReasonCall` from `@emporix/api-calls`, bound to the host tenant in `src/hooks/api/quoteReasons.ts`.

## AppState

When the module is embedded in the Management Dashboard, the host passes an `appState` prop to `RemoteComponent`.

| Field | Type | Description |
|-------|------|-------------|
| `tenant` | `string` | Current tenant identifier. |
| `language` | `string` | UI language from the dashboard (`en` or `de`). |
| `token` | `string` | JWT access token for Emporix API calls. |
| `currency` | `Entry` | Active currency. |
| `contentLanguage` | `string` | Content language selected in the dashboard; shown first in the comment field. |
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

The remote runs on a fixed local port, `5180` (`server.port` and `preview.port` in `vite.config.ts`, `strictPort: true`). The dashboard's `.env.local-*` files point `VITE_STATUS_CODES_URL` at `http://localhost:5180/assets/remoteEntry.js`.

```bash
npm run build:dev
npx vite preview --mode dev
```

Then start the dashboard with `serve:local-qa` (or another `local-*` mode) and open `/apps/management/status-codes`.

Every `build*` script first runs `scripts/ensure-cors-origin.mjs`, which checks that the dashboard origin for that mode is in the `corsOrigins` list of `vite.config.ts` (`npm run check:cors -- --mode dev`).

### Standalone

```bash
npm run dev
```

The dev shell asks for tenant, token and language.

### Deploying

Firebase Hosting targets `emporix-status-codes-develop`, `emporix-status-codes-stage` and `emporix-status-codes` (root `firebase.json`, `.firebaserc`). Workflows: `.github/workflows/status-codes-firebase-*.yaml` — a preview per PR, dev and stage on merge to `master`, prod on a `status-codes-*` tag. The Firebase Hosting sites must exist before the first deploy.

## UI

No PrimeReact, PrimeFlex or PrimeIcons dependency. UI comes from `@emporix/component-library`, whose stylesheet is imported once in `RemoteComponent.tsx`; feature styles are SCSS Modules. See `docs/CL_WIDGET_STATUS.md` for the component-library equivalent of each PrimeReact widget.
