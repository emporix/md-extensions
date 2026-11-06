# Token gate (tenant profile → Tenant + Token + Language)

Emporix **cockpit templates** and **Management Dashboard `serve:local-qa`**
show **Tenant**, **Token**, and **Language** before any module UI. The values
come from one **tenant profile** in `~/.emporix/tenants.json`; the user names
the alias, the scripts do the rest. No environment variables, no `.env`
files, no token in chat.

This is the same form and the same fill script. It is **not** the same app:

| App | How you know | QA start | Do not |
|---|---|---|---|
| Cockpit template | `app.auth` is `cockpit-token`, or repo/start contains `cockpit` | `app.start` (usually a module `preview`) | Treat MD as a cockpit |
| Management Dashboard | `AUTH=md-token` from `detect-ui-auth.sh`, repo `management-dashboard`, or `serve:local-qa` | `npm run serve:local-qa` / `yarn serve:local-qa` | Use default `serve` (Ory). Do not wait for Ory Sign in. Do not inject cookies. |

`detect-ui-auth.sh` prints `AUTH` / `GATE` / `START` (`boot.md`). MD always
wins over a missing or `cockpit-token` config — it is not a cockpit template.

On cockpits the Token field is stored in `localStorage.token`; on MD local-qa
Save stores `localStorage.accessToken`. `apiClient` sends
`Authorization: Bearer ${token}`, so the field must be the **raw Emporix API
access token**. A second `Bearer`, a rewritten JWT character, a control
character, or an Ory session JWT 401s every API call even when the dashboard
renders after Save.

## When this applies

`GATE=1` when any of these is true:

- `detect-ui-auth.sh` prints `AUTH=md-token` or `AUTH=cockpit-token`
- `app.auth` is `cockpit-token` or `md-token`
- `AGENTS.md` App section says `Auth: cockpit-token` or `Auth: md-token`
- repo / package is `management-dashboard` (or package `md` with `serve:local-qa`)
- `app.start`, the repo name, or the default UI path contains `cockpit` **and** it is not Management Dashboard

Other auth flavors (storefront login, hosted Ory MD, docs, none) are separate
cases. Do not invent a login form they do not have.

## Tenant profiles

`~/.emporix/tenants.json` (mode 600, override the path with
`EMPORIX_TENANTS_FILE`) is shared with the `emporix-md-extension` skill. It
**never stores a token**. Each alias holds `tenant`, `apiUrl`, `clientId`,
`clientSecret` (optional `scopes`): everything needed to **mint** a fresh
access token per run via `POST /oauth/token`. Optional `language`,
`description`, file-level `default`.

```bash
TENANTS=$(skill_script emporix-setup tenants.sh)
bash "$TENANTS" list            # aliases, tenant, API URL, auth kind — never secrets
bash "$TENANTS" init            # first time: template + open in editor
bash "$TENANTS" check <alias>   # mint a token from the API client and sanity-check it
```

### Which alias

1. `--tenant <alias>` on the command line, or the alias in the approved QA plan (**Tenant profile**).
2. Else exactly one profile, or the file's `default` → use it, say which.
3. Else ask once in `explore` with the aliases from `list` (tenant + API URL as labels). `INCOMPLETE` rows are not offered; point at `tenants.sh open`.
4. File missing → run `tenants.sh init`, tell the user what to fill in, **end the turn**. Continue when they confirm.

The alias goes into the QA plan. The tenant name and the token never go into
the plan, the report, screenshots, Jira, `ai-setup.json`, or the product repo.

### What the token can do

The minted token carries exactly the **scopes of the profile's API client**.
Cockpit modules and MD local-qa work with it when the client has the scopes
the flow calls. A `401`/`403` right after Save is a scope or tenant problem,
not a UI bug — stop, report the failing endpoint, and let the user extend the
API client (or name a profile whose client has the scopes). Never ask for a
token to paste.

## Before `open` — check the token (never printed)

After the scenario is approved and `BASE_URL` answers. You may run
`qa-browser.sh ensure` first. You may **not** `open`, snapshot, or screenshot
until this passes.

```bash
CHECK=$(skill_script emporix-qa-ui check-cockpit-token.sh)
bash "$CHECK" --tenant "$TENANT_ALIAS"
# optional: bash "$CHECK" --tenant "$TENANT_ALIAS" --probe "https://api.emporix.io/…"
```

Need `TOKEN_PAYLOAD=valid_json` and `CONTROL_CHARS=0`. Anything else, or a
`PROBE_HTTP` of 401/403 → **hard stop**: report the script's message, do not
drive the UI, do not edit the token, do not retry the same profile. Fixes are
in the profile (`tenants.sh open`), never in chat.

## Fill the gate (after `open` + cache clear + first `snapshot`)

Use only refs from that snapshot. Typical labels: Tenant / Token / Language / Save.

**One command** — the JWT must not appear in the tool-call text:

```bash
FILL=$(skill_script emporix-qa-ui fill-cockpit-gate.sh)
bash "$FILL" \
  --browser "$AGENT_BROWSER_BIN" \
  --session "$BROWSER_SESSION" \
  --tenant-ref "$TENANT_REF" \
  --token-ref "$TOKEN_REF" \
  --language-ref "$LANG_REF" \
  --save-ref "$SAVE_REF" \
  --tenant "$TENANT_ALIAS" \
  --language "$LANGUAGE"
```

The script resolves the profile, mints the token, never adds `Bearer`, and
never logs the value. Do not call `agent-browser fill` with a token.

If the snapshot has no Tenant/Token/Save refs, follow `references/ask-executor.md`.

Then **snapshot** again.

- Dashboard / module chrome after Save is **not** proof the token works.
  Watch a real API call. 401 on lists → **stop** (API client lacks the
  scope, or wrong tenant). Do not retry the same value.
- If the same three gate fields are still the only UI, tenant/token was
  rejected — **stop**. Do not invent values.
- After Save, do not screenshot a page that still shows the token field filled in.
