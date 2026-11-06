# Credentials

Same client/tenant secrets as `emporix-qa-postman` `references/credentials.md`.
**`api-url` is the local origin** in both skills.

| Postman key | Source |
|---|---|
| `api-url` | `--base-url` or `app.baseUrl` only |
| `tenant` | `--tenant`, `EMPORIX_QA_TENANT`, `TENANT` |
| `client_id` | `--client-id`, `EMPORIX_QA_CLIENT_ID`, `CLIENT_ID` |
| `client_secret` | `--client-secret`, `EMPORIX_QA_CLIENT_SECRET`, `CLIENT_SECRET` |
| storefront pair | same names as `emporix-qa-postman` when the template has those keys |

For `prepare-env.sh`, export `API_URL` set to that local origin and unset
`EMPORIX_QA_API_URL`. The script prefers `EMPORIX_QA_API_URL`, so a leftover
remote value would point Newman at stage.

**Hard stop** if tenant, client id, or client secret is missing. Do not guess.

Never write secrets to config, `report.md`, chat, git, or Jira. The generated
env under `{QA_DIR}/local-api/` stays local and is **not** attached.
