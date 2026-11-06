# Stage `update`

Re-enter explore against a plan on disk. New findings stay provisional until the user **applies** or **discards** them. Also the path for `change X` after the draft hard stop.

Runs in plan mode on Claude Code (`references/plan-mode.md` § Enter and § `update`): the `.ai/runs` file is read as the baseline, the revised plan is written to the plan-mode file, and **apply** ends with `ExitPlanMode` — approval re-approves and overwrites the `.ai/runs` file. A rejection with feedback right after a draft is `change X`: already in plan mode, already named — apply it and `ExitPlanMode` again.

## Resolve the plan

1. Explicit path if given and readable.
2. Else `ISSUE_PLAN` from `emporix-setup/references/runs-layout.md` on the primary worktree (no `--title`).
3. Zero matches → ask once (or point at `draft`). Multiple → list paths, ask once.
4. Read the whole file. That file is the **baseline**. Do not create a second plan.

An **approved** plan (`**Status:** approved`) may still be updated, but say so: the Jira comment is now stale and `approve` must run again (a new comment) before `implement` continues.

## Explore with the plan

Same stance as `references/explore.md`: think, read code, diagram — **no product-code writes**.

- Treat baseline todos / approach as current intent, not gospel — challenge with new evidence
- Keep a running **delta list** in the conversation only (until apply):

  | Kind | Example |
  |---|---|
  | add todo | new id + content |
  | edit todo | change content / reorder; keep the id when it is the same work |
  | drop todo | remove only if the user agrees that work is gone |
  | acceptance | add / edit / drop a **Scenario** (WHEN/THEN[/AND]) or **Requirement**; keep black-box contracts |
  | knowledge | add / drop a file under **Project knowledge** |
  | overview / body | rewrite sections, scope, open questions |

- Silence on a proposed delta ≠ apply
- Optional mid-point: short "what changed vs plan" summary; keep exploring until the user is ready

## Apply or discard

When exploration yields actionable findings (or the user says apply / discard / done exploring):

1. Show a clear **proposed patch** vs baseline: section edits + todo add/edit/drop. No file write yet.
2. Ask once: *Apply these updates to `{plan_path}`, or discard them?*
3. **Apply** — edit the same file in place (in plan mode: write the whole revised plan to the plan-mode file, then `ExitPlanMode`; the steps below describe the host without plan mode). Run the draft quality gate (`references/draft.md`). Preserve **Ticket**, **Branch**, **Mode**, **Parent**. A new title does not rename the folder. Set `**Status:** draft` if it was approved. Open the file again. Chat: path + what changed. Then the draft hard stop (`approve / change X / cancel`).
4. **Discard** — leave the file untouched. Say discarded. Clear the delta list.
5. Ambiguous answer → ask once; do not write.

`change X` right after a draft: the user already named the change — apply it, publish, stop. No second "apply or discard?" question.

## Don't

- Implement product / test code
- Write a second plan file, or a second `{KEY}-*` folder, for the same ticket
- Apply partial deltas without saying which part was skipped
- Mix unrelated new features into the plan without calling that out in the proposed patch
- Re-introduce line pins or full method bodies
