# Run Newman against the local API

Artifacts: `{QA_DIR}/local-api/{RUN_ID}/` (default `.ai/qa/local-api/{RUN_ID}`).
`RUN_ID` = `local-api-{YYYYMMDD}-{HHMMSS}` or the issue key.

Newman cwd is the **postman-collections** root. Generated env stays in the
product repo. Do not copy the env into the artifacts dir.

## Stage evidence files

```bash
cp "$POSTMAN_ROOT/{dir}/{collection}.postman_collection.json" \
  "$ARTIFACTS_DIR/{collection}.postman_collection.json"
```

Use the basename as-is when it matches `[A-Za-z0-9._-]`. Do not copy
`*.postman_environment.json`.

## Prepare env (local api-url)

```bash
export API_URL="$BASE_URL"
# plus TENANT / CLIENT_ID / CLIENT_SECRET (and storefront if required)
# do not export EMPORIX_QA_API_URL into this process if it would win
unset EMPORIX_QA_API_URL
PREPARE=$(skill_script emporix-qa-postman prepare-env.sh)
sh "$PREPARE" \
  --template "$POSTMAN_ROOT/{dir}/{template}.postman_environment.json" \
  --out "$QA_DIR/local-api/{dir}.postman_environment.json"
```

## Newman

```bash
RUN=$(skill_script emporix-qa-postman run-newman.sh)
sh "$RUN" \
  --root "$POSTMAN_ROOT" \
  --collection "$POSTMAN_ROOT/{dir}/{collection}.postman_collection.json" \
  --env "$QA_DIR/local-api/{dir}.postman_environment.json" \
  --report "$ARTIFACTS_DIR/newman-report.html" \
  --folder "{optional folder name}"
```

`--folder` after a focused change. Whole collection only when the user asked.

Do not run `tests.sh` or `replace.js`. Do not pass
`--reporter-htmlextra-showEnvironmentData`.

## Verdict

- Exit 0 → `QA: PASS`
- Non-zero → `QA: FAIL` — quote failing **request names**, not bodies
- First request connection refused / oauth 404 on localhost → FAIL and explain
  boot / gateway; do not rerun against stage
