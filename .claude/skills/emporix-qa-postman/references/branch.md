# Branch and worktree

The Postman pull request base is `develop`. Confirm
`origin/HEAD` of `postman-collections` is `develop`. If it is not, stop and
ask. Do not target `master`.

Branch name: `{KEY}-api-tests` (example `COP-123-api-tests`).

## Worktree

Always use a linked worktree so the primary checkout stays on its current
branch. Do not `git checkout` in the primary folder.

Use the absolute `$ENSURE` from the product checkout (`SKILL.md`). Do not
look the script up from the Postman directory.

```bash
sh "$ENSURE" --root "$POSTMAN_PRIMARY" --branch "{KEY}-api-tests" --base develop --key "$KEY"
```

Read `WORKTREE=` / `PRIMARY=` / `BRANCH=` / `CREATED=`. Every collection edit
and every git command for this skill uses cwd = `$WORKTREE`.

`BRANCH` must be `{KEY}-api-tests`. Any other name → stop. Do not edit that
folder and do not check out a different branch there.

`WORKTREE` and `PRIMARY` must be different directories. Canonicalize both
(`git rev-parse --show-toplevel` in each) before comparing. The helper
returns the primary checkout when `{KEY}-api-tests` is already checked out
there. That folder is not a linked worktree. Stop, and tell the user the
branch is in the primary checkout. Do not edit it. Do not `git checkout`
another branch there to free it.

The script reuses an existing worktree for this key. A later run continues
there. `CREATED=0` with a dirty tree on `{KEY}-api-tests` is the previous
draft — keep it and update it. Unrelated dirty files in that worktree → stop
and ask.

## After the pull request is merged

Remove the linked worktree. `emporix-worktree-cleanup` targets the product
repo and docs checkouts, so pass the Postman root explicitly:

Use the absolute `$RM` from the product checkout (`SKILL.md`).

```bash
sh "$RM" --root "$POSTMAN_PRIMARY" --key "$KEY"
```

Do this only when the user asks, or after they say the pull request is merged.
