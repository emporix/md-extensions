# Run Newman

Two runs, both against the local origin. Paths are absolute. `$PREPARE` and
`$RUN` are the absolute helpers from the product checkout (`SKILL.md`). Do
not look them up again.

- Regression `--root` is the primary Postman checkout.
- Draft `--root` is the worktree, so sibling upload files resolve next to the draft.

`$QA_DIR` is the absolute product path from `SKILL.md`. Do not rebuild it
after `cd` to the worktree.

Generated env: `{QA_DIR}/postman/env/{dir}.postman_environment.json`.
Develop collection and its environment template (not published):
`{QA_DIR}/postman/regression/`.
Publishable artifacts: `{QA_DIR}/postman/{KEY}/`.

## Fresh evidence

Once, at the start of the run, delete the previous publish directory and
recreate it. A later regression failure must not upload a draft collection
or a draft HTML report left by an earlier pass.

```bash
rm -rf "$QA_DIR/postman/$KEY"
mkdir -p "$QA_DIR/postman/env" "$QA_DIR/postman/$KEY" "$QA_DIR/postman/regression"
```

Keep the generated env file. Do not delete `$QA_DIR/postman/env/`.

## Host and env

Materialize the environment template from the same `origin/develop` revision
as the regression collection. The primary working tree is not that revision.

```bash
git -C "$POSTMAN_PRIMARY" fetch origin develop
git -C "$POSTMAN_PRIMARY" show "origin/develop:{dir}/{template}.postman_environment.json" \
  > "$QA_DIR/postman/regression/{template}.postman_environment.json"
export API_URL="$BASE_URL"
unset EMPORIX_QA_API_URL
sh "$PREPARE" \
  --template "$QA_DIR/postman/regression/{template}.postman_environment.json" \
  --out "$QA_DIR/postman/env/{dir}.postman_environment.json"
```

`git show` fails because the template is not on `develop` → this is a first
collection. Do not prepare yet. After `references/draft.md` writes the empty
template in the worktree, run `$PREPARE` with that worktree file as
`--template`.

`BASE_URL` is `--base-url` or `app.baseUrl`. Read `ENV_FILE=` from stdout.
Do not print the file. A non-zero `$PREPARE` on an existing template → stop.

Export `TENANT`, `CLIENT_ID`, `CLIENT_SECRET`, and the storefront pair when
the template has those keys (`references/credentials.md`).

## 1. Regression (existing folders)

Fetch already ran in **Host and env**. Write the develop collection
**outside** the publish directory:

```bash
git -C "$POSTMAN_PRIMARY" show "origin/develop:{dir}/{collection}" \
  > "$QA_DIR/postman/regression/{collection}"
```

`git show` fails because no supported collection is on `develop` →
`Regression: none`. Continue to the draft. Do not fail the run.

Choose folders from that file:

- `--all` → one Newman run with no `--folder`.
- Otherwise, each top-level folder whose requests already call a path the
  product diff changes. Match on the path, not the host. `--folder` on this
  skill is the **new** scenario. Do not pass it here.

No folder calls those paths → `Regression: none`. Continue to the draft.

One Newman run per matched folder:

```bash
sh "$RUN" \
  --root "$POSTMAN_PRIMARY" \
  --collection "$QA_DIR/postman/regression/{collection}" \
  --env "$QA_DIR/postman/env/{dir}.postman_environment.json" \
  --report "$QA_DIR/postman/$KEY/newman-regression.html" \
  --folder "{existing folder name}"
```

Omit `--folder` only for `--all`. Several folders → several runs. A later
run must use its own report name (`newman-regression-{folder}.html`, spaces
in the folder name replaced with `-`) so the HTML files do not overwrite
each other.

Every selected run must exit 0. Non-zero → `QA: FAIL`, `Stage: regression`.
Quote failing request names, not response bodies. Do not draft. Do not
re-run against stage.

Connection refused or an OAuth 404 on localhost → FAIL. The local process
must serve those URLs. Do not point Newman at stage.

## 2. Draft (worktree collection)

After `references/draft.md`. `--root` is the worktree so sibling upload files
resolve next to the draft. The script installs Newman there when
`node_modules/newman` is missing.

```bash
sh "$RUN" \
  --root "$WORKTREE" \
  --collection "$WORKTREE/{dir}/{collection}" \
  --env "$QA_DIR/postman/env/{dir}.postman_environment.json" \
  --report "$QA_DIR/postman/$KEY/newman-draft.html" \
  --folder "{scenario folder}"
```

`--folder` is required for the draft so the run stays on the new scenario.
Exit 0 → pull request. Non-zero → classify (`references/draft.md`), then
either one fix and one re-run, or FAIL with `Stage: draft`.

Copy the draft collection into `$QA_DIR/postman/$KEY/` under its basename
before publish, so the evidence upload has the file. Do not copy the env.

## Verdict

A skipped folder is not a pass. “Collection ran” with failed assertions is
not a pass. Need host network (Cursor Shell `required_permissions: ["all"]`).
