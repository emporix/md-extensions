# Emporix extension module

## Introduction

This is a module template designed for the Emporix platform. It is a React application that is built with Vite. It is based on the module federation concept described in [vite-plugin-federation](https://github.com/originjs/vite-plugin-federation) repository.

This implementation is a simple example of a module built for most common use cases.

The main goal was to provide a minimal setup for a module that can be used as a starting point for more complex modules.

## AI and code-assistant rules

Coding standards come from the shared [frontend-ai-rules](https://github.com/emporix/frontend-ai-rules) package. Rules sync automatically on `npm install` via the `postinstall` script.

| Agent | Index file | Rule files |
|-------|------------|------------|
| **Cursor** | `.cursorrules` | `.cursor/rules/*.mdc` |
| **GitHub Copilot** | `.github/copilot-instructions.md` | `.github/instructions/*.instructions.md` |
| **Claude Code** | `.claude/CLAUDE.md` | `.claude/rules/*.md` |

**Project-specific rules** (not overwritten on sync) live in `extension-module-template.*` — overrides and template-only patterns that extend global rules.

To re-sync global rules manually:

```bash
npm run sync:ai-rules
```

> **Note:** Synced index files and generic rule files are overwritten on install. Do not edit `00-core`, `api-data`, etc. — add project-specific rules in uniquely named files instead.

## Development

### Environment variables

Copy `.env.example` to `.env` and set the required variables:

- **VITE_API_URL** – Base URL for the Emporix API (e.g. `https://api-develop.emporix.io`). Used for product list and detail requests.

### Prerequisites
To get started, install the dependencies:

```bash
npm install
```

Before committing, run `npm run lint`, `npm run typecheck`, and `npm run test:run` to ensure the project passes checks.

### Testing module

To test it locally with the Emporix Management Dashboard, you first have to enable CORS in the Management Dashboard. To do this add the following to the `vite.config.ts` file:

```typescript
  server: {
    cors: {
      origin: '*',
      credentials: true,
    },
  },
  preview: {
    cors: {
      origin: '*',
      credentials: true,
    },
  },
```


Then build the project:

```bash
npm run build
```

and then start the local server:
```bash
npm run preview
```

You also need to add the module to the Management Dashboard:
- open the Dashboard
- go to `Administration/Extensions` page
- click `ADD NEW EXTENSION` button
- provide the name of the module
- enable module 
- provide the URL to the `remoteEntry.js` file (`http://localhost:4173/assets/remoteEntry.js`)
- add package name for the module - any name of your choosing. It should be a unique name for this tenant (e.g. `ordersmodule`)

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

Users and groups has no Firebase Hosting site of its own. It is published into the `users-and-groups/` folder of the shared site of each environment (COP-7348, COP-7439): `https://frontend-extensions-develop.web.app/users-and-groups/remoteEntry.js`, `https://frontend-extensions-stage.web.app/users-and-groups/remoteEntry.js` and `https://frontend-extensions.web.app/users-and-groups/remoteEntry.js` (prod). Workflows: `.github/workflows/users-and-groups-firebase-*.yaml` — a preview per PR, dev and stage on merge to `master`, prod on a `users-and-groups-*` tag (roll back by redeploying the previous tag). Each calls `.github/actions/deploy-remote`, which builds the remote flat with base `/users-and-groups/` (`.github/scripts/hosting/build-remote.mjs`) and replaces only this folder on the site. Local `npm run build:*` and `preview` are unchanged and still serve `/assets/remoteEntry.js`.

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

UI primitives come from `@emporix/component-library`. Pattern B widgets (DataTable, Dialog, Menu, Toast) ship with PrimeReact bundled inside the library — this module does **not** depend on `primereact` / `primeicons` directly.

Load styles once at the federated entry:

```ts
import '@emporix/component-library/styles'
```

Default styling is inherited from the Management Dashboard host when embedded.
