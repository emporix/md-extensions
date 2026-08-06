---
paths: package.json, yarn.lock, package-lock.json
---

# npm dependencies

## Published `@emporix/*` packages

When a package is published to the **npm registry** (e.g. `@emporix/api-calls`, `@emporix/component-library`), declare it with a **semver version** in `package.json`:

```json
"dependencies": {
  "@emporix/api-calls": "0.1.6"
}
```

## Do not use git URLs for published packages

Avoid `git+https://github.com/...` or `git+ssh://...` for packages that are available on npm:

```json
"@emporix/api-calls": "git+https://github.com/emporix/api-calls.git#v0.1.6"
```

Git dependencies cause problems in CI (SSH auth, missing `prepare` builds, slower installs) and are harder for other teams to consume.

## When git URLs are acceptable

- **`frontend-ai-rules`** as a `devDependency` — synced via `postinstall`; use `git+https://github.com/emporix/frontend-ai-rules.git#master` per that repo's README.
- **Unpublished forks or emergency patches** — only until a version is published to npm; then switch back to semver.

## After publishing a new library version

1. Publish the package to npm (`npm publish`).
2. Update the consumer `package.json` to the new semver (exact or caret as team convention).
3. Run `yarn install` / `npm install` and commit the lockfile.
4. Do not leave temporary git pins in `package.json` after publish.

## Lockfile

- Commit `yarn.lock` or `package-lock.json` with the npm resolution (integrity hash).
- For git `devDependencies`, ensure `resolved` URLs use **HTTPS**, not SSH, so CI can fetch without deploy keys.
