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

### Hosting and CI

Two deploy models exist. Pick one per remote before writing its workflows:

- **Management Dashboard module** — a module migrated out of the Management Dashboard, or a new Management Dashboard module → the shared Hosting site. Do not ask.
- **Any other remote** → ask the user once whether it deploys to the shared Hosting site or to Hosting sites of its own, and follow the answer. Do not choose for them.

An existing remote keeps the model it already has, unless the task is to move it.

**Shared Hosting site (md-extensions, COP-7348).** Each remote on it is published into its own folder of one shared Firebase Hosting site per environment (`frontend-extensions-develop`, `frontend-extensions-stage`, `frontend-extensions`) by the repository's deploy action (`.github/actions/deploy-remote`). For such a remote:

- Copy the workflows of a remote that already deploys this way (in md-extensions: the `classifications-firebase-*.yaml` trio) and rename the remote. Steps, secrets and URLs: the repository's migration playbook (md-extensions `docs/MODULE_MIGRATION_PLAYBOOK.md` §9).
- Never create a Hosting site, add a `firebase.json` hosting entry or a `.firebaserc` target, or add a `FirebaseExtended/action-hosting-deploy` step for such a remote.
- Never set `base` or `build.assetsDir` in `vite.config.ts`, or `--base` in a `package.json` script: the deploy action sets the base in CI. Local `build` and `preview` keep serving `/assets/remoteEntry.js`.
- Host `.env.dev` / `.env.dev-test` / `.env.stage` / `.env.prod` load `https://frontend-extensions(-develop|-stage)?.web.app/<remote-folder>/remoteEntry.js`; `.env.local-*` stay on `http://localhost:<port>/assets/remoteEntry.js`.
- `ensure-firebase-hosting.sh` finds no hosting entry for such a remote and reports nothing in scope; that is the expected result, not a gap to fill.

**One site per remote and environment.** For older remotes that keep their own sites, and for a remote whose user chose sites of its own, the rest of this section applies:

- A remote deployed to Firebase Hosting has one hosting entry per environment in `firebase.json` (`target`, `public` inside the remote folder), each target mapped to a site in `.firebaserc` `targets`, and deploy workflows that name those targets.
- The sites must exist in their Firebase projects, and the workflows' service-account secrets must be available to the repository, **before the first push of a new remote**. The PR preview workflow deploys to a channel of the develop site and fails when the site is missing. Adding the target to `.firebaserc` does not create the site.
- Check with `$SKILLS_ROOT/emporix-frontend-standards/scripts/ensure-firebase-hosting.sh --changed` from the repository root (`--remote <folder>` for one remote) before every push that opens or updates a pull request (`SKILL.md` § Before a pull request). Exit `3` lists `SITE … missing`, `SECRET … missing`, or `UNMAPPED …`.
- A missing site: ask the user, then re-run with `--create`. Creating a site writes to a shared Firebase project and needs the user's Firebase login with access to it. Never create one unasked, and never guess another site name to make the check pass.
- A missing secret or an unmapped target: stop and tell the user. Secrets are set by a repository or organization admin; the agent never creates them.

In both models, never commit `.firebase/` (the CLI deploy cache).

### Styling and widgets

- Use SCSS Modules for feature UI so host global CSS does not override the remote and remote styles do not leak into the host. Keep any global stylesheet to a minimal shell.
- Load only `@emporix/component-library/styles` at the entry. Do not add `primereact` / `primeicons` dependencies or CSS to the remote — use the component library equivalents.
