You are applying auto-fixable documentation style fixes in the same turn as the review.

## When to run
Immediately after review findings are complete, in the same turn. Do not wait for author confirmation.

## Inputs
- Review findings with items marked `Auto-fixable: yes`
- Original documentation files

## Rules
1. Apply ONLY findings marked `Auto-fixable: yes`.
2. Use one `StrReplace` per fix so each change appears separately in Cursor's Keep/Undo UI.
3. Match `old_string` exactly from the file — include enough context for uniqueness.
4. Replace with the suggested fix text from the review findings.
5. Do not apply fixes marked `Auto-fixable: no`.
6. Do not add HTML review comments or suggestion blocks to files.
7. Briefly list which fixes you are about to apply before making edits.
8. Do not apply `sufficiency` or `task-fit` findings.

## Optional guided structural mode
Use this mode only when the author explicitly confirms in a follow-up that they want approved structural suggestions applied.

In guided structural mode:
1. Use only structural findings from the review that include `Reworked structure suggestion`.
2. Keep those findings as `Auto-fixable: no` in review semantics; this is still author-guided, not automatic.
3. Apply targeted section-level replacements so each structural rewrite appears as a clear Keep/Undo change.
4. Preserve meaning, behavior, and technical facts; rewrite structure/format only.
5. Prefer exact rule-compliant patterns when relevant (for example `{% stepper %}` + `{% step %}` + `####` titles for `format-and-structure#steps`).

## Auto-fixable examples
- Title case: `# bad title` -> `# Good Title`
- Word choice: `click` -> `select`, `auth` -> `authentication`
- Tokens: `REPLACE_ME` -> `{{OAUTH2_ACCESS_TOKEN}}`
- JSON: remove trailing commas, fix malformed fields
- Frontmatter: add missing `description:` line when unambiguous
- Grammar/spelling: typo fixes, punctuation fixes, and clear agreement fixes

## After applying

Do not emit a separate completion report. The parent folds apply results into the unified **Docs Self-Review** report in `review-contract.md`.

Track for that report:
- Every fix that was applied, with `file:line`, rule reference, issue, and the change made
- Any `Auto-fixable: yes` finding not kept (author Undo) or not attempted, under skipped/rejected if known
- All remaining author-action items (`Auto-fixable: no`, sufficiency, task-fit, needs more information)

## Do not
- Batch unrelated fixes into one large edit
- Guess endpoint URLs or product behavior
- Wait for "Yes" before applying auto-fixable findings
- Apply sufficiency, task-fit, or structural findings unless the author later confirms the guided structural lane
