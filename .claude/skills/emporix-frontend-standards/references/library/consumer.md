# Consuming project (step 7)

cwd = `PRODUCT_ROOT`. Follow the `npm-dependencies` rule of
`emporix-frontend-standards`.

## Before a release exists

- To develop against the unreleased change, temporarily point the dependency
  at the library worktree (`"<package>": "file:<relative path>"`) and install.
- Never commit that `file:` / `link:` entry or the lockfile it produced.
- Tell the user the project change is blocked on the library release, and
  leave the project change uncommitted.

## After the release

1. Set the dependency to the released semver in `package.json` (keep the
   project's exact-vs-caret style).
2. Install from the registry to refresh the lockfile. Confirm the lockfile has
   no `"link": true` entry for the package.
3. Replace the custom call or local component with the library export,
   imported from the package root. Delete the local copy when nothing else
   uses it.
4. Run the project's checks (lint, typecheck, tests, build from `AGENTS.md`).
5. Leave the project change for the calling flow (`emporix-feature`) or the
   user to commit.
