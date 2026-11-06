---
name: module-federation
description: Module Federation entry points and Vite federation config
paths: ["**/RemoteComponent.tsx", "**/vite.config.ts", "**/main.tsx"]
always: false
requires: @originjs/vite-plugin-federation
---

# Module Federation

Skip this rule if the project is not a federated micro-frontend.

## Vite Config

- Expose remote entry via `@originjs/vite-plugin-federation` (or project equivalent)
- Set `build.target: 'esnext'` and `modulePreload: false` when using federation
- **Do not add new shared dependencies without verifying the host app also shares them**

## Entry Point

- Federated apps expose a single remote component (e.g. `RemoteComponent.tsx`)
- Import global styles once at the remote entry — not in leaf components:
  - PrimeReact / PrimeFlex / PrimeIcons CSS (if used)
  - App theme and `@emporix/component-library/styles`

## Provider Hierarchy

- Wrap the remote tree with required providers (data, toast, i18n, feature contexts)
- Order matters — data providers should wrap feature routes
- Document provider order in the project index when adding new providers

## Local Dev

- Provide a standalone dev shell (`main.tsx`) for local development without the host
- Use environment-specific BFF/API endpoints via Vite modes when applicable
- Pin a unique `server.port` and `preview.port` with `strictPort: true` so remotes do not collide when run side by side

## Management Dashboard Remotes

Apply this section when the host is the Emporix Management Dashboard (an extension module loaded through `remoteEntry.js`).

These rules (and the port rule above) apply to new remotes and to remotes a task is migrating. Some existing remotes predate them — federation `name: 'extension'`, no `strictPort`. Do not rename them or change their ports as a drive-by: the host route `key` / `ExternalModule.moduleName` and the host `.env*` remote URLs depend on those values, so change them only when the task asks for it, together with the host.

### Federation config

- Federation `name` must equal the host route `key` and `ExternalModule.moduleName` (camelCase). Never name the remote `extension`.
- Expose `./RemoteComponent` only.
- Keep `build.cssCodeSplit: false`.
- List `react`, `react-dom`, `react-router`, and `react-i18next` in `shared` (the remote convention). The host shares only `react`, `react-dom`, `react-router-dom`, and `@apollo/client`, so only React is actually shared: the remote runs its own `react-router` and `react-i18next` instances. Never rely on the host's router or i18n context — route with the remote's own `HashRouter` and sync the language from `appState` (below). Do not change the host's `shared` list as part of remote work.

### Host state

- The host passes `appState` to `RemoteComponent`: `tenant`, `language`, `token`, `contentLanguage`, `currency`, `onError`, and an optional `user`.
- Read these values through a context provider wrapping the routes; never hardcode tenant or token.
- Do not fetch the Ory session inside the remote — use the host's `user`.
- Do not put `permissions` on `appState`; resolve permissions in a provider inside the remote.
- Call `i18n.changeLanguage(appState.language)` in `RemoteComponent` when the host language changes.

### Routing

- Use `HashRouter` inside the remote — the host owns `BrowserRouter`.
- Route paths are hash-relative (`/`, `/users/:id`), kept in a constants module. Never use host absolute paths such as `/administration/...`.

### Styling and widgets

- Use SCSS Modules for feature UI so host global CSS does not override the remote and remote styles do not leak into the host. Keep any global stylesheet to a minimal shell.
- Load only `@emporix/component-library/styles` at the entry. Do not add `primereact` / `primeicons` dependencies or CSS to the remote — use the component library equivalents.
