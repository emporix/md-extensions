# Emporix Docs Style Review

Use this playbook when the user asks to review documentation quality or style
compliance before peer review, or when an `emporix-docs-update` playbook
requires post-write review. This includes grammar, spelling, reader
sufficiency, and task-fit when context is available.

Parent agent applies auto-fixes. The review subagent is readonly and must not
write files.

## Style authority

Set `STANDARDS_ROOT` to `emporix-docs-update`'s `references/docs-standards`
directory. Missing → stop. Never fall back to a docs checkout's vendored copy.

## Inputs

- Changed docs files from current working tree/branch.
- Style rules from `$STANDARDS_ROOT/.style-guide/`.
- Review: `$STANDARDS_ROOT/.cursor/docs-review/subagent-prompt.md`
- Apply: `$STANDARDS_ROOT/.cursor/docs-review/fix-prompt.md`
- Contract: `$STANDARDS_ROOT/.cursor/docs-review/review-contract.md`
- Sufficiency and task-fit: `$STANDARDS_ROOT/.cursor/docs-review/sufficiency-and-fit.md`

## Single-turn flow

1. Identify changed documentation files (exclude `.style-guide/` and review infra).
2. Collect **task context** from the triggering message **and this conversation**:
   - Pasted task description or acceptance criteria
   - GitHub PR or issue URLs
   - If URLs are present, fetch with `gh pr view` / `gh issue view` (body, linked issues, changed-file list)
   - Do not hunt branch names, Jira IDs in commits, or unrelated open PRs
   - If nothing is found, set `Task context: none`
3. Launch one `generalPurpose` subagent with `readonly: true`.
4. Pass the review contract, subagent prompt, sufficiency-and-fit checklist, and the `Task context` block.
5. Subagent returns structured findings only — no file writes.
6. Every finding must include a file path and line reference in the heading (e.g. `quotes/quote/foo.md:42`). Use a range for multi-line issues (e.g. `:42-58`). Never omit line numbers.
7. For structural findings (`Auto-fixable: no`), require a concrete `Reworked structure suggestion` blueprint (for example GitBook `{% stepper %}`/`{% step %}` with `####` step titles for step-format issues).
8. Before applying or presenting, verify every finding heading matches `path/to/file.md:LINE` (or `:START-END`). If any finding lacks a line reference, ask the subagent to re-run with line numbers filled in.
9. Immediately apply findings marked `Auto-fixable: yes`. Follow `$STANDARDS_ROOT/.cursor/docs-review/fix-prompt.md`. Use one `StrReplace` per fix (native Keep/Undo per change). Briefly list which fixes you are about to apply before editing.
10. Present the unified **Docs Self-Review** report from `review-contract.md`. Do **not** ask "Apply auto-fixable fixes?" or wait for "Yes".
11. Compute **Verdict** and **Ready for peer review** from remaining open items only (after apply). Applied findings are not remaining blockers.

Optional guided structural lane:
- If the author explicitly confirms in a follow-up, apply approved structural suggestions as targeted section-level edits.
- Keep structural findings classified as `Auto-fixable: no`; this lane is guided, not automatic.

Grammar and spelling corrections are applied in the same turn when they are unambiguous.

## Gating behavior

- Remaining `critical` findings block readiness for peer review.
- Remaining `major` and `minor` findings are warnings.

## Manual trigger phrase

- `Run docs style self-review for my current changes.`
- Similar phrasing also works (for example `run self review on the changes`).
