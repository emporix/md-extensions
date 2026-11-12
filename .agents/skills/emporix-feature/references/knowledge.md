# Project knowledge (implement step 7)

`PROJECT.md` and `ai-project-knowledge/` are the repository's committed memory: rules, states, data shapes, API surface, flows, UI behaviour, integrations, with the paths that hold them. After this change lands, that memory must still be true. Keeping it true is part of the ticket, not a follow-up.

Run this after the gate is green and before the review stage. Knowledge edits are documentation of the change you just made; they do not need tests and do not re-run the gate. The review stage treats a knowledge statement the diff made wrong and left standing as an in-plan finding.

## 1. What to check

Start from the plan's **Project knowledge → Update after implementation** (and its `knowledge-update` todo). Then confirm against the diff: open every knowledge file the plan named, plus the file that owns each seam you edited (`PROJECT.md` index, `AGENTS.md` **Task routing**). A legacy plan without that section: derive the list from the diff alone.

For each edited seam, ask whether the diff changed something a knowledge file states or should state:

| Diff touches | Knowledge file | Statement to fix |
|---|---|---|
| Validation, precondition, calculation, limit, default, status or transition | `domain.md`, owning `modules/<name>.md` | The rule or state line, and the test that pins it |
| Entity, document, table, field with business meaning, relation, migration | `data-model.md` | The shape, relation, lifecycle, or tenancy note |
| Endpoint, request or response field, status code, scope, event payload | `api.md` | The resource entry, auth or error note, contract source path |
| Route, page action, backend call, permission check, feature flag, form rule | `ui.md` | The route entry and its rules |
| Outbound call, topic or queue, webhook, scheduled job | `integrations.md` | Direction, protocol, retry or compensation |
| A flow's steps, actors, side effects, or failure handling | owning `modules/<name>.md` | The flow description and key files list |

Nothing in the table applies, and the plan said `none` → no edit. Say so in the report.

The plan said `none` but the diff did change one of those → update anyway, and say the plan missed it. Do not leave memory wrong because the plan did.

## 2. How to edit

- Edit the existing statement. Keep the file's shape, headings, and one-line style (`references/project-knowledge.md` in `emporix-setup`: what it is, the rule, where it lives, the test that pins it). No code beyond a one-line condition or an enum of states.
- Every bullet you add or change cites a path that exists after your change. Add new paths to the file's `Sources:` line.
- Do not change `Last scanned:`. That header belongs to `/emporix-setup --rescan`. A hand edit is maintenance, not a scan.
- Preserve `<!-- keep -->` blocks.
- Removed behaviour → remove its statement. Do not leave a rule the code no longer enforces.
- A new significant module with no file → create `ai-project-knowledge/modules/<name>.md` with the standard header, then add its row to the `PROJECT.md` **Knowledge files** table. Otherwise do not touch `PROJECT.md`.
- Stale content you noticed that is unrelated to this ticket (the plan's **Stale now**, or something you saw while reading): do not rewrite it here. List it in the report so the user can run `/emporix-setup --rescan <module>`.
- No secrets, tenant identifiers, or fixture data.

Keep the edits small. One ticket usually changes a few lines in one or two files. A knowledge edit that describes code outside this change is beyond the plan.

## 3. Sync Buddy

Buddy's service registry mirrors these files (`emporix-setup` `references/buddy-sync.md`). When step 2 changed at least one knowledge file, push the changed files so `get_service_context` and the system map stop describing the old behaviour. No knowledge edit → no call.

Follow `buddy-sync.md` with these fixed choices:

- Preconditions as written there; `$BUDDY_SERVICE` empty → skip with `Buddy: skipped — buddy.service not set (run /emporix-setup --sync-buddy)`. Never ask which service; never write `ai-setup.json`.
- **upsert-service-context** with `service` = `$BUDDY_SERVICE`, `name` = `$BUDDY_SERVICE`, `mode=merge`, `sections` = only the files you edited or created (title and `source` from the table in `buddy-sync.md`), `branch` = the ticket branch, `commit` = `HEAD`, `synced_by` = `emporix-feature {KEY}`. Omit `description`. Never `mode=replace`.
- A new `modules/<name>.md` is a new section; `PROJECT.md` goes along as `Project` when you added its row.
- The call is a soft step. Any failure → `Buddy: skipped — {reason}`; do not retry more than once, do not block the stage.

The same applies whenever a later stage edits a knowledge file: a review-loop fix (`references/review.md`) or an `emporix-pr apply` fix. Run this section again for those files; `merge` makes repeated calls safe. Buddy then shows the branch and commit it was synced from, so a reader can tell un-merged knowledge from `main`.

## 4. Report

Add to the implement report and the implement + review Jira comment:

```text
Knowledge: ai-project-knowledge/domain.md, ai-project-knowledge/api.md — {one clause per file: what changed}
Buddy: updated {service} (2 replaced, 0 added) | skipped — {reason}
```

or

```text
Knowledge: no change needed
```

(no `Buddy:` line when nothing was synced). When you updated a file the plan did not list, add `(not in plan)` after that file. When you saw unrelated stale content, add a line `Knowledge stale: {file} — {statement} — run /emporix-setup --rescan {module}`.
