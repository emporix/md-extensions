# Dispatch

Read this only after the author approves the plan. For each approved row, read
that one playbook and follow it. Do not read the other playbooks in the same
turn. Do not write pages yourself.

Pass each playbook: the approved plan, the context brief, the exact target paths,
the resolved docs root, `$STANDARDS_ROOT` (this skill's `references/docs-standards`),
screenshot figure markup (or none), and validated branded Mermaid (or none).

## Order

1. **Branch.** Follow `references/ship.md` (branch only). For each docs repo the
   plan will edit, create or reuse the same branch name as the product change
   in a linked worktree (`{docs-basename}-{KEY}`). Base = that docs repo's
   default branch. Do not `git checkout` in the primary docs folder. Unrelated
   dirty files in that worktree → stop and ask. Do not stash.

2. **Screenshots**, only if the plan lists shots. Read `references/screenshots.md`.
   Ask for **original PNG paths or drops** (Desktop `Screenshot*.png`, `@` file,
   workspace drop), not chat paste (chat stores ~1024px previews). Copy each to
   `.cursor/emporix-docs-inbox/<shot-id>-raw.png`, run `--info`, and stop for the
   original when the longer side is ≤1024. Frame with the polish script (default:
   no `--max-width` downscale); for redaction or call-outs use script `--blur` /
   `--highlight` with `--highlight-pad`, never hand-rolled. `--check` every output.
   `check: fail` → do not embed. The author may reply **Skip**. Never capture the
   Cursor browser.

3. **Diagrams**, only if the plan lists any. Read `references/playbooks/diagrams.md`
   for each one. Missing file → stop for that diagram. Do not hand-write Mermaid.

4. **Page flavors**, one at a time. Do not run two playbooks on the same checkout
   at once. Order: `references/playbooks/api-references.md`,
   `references/playbooks/tutorials.md`,
   `references/playbooks/user-guides.md`. Skip flavors the plan skipped.

5. **Announcements**, after the page flavors, so they can link to those pages.
   `references/playbooks/changelog.md`, then `references/playbooks/release-notes.md`.
   Release notes are never written by the user-guides playbook.

6. **Style review.** Each authoring playbook follows `references/playbooks/style-review.md`.
   If a verdict is `blocked` or has any `critical` / `major`, re-run that playbook
   with the report until `pass` or `pass-with-warnings` (minor only).

7. **API preview**, only when the plan includes it and the author asked. Read
   `references/playbooks/api-preview.md`. Do not merge the GitBook change request
   unless they asked.

8. **Author review.** Show paths created or updated. Unless `--ship` (or they
   already said ship), stop. **Change X** → re-run that playbook, re-review,
   stop again. **Ship** → `references/ship.md`. **Cancel** → leave the docs
   branch as-is.

9. **Ship.** Follow `references/ship.md`. One GitHub PR per docs repo that has
   a diff. Then `references/report-templates.md`.
