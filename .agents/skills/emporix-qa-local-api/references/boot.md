# Fresh local API every run

`BASE_URL` comes from `--base-url`, else `app.baseUrl`. Origin only
(`http://localhost:8080`). This is the Newman `api-url`.

Do **not** attach to an already-running process. Always recycle.

## Local stack (which services run locally)

Same choice as `emporix-qa-ui` `references/boot.md` § Local stack: list the
candidates with `stack.py candidates --under-test "$PWD"`, ask once
(multi-select, the service under test and running services preselected), and
record the answer as `**Local stack:** none | {service, …}` in this run's
`report.md` header and in the QA plan when one exists. A recorded list is used
again without asking unless the user wants a different set.

- **`none`** → the fresh boot below, unchanged.
- **Services picked** → `python3 "$STACK" status` (keep `STACK_BEFORE`). Database per
  backend as in `emporix-qa-ui` `references/boot.md` § Local stack (`--dry-run` lists
  `database: choose …`; ask local or real, record `**Local DB:**` next to `**Local stack:**`),
  then `python3 "$STACK" up {picked services not running yet} --db {service}={choice} …`; the service under
  test already running → `python3 "$STACK" restart {name}`. Never kill a port.
  Newman `api-url` = the gateway origin from `status`
  (`http://127.0.0.1:8790`), so collection paths keep their gateway base path
  and the gateway injects the headers Apigee would. Skip **Stop whatever is on
  that port** and **Start**.
- **After QA** → `python3 "$STACK" remove {name}` for each service this run
  added, unless the user asked to keep the stack.

## Stop whatever is on that port (fresh boot only)

Parse the port from `BASE_URL`. Then:

```bash
PIDS=$(lsof -ti tcp:"$PORT" -sTCP:LISTEN 2>/dev/null || true)
if [ -n "$PIDS" ]; then
  echo "Stopping listeners on $PORT: $PIDS"
  kill $PIDS 2>/dev/null || true
  sleep 1
  kill -9 $PIDS 2>/dev/null || true
fi
```

## Start

`app.start` is required. Run **exactly** that command in the background from
implement’s `Worktree:` when that line exists; otherwise this checkout (ticket
branch — not `$BASE_BRANCH` with no change). Wait until
`{BASE_URL}{readyPath}` answers (about 90s). `readyPath` is `app.readyPath`
(often `/health` or `/actuator/health`; default `/`).
Record `STARTED_BY_THIS_RUN=1`.

Empty `app.start` / `baseUrl` → **stop** and ask. Do not invent a port or
command.

Need host network (Cursor Shell `required_permissions: ["all"]`).

## After QA (always)

Fresh boot: stop the server this run started — same port kill. Local stack:
`remove` only what this run added (§ Local stack). Do not leave it running
unless the user asked to keep it. Stop even when Newman or publish failed.
