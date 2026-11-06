# App kind and browser (setup)

Record how this repo is used so later skills do not guess. UI QA
(`emporix-qa-ui`) runs only when `app.kind` is `ui` or `fullstack`.
Backend-only repos never call a browser.

## Detect `app.kind`

From root (and one-level workspace) manifests only:

| Signal | Kind |
|---|---|
| UI framework (React, Vue, Angular, Next, Nuxt, Svelte, cockpit/frontend app) and no API-only server | `ui` |
| API/server framework (Nest, Express, Spring, Quarkus, FastAPI, Go service) and no UI app | `backend` |
| Both | `fullstack` |
| Unclear | ask — this is one of the few setup questions |

Do not read `src/` to decide.

## Detect start + URL

- Scripts named `start`, `dev`, `serve`, `preview` (runner from the lockfile); Spring `bootRun`, Quarkus `quarkusDev`, `docker compose up` when the compose file is the documented way to run locally.
- README `localhost:{port}` or a `server.port` / `PORT` in a checked-in non-secret config.
- Management Dashboard (`management-dashboard` repo, package `md`, or a `serve:local-qa` script): QA start is `npm run serve:local-qa` / `yarn serve:local-qa`, base URL typically `http://localhost:4200`. Do **not** record default `serve` — that mode uses Ory and has no token gate.
- Otherwise leave `start` / `baseUrl` empty. Do not invent a port. QA skills ask at runtime and the report says so.

Ready path: `/actuator/health`, `/health`, `/healthz`, `/q/health` when the
framework or config shows it; otherwise `/`.

## Detect token-gate auth

Set `app.auth` when the first screen is Tenant / Token / Language. The values
themselves come from the developer's tenant profiles (`~/.emporix/tenants.json`,
`scripts/tenants.sh`) at QA time, never from config:

| Signal | `app.auth` |
|---|---|
| Repo / remote / folder `management-dashboard`, package name `md` with `serve:local-qa`, or `.env.local-qa` | `md-token` |
| Repo or package name matches `cockpit*`, a module-federation remote cockpit, or the user says this is an Emporix cockpit | `cockpit-token` |

Management Dashboard is **not** a cockpit template; never set `cockpit-token`
on it. Otherwise omit `app.auth`. Never write a tenant or token value anywhere.

## Config fields

```json
"app": {
  "kind": "ui",
  "auth": "cockpit-token",
  "start": "npm run start",
  "baseUrl": "http://localhost:4173",
  "readyPath": "/",
  "authLanguage": "en"
},
"browser": { "provider": "agent-browser" }
```

Field meanings: `config.md`. Local artifact folders are fixed: `.ai/qa`
(evidence), `.ai/mockups` (pre-existing HTML/PNG mockups — nothing creates
these anymore; implement still reads a `{KEY}-*` folder when one is there),
`.ai/designs` (Figma design folders written on demand by `emporix-design`),
`.ai/demos` (demo recordings).

## Browser descriptor

Nothing is installed into the repo. For `ui` / `fullstack` the loader resolves
`BROWSER_FILE` to `$SKILLS_ROOT/emporix-setup/references/browsers/<provider>.md`,
or to `.ai/overrides/browsers/<provider>.md` when a repo-local override exists.
Setup only verifies that the resolved file exists (workflow step 7).

Default provider is `agent-browser` (headless). `cursor-ide-browser` exists for
a human who explicitly wants a visible tab. A custom provider is
`browsers/TEMPLATE.md` filled in and saved as `.ai/overrides/browsers/<name>.md`
with `--set browser.provider=<name>`.

The `agent-browser` CLI itself is installed lazily by `emporix-qa-ui`
(`qa-browser.sh ensure`) into a per-user cache on the first QA run, never
during setup and never into the repo.

## `AGENTS.md`

The **App** section records kind, auth, start, base URL, and ready path. The
routing table gets a “UI / pages” row when kind is `ui` or `fullstack`.
