# Coupons

Management Dashboard "Coupons" module (Management → Coupons), extracted into an `md-extensions` federated remote (COP-7188, epic COP-5597). A coupon is a record of the Coupon Service: a code, a name, a discount (percent, absolute amount, or free shipping), validity and minimum order value, and restrictions on who may redeem it (customers, segments, categories, vendors). React + Vite, using the [vite-plugin-federation](https://github.com/originjs/vite-plugin-federation) Module Federation implementation.

Scaffolded from [md-module-template](https://github.com/emporix/md-module-template) (`md-module-migration` branch); Tier 1 infrastructure is aligned with `status-codes`, and the table extensions, mixins subsystem and audit log come from `orders`. See the `md-module-extraction` skill at the repository root for the workflow.

## Screens

Hash routes inside the remote (`src/constants/paths.ts`), mounted by the host on `/apps/management/coupons/*`:

| Path | Screen |
|------|--------|
| `/` | List: server-side paging, filters (code, name, discount type, redemption count, category coupon) and sorting, `ext_coupons` column visibility with coupon mixin columns, row edit and delete, batch delete |
| `/add` | Create a coupon (tabs General, Type, Rules) |
| `/:code` | Edit a coupon (URL-encoded code; adds mixin tabs and the Audit log tab). The code is read-only after create. |

`Coupons Viewer` can view; `Coupons Manager` can create, edit and delete. A restriction (specific customers, segments, categories, vendors) is editable only for a manager who also has the matching viewer permission; `Audit Log Viewer` shows the Audit log tab. The remote loads permissions itself (`PermissionsProvider`).

API calls: `fetchCoupons`, `fetchCoupon`, `createNewCoupon`, `modifyCoupon`, `patchCouponCall` (mixins), `removeCoupon` from `@emporix/api-calls`, bound to the host tenant in `src/hooks/api/coupons.ts`. The restriction selectors use `getCustomers`, `getSegmentsCall`, `getCategories` and `getVendorsCall` (`src/hooks/api/`).

## AppState

When the module is embedded in the Management Dashboard, the host passes an `appState` prop to `RemoteComponent`.

| Field | Type | Description |
|-------|------|-------------|
| `tenant` | `string` | Current tenant identifier. |
| `language` | `string` | UI language from the dashboard (`en` or `de`). |
| `token` | `string` | JWT access token for Emporix API calls. |
| `currency` | `Entry` | Active currency; new coupons take it for their money fields. |
| `contentLanguage` | `string` | Content language selected in the dashboard. |
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

The remote runs on a fixed local port, `5181` (`server.port` and `preview.port` in `vite.config.ts`, `strictPort: true`). The dashboard's `.env.local-*` files point `VITE_COUPONS_URL` at `http://localhost:5181/assets/remoteEntry.js`.

```bash
npm run build:dev
npx vite preview --mode dev
```

Then start the dashboard with `serve:local-qa` (or another `local-*` mode) and open `/apps/management/coupons`.

Every `build*` script first runs `scripts/ensure-cors-origin.mjs`, which checks that the dashboard origin for that mode is in the `corsOrigins` list of `vite.config.ts` (`npm run check:cors -- --mode dev`).

### Standalone

```bash
npm run dev
```

The dev shell asks for tenant, token and language.

### Deploying

Firebase Hosting targets `emporix-coupons-develop`, `emporix-coupons-stage` and `emporix-coupons` (root `firebase.json`, `.firebaserc`). Workflows: `.github/workflows/coupons-firebase-*.yaml` — a preview per PR, dev and stage on merge to `master`, prod on a `coupons-*` tag. The Firebase Hosting sites must exist before the first deploy.

## UI

No PrimeReact, PrimeFlex or PrimeIcons dependency. UI comes from `@emporix/component-library` (≥ 2.19.0 for `Divider`), whose stylesheet is imported once in `RemoteComponent.tsx`; feature styles are SCSS Modules. See `docs/CL_WIDGET_STATUS.md` for the component-library equivalent of each PrimeReact widget.
