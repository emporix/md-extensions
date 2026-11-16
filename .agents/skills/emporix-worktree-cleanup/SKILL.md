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

- `--path {worktree}` (optional, instead of the key) — remove exactly this
  linked worktree. Merge PR passes the path it listed and the user confirmed.
- `{issue_key}` (required unless `--path`, `--all-merged`, or `--list`) — e.g. `COP-123`;
  becomes `$KEY` for `--key` in step 2.
- `--all-merged` (optional) — every linked worktree whose branch is an ancestor
  of `origin/$BASE_BRANCH`.
- `--force` (optional) — allow a dirty tree (ask first unless they already said
  force).
- `--delete-branch` (optional) — delete the local branch after remove, only
  when it is merged into the default branch.
- `--merged-head {sha}` (optional) — the PR head GitHub merged (Merge PR
  passes it). A worktree whose HEAD is exactly that commit counts as pushed,
  even after a squash merge deleted the remote branch.
- `--not-cwd` (optional) — refuse to remove the worktree the command runs in.
  It compares the shell's working directory, so run the script from the
  session's own folder with `--root` pointing at the primary; never `cd` away
  first. Merge PR passes it; other callers that run from inside the worktree do not.

## Workflow

0. **Agentic setup** — `references/agentic-setup.md`.

1. **Resolve targets.** Product repo always. Each mapped docs checkout that
   exists in this window. Never clone. With `--path`, the target is that one
   worktree only (its repository is `--root`); skip the docs checkouts.

2. **Remove** with the script (execute, do not rewrite):

   ```bash
   RM=$(skill_script emporix-worktree-cleanup remove-worktree.sh)
   sh "$RM" --root "$CHECKOUT" --key "$KEY"
   # or: sh "$RM" --root "$CHECKOUT" --path "$WORKTREE" [--merged-head SHA] [--not-cwd]
   # or: sh "$RM" --root "$CHECKOUT" --all-merged
   # or: sh "$RM" --root "$CHECKOUT" --list
   ```

   Add `--force` / `--delete-branch` / `--merged-head` / `--not-cwd` only when those flags were given.
   Do not invent a second removal method. Before removing, the script copies
   the worktree's gitignored `.ai/` files (run folder, QA and demo evidence)
   into the primary checkout, because `git status` does not see them and
   `git worktree remove` deletes them. A primary file with other content is
   kept; the worktree's copy lands beside it as `{name}.from-{worktree folder}`, or `…-2`, `…-3` when that name is taken by a different copy.
   That covers every untracked `.ai/` file, ignored or not; symlinks are
   skipped (`SKIPPED_LINK=`). It prints one `PRESERVED=` line per copied
   file. A file it cannot list or copy refuses the removal. `--list` also
   prints `DIRTY=` and `UNPUSHED=` per worktree. With `--all-merged`, a
   refused worktree is reported as `SKIP=` and the rest still run.

3. **Report.** `references/report-templates.md`. If the script refused (dirty /
   unpushed / primary), quote that reason — do not invent a workaround.

## Rules

- Never `rm -rf` a checkout. Only `git worktree remove`.
- Never remove a worktree before its `.ai/` files are preserved (the script does it; a failed copy removes nothing).
- Never remove the primary worktree (the script refuses it). When the caller is an agent session that must keep its own folder (Merge PR), it runs the script from that folder with `--root` pointing at the primary and passes `--not-cwd`, which then refuses it; it never `cd`s to the primary first. Callers that deliberately run from inside the worktree they remove (qa-postman, frontend-standards) do not pass it.
- Never `git clean -fdx`. Never delete unpushed work without `--force`.
- Do not delete the remote branch. Do not merge.
- Do not call `acli` or Jira REST.
