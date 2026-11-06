# Playbook: @emporix/api-calls

Repository `emporix/api-calls`, default branch from `origin/HEAD`. Framework-
agnostic axios helpers for the Emporix REST API; consumers import only from
the package root.

## Interview (step 2)

1. Should the endpoint be added to `@emporix/api-calls` (recommended), or
   written as a custom call under `src/api/` in this project?
2. Library checkout location (`workflow.md` step 2).
3. Endpoint shape: HTTP method, path, service, request parameters and body,
   response type, pagination or `x-total-count` handling, and the function
   name. Take them from the Emporix API reference
   (developer.emporix.io) and propose them; do not guess.

## Implement (step 5)

Apply the conventions summary from step 3. The library usually expects:

- The function in the service module under `src/calls/` that owns the
  endpoint; a new module only when no service module fits.
- Requests through the shared client (`getApiClient()`), typed responses, and
  the shared pagination / filter helpers when the endpoint pages or filters.
- New or extended types under `src/models/`.
- The function and new public types exported from `src/index.ts`.
- Tests under `tests/calls/` for the service.

Checks:

```bash
npm run lint && npm run typecheck && npm test && npm run build && npm run pack:verify
```

## Release notes

`CHANGELOG.md` is updated for each release (the repository has an
`update-changelog` skill — follow it). A new exported function is a minor
version bump. The release metadata (`package.json`, `package-lock.json`,
`CHANGELOG.md`) is one `{KEY} Release {version}` commit in the change's own
PR, as in the library's history. The publish workflow runs on a pushed `v*`
tag that matches `package.json` exactly; the tag goes on the merge commit.
