# Collections

The checkout is `emporix/postman-collections`. Each **service directory** holds
a test collection and an environment template.

## Layout

| Kind | Typical files | When to use |
|---|---|---|
| Service tests | `{dir}/*-tests.postman_collection.json` | Default. Product API change. |
| Service env | `{dir}/*.postman_environment.json` | Template for `prepare-env.sh`. Prefer the non-`sdk-`, non-`.develop.` file. |
| SDK tests | `{dir}/sdk-*-tests.postman_collection.json` | Only with `--sdk`. |
| Demo / public | `public/*.postman_collection.json` | Do not edit unless the user asked. |
| CI runners | `tests.sh`, `sdk_tests.sh`, `replace.js` | Do not run from this skill. |

Examples: `cart/cart-service-tests.postman_collection.json` +
`cart/cart.postman_environment.json`. `webhook-service/webhook-service-tests.postman_collection.json`.
Some dirs use `{name}.postman_collection.json` with tests inside (`b2bcheckout`).

## Resolve `{dir}`

First match wins:

1. `--service`
2. `qa.postman.folder` in `ai-setup.json`
3. Project-card / repo name against **top-level directory names** in the checkout
   (do not crawl). `cart-service` → `cart`. `order` → `order`.
4. Ask once if still ambiguous.

List files with `git ls-tree --name-only "origin/develop:{dir}"` after the
fetch. Do not decide from the primary working tree.

`--sdk` and a service run never select the same file.

With `--sdk`, the only candidate is `sdk-*-tests.postman_collection.json`.
No match → create `{dir}/sdk-{dir}-tests.postman_collection.json`. Do not
select a service collection, and do not select a file whose name does not
start with `sdk-`.

Without `--sdk`, ignore every name that starts with `sdk-`. Then:

1. `*-tests.postman_collection.json`
2. Any other `*.postman_collection.json` in that directory (for example
   `b2bcheckout/{name}.postman_collection.json`, which keeps tests inside a
   file that has no `-tests` suffix)

No match → create `{dir}/{dir}-tests.postman_collection.json`. Do not select
an SDK suite, including a directory that contains only `sdk-*-tests`.

One match → that is the suite to extend. Do not create a second file beside
it. Several matches and no `--service` file name → ask once.

No match is a first collection. `emporix-qa-local-api` stops in that case.
`emporix-qa-postman` creates the file in the `{KEY}-api-tests` worktree only:
- Root object is `info` + `item`. Copy `info.schema` from a sibling service
  collection. Start `item` empty, then add the scenario folder.
- Pair it with `{dir}/{dir}.postman_environment.json` copied from a sibling
  template. Clear every secret value. Leave `api-url`, `tenant`, `client_id`,
  and `client_secret` empty.

The service directory is not on `develop` and `--service` was not given →
ask once for the directory name. Do not invent one. Do not create the
directory in the primary checkout.

## Environment template

Use the sibling `*.postman_environment.json`. If both a develop and a default
file exist, use the default unless the user said develop.

Committed templates keep `api-url`, `tenant`, `client_id`, `client_secret`
(and often `client_id_storefront` / `client_secret_storefront`) **empty**.
Leave them empty in git. Runtime values go only in the generated file under
`.ai/qa/postman/env/`.

## Where edits go

Read the develop collection with `git show origin/develop:{path}`. Write the
draft only in the `{KEY}-api-tests` worktree (`references/branch.md`).

## New requests

Copy a sibling request in the same folder (auth, headers, `url` object,
`event` scripts). Schema:
`https://schema.getpostman.com/json/collection/v2.1.0/collection.json`.

URL shape: `{{api-url}}/<service>/{{tenant}}/…` or
`{{api-url}}/{{oauth}}/token`. Do not hard-code a host.
