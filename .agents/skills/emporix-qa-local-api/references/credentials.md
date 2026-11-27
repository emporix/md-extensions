# Credentials

Same client/tenant secrets as `emporix-qa-postman` `references/credentials.md`.
**`api-url` is the local origin** in both skills (the gateway origin when a
local stack is used, `references/boot.md` § Local stack).

**Preferred: a tenant profile.** `--tenant <alias>` names a `client-credentials`
profile in `~/.emporix/tenants.json` (`emporix-setup` `tenants.sh`). Pass it to
`prepare-env.sh --tenant <alias>`: tenant, client id, client secret, and the
storefront pair (`storefrontClientId`, `storefrontClientSecret`) come from the
profile; `keychain:` references are resolved, so macOS may ask to allow the
read. Nothing secret is typed in chat or passed as an argument.

| Postman key | Source (first wins) |
|---|---|
| `api-url` | `--base-url` or `app.baseUrl` only (exported as `API_URL`) |
| `tenant` | `--tenant` when it is not a profile alias, `EMPORIX_QA_TENANT`, `TENANT`, the profile |
| `client_id` | `--client-id`, `EMPORIX_QA_CLIENT_ID`, `CLIENT_ID`, the profile |
| `client_secret` | `--client-secret`, `EMPORIX_QA_CLIENT_SECRET`, `CLIENT_SECRET`, the profile |
| storefront pair | same names as `emporix-qa-postman`, then the profile, when the template has those keys |

The `EMPORIX_QA_*` variables keep working when no profile is named. With a
profile, unset leftovers: a set variable wins over the profile for its key.

For `prepare-env.sh`, export `API_URL` set to that local origin and unset
`EMPORIX_QA_API_URL`. The script prefers `EMPORIX_QA_API_URL`, so a leftover
remote value would point Newman at stage.

**Hard stop** if tenant, client id, or client secret is missing. Do not guess.

Never write secrets to config, `report.md`, chat, git, or Jira. The generated
env under `{QA_DIR}/local-api/` stays local and is **not** attached.
