# Emporix customer module (Management Dashboard extension)

React **Module Federation** remote for **customers** in the [Emporix Management Dashboard](https://developer.emporix.io/user-guides/management-dashboard). Built with Vite and [@originjs/vite-plugin-federation](https://github.com/originjs/vite-plugin-federation).

## License

GPL-3.0 — see [LICENSE](./LICENSE). Security reporting: [SECURITY.md](./SECURITY.md).

## Prerequisites

- **Node.js** ≥ 18 (see [`.nvmrc`](./.nvmrc))
- **Yarn** 1.x (or use `npm` equivalents)

## Configuration

1. Copy [`.env.example`](./.env.example) to `.env` (and optionally mode-specific files used by Vite, e.g. `.env.prod` for `--mode prod`).
2. Set **`VITE_API_URL`** to your REST API base URL (no trailing slash), e.g. `https://api.example.com`.

`.env` and `.env.*` are **gitignored** — do not commit real URLs or secrets; keep templates in `.env.example` only.

Optional:

- **`VITE_DISABLE_ASSISTED_BUYING`** — set to `true` to hide assisted-buying UI.

## Host integration (`appState`)

When loaded from the Management Dashboard, the host passes **`appState`** into the exposed `RemoteComponent`. The extension expects at least:

| Field | Role |
|--------|------|
| `tenant` | Sent as `Emporix-Tenant` on API requests |
| `token` | JWT / bearer token for `Authorization` |
| `language` | UI language (e.g. `en`, `de`); drives i18n and PrimeReact locales |
| `contentLanguage` | Content language context |
| `currency` | Optional currency entry |
| `permissions` | Permission map for feature gating |
| `user` | Host user object (shape may vary) |
| `onError` | Called on 401 from the API client |

**Standalone / local preview:** the default `appState` uses placeholder `tenant` and `token` so the tree mounts and `ApiProvider` renders. That mode is **for development only** — **do not** use placeholder credentials in production; always embed the remote in the Dashboard with real `appState`.

Official guides: [Administration — Extensions](https://developer.emporix.io/user-guides/management-dashboard/administration/extensions), [Extensions](https://developer.emporix.io/user-guides/management-dashboard/extensions/extensions).

## Development

Install dependencies:

```bash
yarn install
```

### Federation `remoteEntry.js`

Plain `vite` dev mode often **does not** serve a real federated `remoteEntry.js` (the request can fall through to SPA HTML). For integration testing with the Dashboard, use one of:

```bash
# Production-mode build + preview (recommended)
yarn serve:prod
```

or build with watch + preview:

```bash
yarn build:prod:watch
# in another terminal
yarn preview
```

Register the extension in the Dashboard with the preview URL to **`remoteEntry.js`** (Vite preview may serve it at the root, e.g. `http://localhost:5173/remoteEntry.js`, or under `/assets/` depending on config — use the URL your build actually serves).

### CORS

Dev server and preview use an **allowlist** of Management Dashboard origins (see `vite.config.ts`), aligned with other `md-extensions` remotes. For Firebase or other static hosting, configure `Access-Control-Allow-Origin` (or equivalent) so the **MD admin origin** that loads the script is permitted.

### Other scripts

| Script | Purpose |
|--------|---------|
| `yarn dev` / `yarn dev:stage` / `yarn dev:prod` | Vite dev with mode |
| `yarn build:dev` / `yarn build:stage` / `yarn build:prod` | Typecheck + production build |
| `yarn preview` | Serve last build |
| `yarn lint` | ESLint |
| `yarn test:run` | Vitest (CI) |

## Tests

```bash
yarn test:run
```

Uses **Vitest** 3.x (same idea as other `md-extensions` remotes). Requires **Node.js 18+** (same as `engines` and `yarn build:prod`).

## Mixins and `ReferenceSelector`

Mixin reference fields use [`ReferenceSelector`](./src/components/mixins/ReferenceSelector.tsx). It may read **`customInstanceId` from the URL** when not passed as a prop. If you rely on **custom instances**, confirm routing and API coverage for your tenant setup.

## Porting from Management Dashboard

See the Management Dashboard doc (if available in your checkout): `management-dashboard/docs/converting-md-modules-to-federation-extensions.md`. A short pointer also lives in the parent repo: [`../CONVERTING_FROM_MANAGEMENT_DASHBOARD.md`](../CONVERTING_FROM_MANAGEMENT_DASHBOARD.md).

## Import audit

Optional script to list source files not reachable from federation entry points:

```bash
node scripts/audit-extension-imports.mjs
```

## Stack notes

- **PrimeReact** 8 + **PrimeFlex** + **PrimeIcons**
- **react-router-dom** v6 (HashRouter inside the remote)
- **react-i18next** — PrimeReact locale data is registered in-bundle (`syncPrimeReactLocale`) so Calendar and filters work when the Dashboard language is not English.

## Customizing UI

You may replace PrimeReact / PrimeFlex with your own stack; remove unused packages and theme imports from [`RemoteComponent.tsx`](./src/RemoteComponent.tsx) and [`App.tsx`](./src/App.tsx) as needed.
