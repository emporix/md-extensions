# Fresh local API every run

`BASE_URL` comes from `--base-url`, else `app.baseUrl`. Origin only
(`http://localhost:8080`). This is the Newman `api-url`.

Do **not** attach to an already-running process. Always recycle.

## Stop whatever is on that port

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

Stop the server this run started — same port kill. Do not leave it running
unless the user asked to keep it. Stop even when Newman or publish failed.
