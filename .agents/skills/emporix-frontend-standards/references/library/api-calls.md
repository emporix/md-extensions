# Playbook: @emporix/api-calls

Repository `emporix/api-calls`, default branch from `origin/HEAD`. Framework-
agnostic axios calls for the Emporix REST API. New calls are exported from
the `./next` entry point (`@emporix/api-calls/next`, version 1.6.0 and
later). The package root is the deprecated 1.x API: it is frozen, and 2.0
removes it.

The library's own instructions are the authority for this change, and they
win where this playbook differs:

- [`CONTRIBUTING.md`](https://github.com/emporix/api-calls/blob/master/CONTRIBUTING.md):
  where code goes, the frozen root, call names and signatures, types, tests,
  and what a pull request needs.
- [`AGENTS.md`](https://github.com/emporix/api-calls/blob/master/AGENTS.md):
  commands, the validation gate, tests, and the layout.

Read both from the default branch
(`gh api "repos/emporix/api-calls/contents/CONTRIBUTING.md" -H "Accept: application/vnd.github.raw"`)
or in the worktree from step 4, not in a primary checkout that may be on an
older branch.

## Interview (step 2)

1. Should the endpoint be added to `@emporix/api-calls` (`./next`,
   recommended), or written as a custom call under `src/api/` in this
   project?
2. Library checkout location (`workflow.md` step 2).
3. Endpoint shape: HTTP method, path, the service that owns it, path ids,
   query parameters and body, response type, whether the list is paged
   (`X-Total-Count`), and the call name. Take them from the Emporix API
   reference (developer.emporix.io) and propose them; do not guess. The name
   and the parameter order follow `CONTRIBUTING.md` § Writing a `./next`
   call. Logic that needs several requests or carries a dashboard rule is a
   `./platform` operation instead (`CONTRIBUTING.md` § Operations in
   `./platform`).

## Implement (step 5)

Apply the conventions summary from step 3, built from `CONTRIBUTING.md` and
`AGENTS.md`. In short:

- The call goes in `src/services/<service>/<service>.calls.ts`, its types in
  `<service>.types.ts`, and its tests next to it in `<service>.calls.test.ts`.
  A new service (backend URL prefix) gets its own folder with an `index.ts`
  and an `export *` line in `src/next/index.ts`, the `./next` entry point.
- The root API is frozen. Add no calls, models, or exports to the root:
  `src/index.ts`, `src/calls/`, `src/models/`, `src/types/`, and the other
  folders that `CONTRIBUTING.md` § The root API is frozen lists.
- Naming, parameters, tenant handling, lists and pagination, types, JSDoc,
  errors, the `everyCall` test table, and the committed API reports follow
  `CONTRIBUTING.md`.

Checks: the library's validation gate, `validation.commands` in its
`ai-setup.json` (`AGENTS.md` § Validation gate shows the same list). Print
it, then run every command in that order from the worktree root:

```bash
jq -r '.validation.commands[]' ai-setup.json
```

No list → stop and ask the user.

## Consuming project (step 7)

Import the new call from `@emporix/api-calls/next` (an operation from
`@emporix/api-calls/platform`), never from the package root.

## Release notes

`CHANGELOG.md` is updated for each release: follow the library's
`.cursor/skills/update-changelog/SKILL.md`. A new exported function is a
minor version bump. Feature commits leave `version` and `CHANGELOG.md`
alone; the release metadata (`package.json`, `package-lock.json`,
`CHANGELOG.md`) is one `{KEY} Release {version}` commit in the change's own
PR, as in the library's history. The publish workflow runs on a pushed `v*`
tag that matches `package.json` exactly; the tag goes on the merge commit.
