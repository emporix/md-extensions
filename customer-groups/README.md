# Emporix Customer Groups module

## Introduction

Customer Groups is a federated module for the Emporix Management Dashboard. It is a React application built with Vite, using the module federation concept described in the [vite-plugin-federation](https://github.com/originjs/vite-plugin-federation) repository.

The module manages IAM groups of `userType: CUSTOMER` — listing, creating, editing, deleting groups, managing their members, and assigning access controls.

### Host integration

| Contract | Value |
|----------|-------|
| Federation `name` | `customerGroups` |
| Exposed module | `./RemoteComponent` |
| MD route key | `customerGroups` |
| MD route path | `administration/customer-groups/*` |
| MD env variable | `VITE_CUSTOMER_GROUPS_URL` |

The remote uses a `HashRouter` with hash-relative paths (`/`, `/groups/add`, `/groups/:groupId`). The host stays on `BrowserRouter`.

It was extracted from `management-dashboard/src/modules/usersAndGroups` and shares its scaffold with the `users-and-groups` remote (the extraction pilot).

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

- **VITE_API_URL** – Base URL for the Emporix API (e.g. `https://api-develop.emporix.io`). Used for all IAM group, user, and configuration requests.

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

UI primitives come from `@emporix/component-library`. Pattern B widgets (DataTable, Dialog, Menu, Toast) ship with PrimeReact bundled inside the library — this module does **not** depend on `primereact` / `primeicons` directly.

Load styles once at the federated entry:

```ts
import '@emporix/component-library/styles'
```

Default styling is inherited from the Management Dashboard host when embedded.
