---
title: Docs Style Review Contract
---

# Docs Style Review Contract

## Purpose
Review updated or newly added documentation against the project style guide, reader sufficiency, and optional task context. Apply unambiguous auto-fixes in the same turn, then return actionable remaining items before peer review.

## Single-turn flow

1. **Review (readonly subagent):** Structured findings only. No file writes.
2. **Apply (parent, same turn):** Apply findings marked `Auto-fixable: yes` via agent `StrReplace` edits (native Keep/Undo). Do not wait for author confirmation.
3. **Report (parent):** Unified chat report — applied changes, remaining decisions, and items that need more information.

## Manual trigger
Run this review only when the author explicitly asks for it in chat.

Suggested trigger phrase:
- `Run docs style self-review for my current changes.`

Similar phrasing also works (for example `run self review on the changes`).

## Input scope
- Include only changed documentation files from the current branch/working tree.
- Exclude style-guide sources in `.style-guide/` from being reviewed as target content.
- Exclude review infrastructure files (`.cursor/docs-review/`).
- Prioritize markdown pages, changelog entries, release notes, and tutorial pages.

## Task context
Collect from the triggering message and this conversation only:
- Pasted task description or acceptance criteria
- GitHub PR or issue URLs (fetch body, linked issues, and changed-file list)

Do not hunt branch names, Jira IDs in commits, or unrelated open PRs.

If nothing is found, set `Task context: none` and skip the task-fit lane.

## Rule sources
- `.style-guide/README.md`
- `.style-guide/writing-standards/planning-and-structure.md`
- `.style-guide/writing-standards/format-and-structure.md`
- `.style-guide/writing-standards/language-and-tone.md`
- `.style-guide/writing-standards/word-choice.md`
- `.style-guide/writing-standards/links.md`
- `.style-guide/visuals/images-and-icons.md`
- `.style-guide/visuals/diagrams.md`
- `.style-guide/writing-standards/api-tutorials.md`
- `.style-guide/writing-standards/api-references.md`
- `.style-guide/templates/changelog.md`
- `.style-guide/templates/release-notes.md`
- `.style-guide/templates/api-reference.md`
- `.cursor/docs-review/sufficiency-and-fit.md`

## Required checks
- Structure and formatting (headings, sections, hints, list style including lead-in sentences and consistent items).
- Figure captions (concise, restrained punctuation) and diagram branding.
- Links (form by space, resolvable targets, registry space IDs).
- Release note titles in title case.
- Tone and clarity (active voice preference, concise instructions).
- Grammar and spelling (typos, subject-verb agreement, punctuation, malformed phrasing).
- Terminology and word-choice compliance.
- Template conformance for changelog/release-notes content.
- Changelog location and release-date placeholder when `changelog/` files change: entries go in `changelog/README.md` (not `changelog/changelog.md` or new per-release files); new entries use `{% update date="RELEASE_DATE" ... %}` at the top of the `{% updates %}` block; do not edit existing entries or `changelog/SUMMARY.md`.
- API tutorial completeness when relevant (auth, headers, examples, behavior notes).
- API reference completeness when relevant (OpenAPI structure, gerund summaries, scopes on `security`, schema/example quality, common parameters).
- Reader sufficiency (always), including user goal, fit in the documentation set, and obvious or quoted UI statements — see `sufficiency-and-fit.md`.
- Task-fit (only when task context is provided) — see `sufficiency-and-fit.md`.

## Severity model (hybrid gate)
- `critical` -> blocks readiness for peer review.
- `major` -> non-blocking, but should be fixed before peer review.
- `minor` -> non-blocking polish recommendation.

Verdict and readiness are computed **after** auto-fixes are applied, from remaining open items only.

## Finding fields (subagent)

The subagent returns structured findings. **Do not write to documentation files.**

Each finding must include:
1. File path and line reference (e.g. `path/to/file.md:8` or `path/to/file.md:42-58` for multi-line issues). **Never omit line numbers.**
2. Severity: `critical`, `major`, or `minor`
3. Lane: `style` | `sufficiency` | `task-fit`
4. Rule reference (e.g. `format-and-structure#titles`, `sufficiency#prerequisites`, `task-fit#acceptance-criteria`)
5. Issue: what is wrong and why it matters
6. Suggested fix: ready-to-paste replacement text when possible
7. Auto-fixable: `yes` or `no`

For structural findings marked `Auto-fixable: no`, include:
8. Reworked structure suggestion: a concrete block-level rewrite blueprint that follows the applicable style rule and can be copied/adapted directly (for example `{% stepper %}` + `{% step %}` + `####` titles for `format-and-structure#steps`)

Grammar and spelling findings must include the original snippet and corrected snippet in the suggested fix field when auto-fixable.

Sufficiency and task-fit findings are always `Auto-fixable: no`.

If `Task context: none`, skip task-fit and include `Task-fit: skipped` in the findings payload.

Subagent findings header:
1. `Reviewed files`: list of paths
2. Counts by severity
3. Count of auto-fixable findings
4. `Task-fit`: `skipped` | `ran`
5. Findings grouped by severity

The subagent does **not** present the user-facing report or ask to apply fixes. The parent owns the unified report.

## Apply lane (parent, same turn)

Follow `.cursor/docs-review/fix-prompt.md`:
- Apply only findings marked `Auto-fixable: yes`
- One `StrReplace` per fix (enables per-change Keep/Undo)
- Do not wait for "Yes"
- Do not modify files for non-auto-fixable findings

Optional guided structural lane (author-confirmed follow-up):
- Allowed only when the author explicitly confirms applying approved structural suggestions.
- Source of truth is the `Reworked structure suggestion` from review findings.
- Keep structural findings classified as `Auto-fixable: no`.
- Apply as targeted, reviewable edits per logical section so each change remains clear in Keep/Undo.
- Do not rewrite behavior or product meaning while restructuring format.

## Unified report (parent)

After applying auto-fixes, return the structured **Docs Self-Review** report. Do not end with a vague one-liner. Do not ask "Apply auto-fixable fixes?".

Required sections:

1. Header: Verdict, Ready for peer review, Reviewed files, Task context, Counts
2. **Applied auto-fixes** — every applied fix with `file:line`, rule reference, what was wrong, and what changed. Note Keep/Undo.
3. **Needs your decision** — remaining items grouped by severity (style structural, product judgment, sufficiency, task-fit). Include `file:line`, issue, and suggested fix. Structural items include the `Reworked structure suggestion` when available.
4. **Needs more information** — items that cannot be judged without extra input. Omit the section if N = 0.
5. **Next step** — fix remaining items, optional guided structural phrase, or re-run self-review

Applied items must not be repeated as remaining blockers.

Chat report format:

```markdown
## Docs Self-Review

**Verdict:** blocked | pass-with-warnings | pass
**Ready for peer review:** yes | no
**Reviewed files:** list of paths
**Task context:** none (task-fit skipped) | listed sources
**Counts:** applied N, remaining critical N, remaining major N, remaining minor N

### Applied auto-fixes (N)
1. `path/to/file.md:LINE` — rule-reference
   - Issue: what was wrong
   - Change: what was applied

Keep or Undo each edit in Cursor.

### Needs your decision (N)

#### Critical (N)
1. `path/to/file.md:LINE` — rule-reference (`lane`)
   - Issue: what is wrong and why it matters
   - Suggested fix: replacement text or concrete steps

#### Major (N)
...

#### Minor (N)
...

### Needs more information (N)
1. `path/to/file.md:LINE` — why judgment is blocked and what input is needed

**Ready for peer review:** yes | no
**Next step:** Fix remaining items | Reply to apply structural suggestions | Re-run self-review
```

Omit **Needs more information** when N = 0. Omit **Applied auto-fixes** body items when N = 0 (keep the heading with `(0)`).

Never omit line numbers from remaining items.

## Decision rules
- If any remaining `critical` finding exists -> Verdict `blocked`, Ready `no`
- If only remaining `major`/`minor` findings exist -> Verdict `pass-with-warnings`, Ready `yes`
- If no remaining findings -> Verdict `pass`, Ready `yes`

## Notes

Inline HTML comment annotations are not used in this workflow. The review subagent is chat-only; the parent applies native agent edits with Keep/Undo in the same turn.
