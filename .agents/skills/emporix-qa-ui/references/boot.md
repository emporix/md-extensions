# Fresh app every run

Run detection first, then resolve `BASE_URL`, then recycle the port, then
start. Do **not** attach to an already-running preview. Stale Vite/browser
cache caused false 401s. Always recycle the server.

## Detect auth and start command

```bash
DETECT=$(skill_script emporix-qa-ui detect-ui-auth.sh)
sh "$DETECT"
```

Use `START` from that output when it is non-empty. **Management Dashboard**
(`AUTH=md-token`) is not a cockpit template: default `yarn serve` /
`npm run serve` uses Ory (no Tenant/Token form). QA must start
`serve:local-qa` so the same Tenant / Token / Language / Save gate as
cockpits is shown. Do **not** start an Ory tunnel (`localhost:4000`) and
do **not** wait for a hosted Sign-in page.

Otherwise `app.start` is required. Empty `START` / `app.start` → **stop**
and ask. Do not invent a port.

## Resolve BASE_URL

`BASE_URL` comes from `--base-url`, else `app.baseUrl`, else
`BASE_URL_HINT` from detection (MD defaults to `http://localhost:4200`).
Origin only. Stop only if the resolved URL is still empty.

## Stop whatever is on that port

Parse the port from `BASE_URL` (e.g. `4173`). Then:

```bash
PIDS=$(lsof -ti tcp:"$PORT" -sTCP:LISTEN 2>/dev/null || true)
if [ -n "$PIDS" ]; then
  echo "Stopping listeners on $PORT: $PIDS"
  kill $PIDS 2>/dev/null || true
  sleep 1
  kill -9 $PIDS 2>/dev/null || true
fi
```

If `lsof` is missing, stop the process you started last time. Do not leave a
second copy on another port.

## Start

Run **exactly** the detected `START` (or `app.start`) in the background (no
extra `vite build` unless the command includes one) from the plan's
**Branch / worktree** path when it names a worktree; otherwise this checkout (ticket branch).
Wait until `{BASE_URL}{readyPath}` answers (about 90s). Record
`STARTED_BY_THIS_RUN=1`.

## After QA (always)

Stop the server this run started — same port kill as above. Do not leave preview
running unless the user asked to keep it.

## Cockpit / MD credentials (before browser)

If `AUTH` is `cockpit-token` or `md-token` (`GATE=1`): `references/cockpit-auth.md`.
Resolve the tenant profile alias from the approved plan (or `--tenant`) and run
`check-cockpit-token.sh --tenant {alias}` **now**. Do not **open** until it passes.
