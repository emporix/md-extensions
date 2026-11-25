# Emporix Docs Style Review

Use this playbook when the user asks to review documentation quality or style
compliance before peer review, or when an `emporix-docs-update` playbook
requires post-write review. This includes grammar, spelling, reader
sufficiency, task-fit when context is available, a correctness check of every
example, and a clarity check for people and AI assistants.

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
7. For structural findings (`Auto-fixable: no`), require a concrete `Reworked structure suggestion` blueprint (for example GitBook `{% stepper %}`/`{% step %}` with `#####` step titles for step-format issues).
8. Before applying or presenting, verify every finding heading matches `path/to/file.md:LINE` (or `:START-END`). If any finding lacks a line reference, ask the subagent to re-run with line numbers filled in.
9. Run the **Example check** and the **Clarity check** below on the same
   changed files, every time, even when the subagent found nothing. Add their
   findings, with `file:line` headings and severities, to the subagent's
   findings before anything is applied or reported.
10. Immediately apply findings marked `Auto-fixable: yes`, including Example and Clarity fixes. Follow `$STANDARDS_ROOT/.cursor/docs-review/fix-prompt.md`. Use one `StrReplace` per fix (native Keep/Undo per change). Briefly list which fixes you are about to apply before editing.
11. Present the unified **Docs Self-Review** report from `review-contract.md`, including the Example and Clarity check results. Do **not** ask "Apply auto-fixable fixes?" or wait for "Yes".
12. Compute **Verdict** and **Ready for peer review** from remaining open items only (after apply), across style, Example, and Clarity findings. Applied findings are not remaining blockers.

## Example check (required)

Every example in a changed file must be correct. This covers `curl`
requests, JSON or YAML request and response bodies, OpenAPI `example` and
`examples` values, code snippets, configuration values, and sample IDs.

The parent agent runs this check, not the readonly style subagent, because it
needs the source. For each example:

1. **Check it against the source of truth.** Compare it to the product diff,
   the OpenAPI contract, and the implementation. Confirm the method, path,
   path and query parameters, headers, scope, field names, field types,
   required fields, enum values, and status codes. An example from the old
   behavior that the change made wrong is a finding.
2. **Check that it parses.** JSON must be valid JSON. YAML must be valid YAML.
   A `curl` command must run as written once the placeholders are filled in.
   Parse each JSON or YAML block, and the changed OpenAPI file, with a local
   parser.
3. **Check that it is consistent.** The same ID, code, or value is the same
   across the steps of one page and between the request and the response.
   Token placeholders follow the style guide (`{{OAUTH2_ACCESS_TOKEN}}` and the
   others). Values are realistic, not `test`, `string`, or `1111`.
4. **Check that it is complete.** The example contains everything the reader
   needs to run it: required fields, required headers, and the scope the
   token needs (in the text next to it).

Fix every wrong example. If the source does not confirm a value, remove the
example or the value and record an open question. Never keep a guess. A wrong
or unparseable example is `critical`.

## Clarity check (required)

Write so that a person and an AI assistant both understand the page without
other context. The page is easy to follow and still has all the information
the reader needs. Flag and fix:

- **Missing information.** Prerequisites, required scopes or roles, required
  fields, defaults, limits, units, and the expected outcome must be stated.
  The reader must not have to guess a step or look in the code.
- **Unnecessary information.** Cut details that do not help the reader reach
  the goal, and details another page owns (link to it instead).
- **Ambiguous references.** Name the thing instead of "it", "this", or "the
  above" when the reference is not obvious. Use the exact UI label, endpoint,
  or field name.
- **Inconsistent terms.** Use one term for one thing across the page and its
  neighbours. Define a term on first use.
- **Sections that do not stand alone.** Each section has a heading that says
  what it covers and makes sense when read on its own, because AI tools and
  search often retrieve one section without the rest of the page.
- **Information only in a picture.** Anything a screenshot or diagram shows
  that the reader needs is also in the text.
- **Long or tangled sentences.** One idea per sentence. Steps in the order
  the reader does them. Code blocks have a language tag.

Missing information that blocks the task is `major`. Other clarity findings
are `minor`. Apply clear fixes in the same turn. If fixing needs product
facts you do not have, record an open question.

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
