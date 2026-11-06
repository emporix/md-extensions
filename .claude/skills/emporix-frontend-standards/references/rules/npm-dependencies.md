---
name: npm-dependencies
description: Use npm registry versions for published Emporix packages, not git URLs or local file links
paths: ["**/package.json", "**/yarn.lock", "**/package-lock.json"]
always: false
---

# npm dependencies

## Published `@emporix/*` packages

When a package is published to the **npm registry** (e.g. `@emporix/api-calls`, `@emporix/component-library`), declare it with a **semver version** in `package.json`:

```json
"dependencies": {
  "@emporix/api-calls": "0.1.6",
  "@emporix/component-library": "1.13.1"
}
```

## Do not commit `file:` local path dependencies

For **local development only**, you may temporarily link a sibling package:

```json
"@emporix/component-library": "file:../../component-library"
```

**Never commit** `package.json` or lockfile changes that use `file:`, `link:`, or other local filesystem paths for published `@emporix/*` packages. Before committing, restore the published semver, refresh the lockfile, and leave no `file:` / `link:` entries staged.

## Do not use git URLs for published packages

Avoid `git+https://github.com/...` or `git+ssh://...` for packages that are available on npm:

```json
"@emporix/api-calls": "git+https://github.com/emporix/api-calls.git#v0.1.6"
```

Git dependencies cause problems in CI (SSH auth, missing `prepare` builds, slower installs) and are harder for other teams to consume.

## When git URLs are acceptable

- **Unpublished forks or emergency patches** — only until a version is published to npm; then switch back to semver.

## After publishing a new library version

Update the consumer `package.json` to the new semver (exact or caret as team convention), refresh the lockfile from the registry, and commit it. Do not leave temporary `file:` or git pins behind. Adding to `@emporix/api-calls` or `@emporix/component-library` from a consuming project: the library contribution workflow (`$RULES_ROOT/../library/workflow.md`).

## Lockfile

- Commit `yarn.lock` or `package-lock.json` with the npm resolution (integrity hash).
- A `"link": true` entry for an `@emporix/*` package in `package-lock.json` means a local link was installed — reinstall from the registry before committing. This check exits 1 only when such a link exists, so it can gate a commit or CI step:

  ```bash
  links=$(jq -r '(.packages // {}) | to_entries[] | select((.key | startswith("node_modules/@emporix/")) and .value.link == true) | .key' package-lock.json)
  if [ -n "$links" ]; then
    echo "FAIL: local @emporix links in package-lock.json: $links" >&2
    exit 1
  fi
  ```
- Declare git `devDependencies` with `git+https://` in `package.json` (never `git+ssh://`).
- Do not hand-edit lockfile `resolved` from `git+ssh://` to HTTPS. Local git `url.insteadOf` (common with GitHub SSH) rewrites it back on the next install. If CI `npm ci` fails for missing SSH keys, fix git config or CI credentials rather than a one-off lockfile edit.
