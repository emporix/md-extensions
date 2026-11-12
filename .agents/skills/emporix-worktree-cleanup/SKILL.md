---
name: emporix-worktree-cleanup
description: >-
  Remove the linked git worktree created for a Jira key in the product repo
  and in mapped docs checkouts. Use after the PR is merged, when abandoning a
  ticket checkout, or when the user asks to clean up a worktree / working
  tree. Formerly /emporix-cleanup-worktree.
---

# Emporix Worktree Cleanup

Remove **linked** worktrees named `{basename}-{KEY}` (and the matching branch
checkout). Does not merge. Does not close Jira. Does not delete the primary
checkout.

## Arguments

- `{issue_key}` (required unless `--all-merged` or `--list`) — e.g. `COP-123`;
  becomes `$KEY` for `--key` in step 2.
- `--all-merged` (optional) — every linked worktree whose branch is an ancestor
  of `origin/$BASE_BRANCH`.
- `--force` (optional) — allow a dirty tree (ask first unless they already said
  force).
- `--delete-branch` (optional) — delete the local branch after remove, only
  when it is merged into the default branch.

## Workflow

0. **Agentic setup** — `references/agentic-setup.md`.

1. **Resolve targets.** Product repo always. Each mapped docs checkout that
   exists in this window. Never clone.

2. **Remove** with the script (execute, do not rewrite):

   ```bash
   RM=$(skill_script emporix-worktree-cleanup remove-worktree.sh)
   sh "$RM" --root "$CHECKOUT" --key "$KEY"
   # or: sh "$RM" --root "$CHECKOUT" --all-merged
   # or: sh "$RM" --root "$CHECKOUT" --list
   ```

   Add `--force` / `--delete-branch` only when those flags were given.
   Do not invent a second removal method.

3. **Report.** `references/report-templates.md`. If the script refused (dirty /
   unpushed / primary), quote that reason — do not invent a workaround.

## Rules

- Never `rm -rf` a checkout. Only `git worktree remove`.
- Never remove the primary worktree.
- Never `git clean -fdx`. Never delete unpushed work without `--force`.
- Do not delete the remote branch. Do not merge.
- Do not call `acli` or Jira REST.
