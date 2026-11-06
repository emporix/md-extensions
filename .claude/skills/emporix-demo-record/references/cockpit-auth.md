# Cockpit auth (same contract as `emporix-qa-ui`)

The Token field is `localStorage.token`. `apiClient` sends
`Authorization: Bearer ${token}`. Fill the **raw Emporix API access token**.
A rewritten JWT character, a second `Bearer`, a control character, or an Ory
session JWT 401s every API call even when the dashboard renders after Save.

If `emporix-qa-ui` `references/cockpit-auth.md` is installed, follow that file
plus the demo extras below. This page is enough when QA UI is not installed.

## When this applies

Treat as a token gate when `app.auth` is `cockpit-token` or `md-token`,
`AGENTS.md` says that, `detect-ui-auth.sh` prints `GATE=1`, or the
start path / repo name contains `cockpit` **and is not** Management
Dashboard. MD uses `serve:local-qa` and the same Tenant/Token fill script;
do not boot default `serve` or an Ory login.

## Before `open`

Credentials come from a **tenant profile** in `~/.emporix/tenants.json`
(shared with `/emporix-qa-ui` and the MD-extension skill; manage with
`skill_script emporix-setup tenants.sh`). The user names the alias
(`--tenant`, or ask once from `tenants.sh list`). The file holds no token:
the scripts mint a fresh one per run from the profile's `clientId` /
`clientSecret`. No environment variables, no `.env` files, no JWT in chat or
in a `--token` flag (the model will rewrite a payload character). The token
carries the API client's scopes — a 401 is a scope or tenant problem, see
`emporix-qa-ui` `references/cockpit-auth.md`.

```bash
CHECK=$(skill_script emporix-qa-ui check-cockpit-token.sh)
bash "$CHECK" --tenant "$TENANT_ALIAS"
# optional: bash "$CHECK" --tenant "$TENANT_ALIAS" --probe "https://api.emporix.io/…"
```

Need `TOKEN_PAYLOAD=valid_json` and `CONTROL_CHARS=0`. Invalid → **stop**. Do
not edit the JWT. Probe **401/403** → **stop**; do not dry-run or record.

## After `open` (never on camera)

Clear cookies + local/session storage and reload (same as QA UI). Then fill
**only** through the wrapper — JWT must not appear in the tool-call text:

```bash
FILL=$(skill_script emporix-qa-ui fill-cockpit-gate.sh)
bash "$FILL" \
  --browser "$BROWSER_COMMAND" \
  --session "$BROWSER_SESSION" \
  --tenant-ref "$TENANT_REF" \
  --token-ref "$TOKEN_REF" \
  --language-ref "$LANG_REF" \
  --save-ref "$SAVE_REF" \
  --tenant "$TENANT_ALIAS"
```

The script mints and fills the raw access token. Never add `Bearer` in the field.

Then snapshot. A rendered dashboard is **not** proof. 401 on lists → **stop**.
Do not record. Do not retry the same token.

## Demo extras

- Fill the gate **only** before recording (`fill-cockpit-gate.sh`). Never
  fill the visible Token field while the camera is running.
- Pin agent-browser **0.38.2**. That `record start` keeps the current tab
  (MD `localStorage.accessToken` and cockpit `localStorage.token`). v0.34
  created a new context and showed the gate; do not work around it with
  restore + reload (the WebM encoder dies).
- After `record start`, snapshot. Gate on camera → stop, check the CLI
  version, delete the take. Do not continue.
- Never keep a take whose decoded frames are still the gate.
- Start the dry-run on the hydrated **module** page after a successful API
  load, then reset to the start URL in the **same** session before recording.
- Do not persist the token in the product repo. `~/.emporix/tenants.json` is
  the store. Only the profile alias may appear in `scenario.md` or `report.md`.
