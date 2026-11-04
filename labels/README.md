# Labels

Management Dashboard "Labels" module, extracted into an `md-extensions` federated remote (COP-5597). React + Vite, using the [vite-plugin-federation](https://github.com/originjs/vite-plugin-federation) Module Federation implementation.

> Scaffolded from [md-module-template](https://github.com/emporix/md-module-template) (`md-module-migration` branch). Provider stack, shared UI, and domain screens are being ported in subsequent phases — see the `md-module-extraction` skill in this repo for the full workflow.

## AppState

When the module is embedded in the Management Dashboard, the host passes an `appState` prop to `RemoteComponent`. The dashboard builds this object in `ExternalModule` and forwards it through module federation (`DynamicComponent`).

| Field | Type | Description |
|-------|------|-------------|
| `tenant` | `string` | Current tenant identifier. |
| `language` | `string` | UI language from the dashboard (for example `en` or `de`). |
| `token` | `string` | JWT access token for Emporix API calls. |
| `currency` | `Entry` | Active currency (`id`, `label`, `default`, `required`). |
| `contentLanguage` | `string` | Content/catalog language selected in the dashboard. |
| `user` | `User` | Logged-in user (`userId`, optional `firstName` / `lastName` / `email`, `termsAndConditions`). |
| `onError` | `(error: unknown) => void` | Host error handler — call it when API requests fail; the dashboard uses it to re-authenticate on `401` responses. |
| `emporixApiUrl` | `string \| null` | Base URL of the Emporix API configured in the host (`VITE_API_URL`). `null` when the host has no API URL configured. |

The `emporixApiUrl` field was added in [management-dashboard#1592](https://github.com/emporix/management-dashboard/pull/1592) (COP-5905). It lets extensions use the same API endpoint as the dashboard instead of baking the URL into the remote build.

### Using AppState in this remote

- **Type** — `src/models/AppState.model.ts` defines the fields this remote reads: `tenant`, `language`, `token`, `contentLanguage`, `onError`, and optional `currency` and `user`.
- **Context** — `RemoteComponent` wraps routes with `DashboardProvider`; read values via `useDashboardContext()` in pages and components. Permissions come from `PermissionsProvider` (`usePermissions()`), not from `appState`.
- **API URL** — the shared `@emporix/api-calls` client is created in `src/api/bootstrap.ts` from `VITE_API_URL`, both standalone and embedded. `appState.emporixApiUrl` is not used.
- **Standalone dev** — `App.tsx` prompts for `tenant`, `token`, and `language` and passes them as `appState`; host-only fields are not available outside the dashboard.

## AI and code-assistant rules

Coding standards come from the shared [frontend-ai-rules](https://github.com/emporix/frontend-ai-rules) package. Generic rules and index files are **not committed** to this repository — they are downloaded and customized on `npm install` via the `postinstall` script.

| Agent | Index file (generated) | Generic rules (generated) | Project rules (in repo) |
|-------|------------------------|---------------------------|-------------------------|
| **Cursor** | `.cursorrules` | `.cursor/rules/*.mdc` | `.cursor/rules/extension-module-template.mdc` |
| **GitHub Copilot** | `.github/copilot-instructions.md` | `.github/instructions/*.instructions.md` | `.github/instructions/extension-module-template.instructions.md` |
| **Claude Code** | `.claude/CLAUDE.md` | `.claude/rules/*.md` | `.claude/rules/extension-module-template.md` |

Run `npm install` (or `npm run sync:ai-rules`) after cloning to generate index files and generic rules locally.

> **Note:** Synced files are overwritten on install. Do not edit `00-core`, `api-data`, etc. — add project-specific rules in uniquely named files instead (for example `extension-module-template.*`).

## Development

### Environment variables

Copy `.env.example` to `.env` and set the required variables:

- **VITE_API_URL** – Base URL for the Emporix API (e.g. `https://api-develop.emporix.io`). Used for the Labels API (`label/labels`) and the configuration, IAM, sites, feature-toggle and media calls the remote makes.

### Prerequisites
To get started, install the dependencies:

```bash
npm install
```

Before committing, run `npm run lint`, `npm run typecheck`, and `npm run test:run` to ensure the project passes checks.

### Testing module

The remote runs on a fixed local port, `5179` (`server.port` and `preview.port` in `vite.config.ts`, both with `strictPort: true`). The Management Dashboard's `.env.local-*` files point `VITE_LABELS_URL` at `http://localhost:5179/assets/remoteEntry.js`.

CORS is already configured. `vite.config.ts` keeps one shared `corsOrigins` whitelist that both the dev server and `vite preview` use:

- `https://admin.emporix.io`
- `https://dev-admin.emporix.io`
- `https://stage-admin.emporix.io`
- `http://localhost:4200` (the Management Dashboard dev server)

Every `build*` script first runs `scripts/ensure-cors-origin.mjs`, which checks that the dashboard origin for that mode is in the whitelist. The origin comes from `CORS_ORIGIN`, else `VITE_DASHBOARD_ORIGIN` in `.env.{mode}` / `.env`, else `https://admin.emporix.io`. If it is missing, the script asks to add it in an interactive terminal and fails the build otherwise. Run the check on its own with:

```bash
npm run check:cors -- --mode dev
```

To load the remote in a locally running Management Dashboard:

```bash
npm run build:dev
npx vite preview --mode dev
```

Then start the dashboard with `serve:local-qa` (or another `local-*` mode) and open `/apps/management/labels`.

To load it in a hosted dashboard instead, register it as an extension:
- open the Dashboard
- go to `Administration/Extensions` page
- click `ADD NEW EXTENSION` button
- provide the name of the module
- enable module
- provide the URL to the `remoteEntry.js` file (`http://localhost:5179/assets/remoteEntry.js`)
- add package name for the module - any name of your choosing. It should be a unique name for this tenant (e.g. `labelsmodule`)

You can find the Management Dashboard extensions documentation at [Administration - Extension Guides](https://developer.emporix.io/ce/management-dashboard/administration/extensions) and [Management Dashboard - Extension Guides](https://developer.emporix.io/ce/management-dashboard/administration/extensions).

### Seting up MCP Server with Emporix documentation
Click on the link to the Emporix documentation:

[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/en-US/install-mcp?name=emporixdocs&config=eyJ1cmwiOiJodHRwczovL2RldmVsb3Blci5lbXBvcml4LmlvL2FwaS1yZWZlcmVuY2VzL35naXRib29rL21jcCIsImhlYWRlcnMiOnt9LCJ0eXBlIjoiaHR0cCJ9)

You can also set up MCP Server manually with Emporix documentation by adding the following to your .mcp.json file:

```json
 "emporixdocs": {
    "url": "https://developer.emporix.io/api-references/~gitbook/mcp",
    "headers": {},
    "type": "http",
  },
```


### Deploying

In order to use the module in the Emporix Management Dashboard, deploy it to a hosting service and then provide the URL to the `remoteEntry.js` in the Emporix Management Dashboard.

App hosting should have CORS set up to allow the module to be loaded from emporix domain.
Example of CORS configuration for Firebase hosting:

```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "headers": [
      {
        "source": "**",
        "headers": [
          {
            "key": "Access-Control-Allow-Origin",
            "value": "*"
          }
        ]
      }
    ]
  }
}
```

### Testing standalone module
This project can be run locally outside of Management Dashboard using the following command:

```bash
npm run dev
```

You will be requested to provide app context on the start if you access the localhost-url directly:
- tenant name
- auth token (JWT token)
- language  ('en' or 'de')

## Customizing the module

This remote has no direct PrimeReact, PrimeFlex or PrimeIcons dependency. UI primitives
(buttons, inputs, DataTable, Tabs, Dropdown, Editor, FileUpload, Toast) come from
`@emporix/component-library`, whose stylesheet is imported once in `RemoteComponent.tsx`
(and `App.tsx` for standalone dev):

```ts
import '@emporix/component-library/styles'
```

That stylesheet also bundles the PrimeIcons font, so `pi pi-*` class names keep working
without adding `primeicons`. Feature styling uses SCSS Modules next to each component.
Do not add `primereact`, `primeflex` or `primeicons` to `package.json`; see
`docs/CL_WIDGET_STATUS.md` in md-extensions for the component-library equivalent of each
PrimeReact widget.
