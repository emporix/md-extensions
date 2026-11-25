# Fresh app every run

Run detection first, then resolve `BASE_URL`, then recycle the port, then
start. Do **not** attach to an already-running preview. Stale Vite/browser
cache caused false 401s. Always recycle the server.

## Local stack (which services run locally)

The user chooses, once per plan, which services besides the app under test run
locally (`emporix-local-stack`); everything else comes from develop.

1. **The plan has `**Local stack:**`** → use it. Do not ask again unless the user
   says they want a different set.
2. **Otherwise** list the candidates and ask once:

   ```bash
   STACK=$(skill_script emporix-local-stack stack.py)
   python3 "$STACK" --workspace "$(dirname "$(git rev-parse --show-toplevel)")" candidates --under-test "$PWD"
   ```

   Each row is `name kind path selected reason`. Offer them as one multi-select
   question (AskUserQuestion with `multiSelect` when there are at most four rows;
   otherwise a numbered list in chat), the `selected = yes` rows preselected (the
   repo under test, services already running, MD when a remote is picked). Write
   the answer into the plan as `**Local stack:**` (`none` when only the app under
   test is wanted).
3. **`none`** → the fresh boot below, unchanged.
4. **Services picked:**
   - `python3 "$STACK" status` and keep the running service names (`STACK_BEFORE`) and
     MD's mode from its KIND column (`md/ory` or `md/gate`, `MD_AUTH_BEFORE`).
   - `MD_AUTH_BEFORE` is `ory` → **before any command below** tell the user that MD
     restarts in QA mode and their open MD tab will need a new sign-in afterwards: the
     first `up … --md-auth gate` switches a running MD, whatever services it names.
   - **Database per backend** — the plan has `**Local DB:**` → use it. Otherwise
     `python3 "$STACK" up {each picked service not running yet} --md-auth gate --dry-run`
     and ask the user, one question per backend that `--dry-run` lists as `database: choose …`:
     **Local database** (your MongoDB on localhost; listed first) or **Real database** (URL from
     the Keychain item `emporix-local-stack.db-url`; say that a local branch then writes to shared
     data, and Spring Data may create indexes at startup). Pass the answers as `--db local|remote`
     (`--db <service>=remote` for one service).
     Write the answers into the plan as `**Local DB:** {service}=local|remote, …` (`none`
     when no backend asks). A backend already running keeps its database; note it in the
     report. Missing URL → the user runs `stack.py set-db-url` in their own terminal.
   - `python3 "$STACK" up {each picked service not running yet} --md-auth gate --db {service}={choice} …`. QA always
     runs MD in `gate` mode (`serve:local-qa`, the Tenant/Token gate); the stack's default
     `ory` mode is for the developer's own testing with an Ory sign-in. Never stop a port,
     never kill a process the stack did not start.
   - Nothing new to start but MD runs as `md/ory` (already told above) →
     `python3 "$STACK" add management-dashboard --md-auth gate`.
   - The app under test already ran in the stack → `python3 "$STACK" restart {name}`
     (fresh app, as below).
   - `BASE_URL` = `http://localhost:4200` when MD runs in the stack (a remote under
     test is opened as its module inside MD; `AUTH=md-token`, `employee-token`
     profile). Otherwise the port `status` shows for the repo under test.
   - Skip **Stop whatever is on that port** and **Start** below; continue with
     **Cockpit / MD credentials**.
   - **After QA:** `python3 "$STACK" remove {name}` for each service this run
     added (not in `STACK_BEFORE`), unless the user asked to keep the stack. When MD stays
     and `MD_AUTH_BEFORE` was `ory`: `python3 "$STACK" add management-dashboard --md-auth ory`.
     Never `down` a stack this run did not start.

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

## Stop whatever is on that port (fresh boot only)

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

Fresh boot: stop the server this run started — same port kill as above. Do not leave preview
running unless the user asked to keep it. Local stack: `remove` only what this run added
(§ Local stack).

## Cockpit / MD credentials (before browser)

If `AUTH` is `cockpit-token` or `md-token` (`GATE=1`): `references/cockpit-auth.md`.
Resolve the tenant profile alias from the approved plan (or `--tenant`) and run
`check-cockpit-token.sh --tenant {alias}` **now**. Do not **open** until it passes.
