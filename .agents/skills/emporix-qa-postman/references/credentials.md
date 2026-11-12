# Credentials

Required to **run** Newman.

## Host

Newman `api-url` is the local origin (`--base-url` or `app.baseUrl`). Do not
take it from `EMPORIX_QA_API_URL` or `API_URL`. Those name the remote platform.
`references/run.md` exports `API_URL="$BASE_URL"` for `prepare-env.sh` only.

## Values (first wins)

| Postman key | CLI | Env names |
|---|---|---|
| `tenant` | `--tenant` | `EMPORIX_QA_TENANT`, `TENANT` |
| `client_id` | `--client-id` | `EMPORIX_QA_CLIENT_ID`, `CLIENT_ID` |
| `client_secret` | `--client-secret` | `EMPORIX_QA_CLIENT_SECRET`, `CLIENT_SECRET` |
| `client_id_storefront` | `--client-id-storefront` | `EMPORIX_QA_CLIENT_ID_STOREFRONT`, `CLIENT_ID_STOREFRONT` |
| `client_secret_storefront` | `--client-secret-storefront` | `EMPORIX_QA_CLIENT_SECRET_STOREFRONT`, `CLIENT_SECRET_STOREFRONT`, `CLIENT_ID_SECRET` |

`prepare-env.sh` prefers `EMPORIX_QA_API_URL` over `API_URL`. The run step
unsets `EMPORIX_QA_API_URL` and sets `API_URL` to the local origin so the
generated file does not point at stage.

Storefront pair is **required** when the environment template already has
`client_id_storefront` or `client_secret_storefront` (cart, customer, checkout).
`prepare-env.sh` exits non-zero if those keys exist and the values are empty.

## Hard stop

If any required value is missing, ask in chat. Do not invent a tenant, URL, or
secret. Do not read secrets from committed `*.postman_environment.json` (they
are empty by design). Do not run Newman with an empty env.

The user may paste values in this session. Export them as env vars for the
script only. Do not echo them.

## Never persist secrets

- Do not write them to `ai-setup.json`, `AGENTS.md`, the
  collection, or the QA report.
- Config may store **env var names** and the Postman workspace/folder only.
- The generated env file under `.ai/qa/postman/env/` contains secrets. Do not
  `git add` it. Do not attach it to Jira. Delete it at the end of the run if
  the user wants it gone; otherwise leave it local and gitignored.
