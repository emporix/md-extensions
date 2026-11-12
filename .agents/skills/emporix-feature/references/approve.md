# Stage `approve` — plan to Jira (long-term memory)

Approval is the user accepting `ExitPlanMode` in plan mode (`references/plan-mode.md` § After the user answers), an explicit reply in this conversation after the chat hard stop (`approve`, `looks good`, `create it`, `go`, `yes`), or `/emporix-feature approve {KEY}`. The approved text, the user's edits included, is the plan. Do not re-analyse.

Persist it on the Jira ticket so a later `implement` can use **either** the local file **or** the ticket. Jira is the durable copy across machines and worktrees. Does **not** transition status.

## 1. Read the approved text

**From plan mode:** plan mode has just ended. Source the shared loader now (`agentic-setup.md` step 1) if the stage skipped it, re-read the plan-mode file from disk (the user may have edited it), and write it to `{RUN_FOLDER}/{YYYY-MM-DD}-{KEY}-issue-plan.md` on the primary worktree. Resolve `{RUN_FOLDER}` with `emporix-setup/references/runs-layout.md` (`--key`, `--title`, `--create --adopt`) before writing. Set `**Branch:**` to `TASK_BRANCH`. Open the file as a tab. From here on that file is the plan.

**Otherwise:** re-read the plan from disk (the user may have edited it). Path: the `Plan:` line from this conversation, else `ISSUE_PLAN` from the same resolver (no `--title`). Require **Ticket** (or `{KEY}` from args). Missing → ask once; do not write to Jira.

If **Open questions → Blocking** is not `none` / empty: still write the plan (the team gets it), report `Ready: no`, and **do not** start `implement`.

## 2. Flip the file

- `**Status:** approved`
- `**Approved:** {ISO date}`

Do not change anything else. Do not `git add`.

## 3. Jira body

Comment preamble: `🤖 emporix-feature`. Body = the plan's `**Source:**` line, and its `**Playbook:**` line when present, copied verbatim as the first lines, then only the **Approved plan** section (from that heading through **Open questions**). The two header lines carry the caller's provenance to another machine, where `implement` falls back to this comment. Not the title, business description, plan-quality block, or "After you approve". Replace `{NEW_KEY}` / `{KEY}` placeholders with the real key. Do not shorten the body; truncate only if over tool limits, and then drop long **Context** before **Todos** / **Approach** / **Acceptance criteria**.

## 4. Write

**Parent + prompt**

0. **Sprint and labels — always ask.** Never copy them from the parent: a parent can sit in two sprints and carry labels that do not fit this child. **breakdown-context** on the parent (fresh, not from explore) gives the parent's sprint(s) and labels and the project's active sprints. Ask both in one prompt, two questions (AskUserQuestion when available; otherwise one chat question with both parts), then wait:
   - **Sprint** (single choice): the active sprints by name, the parent's ones marked `(parent)`, plus **No sprint**. More active sprints than fit (AskUserQuestion: 4 options) → list them all in the question text; the user types one under Other. Buddy sets a sprint by the id of an **active** sprint only: map a typed name to one of the listed active sprints' id, and a name that matches none → ask again with the list. No active sprint → do not ask; the child gets **No sprint** (say so in the report), and only the labels question is asked.
   - **Labels** (multiple choice): each of the parent's labels as its own option, none pre-selected and none marked recommended, plus **No labels**. More parent labels than fit → list them all in the question text; the user types the ones to keep under Other. The user may type new labels too (no spaces; Jira labels are single tokens).
   - The answers are this ticket's only source. A silent answer, "same as parent", or "whatever" is not an answer for a parent with more than one sprint or label: ask which ones.
   - Auto and every caller wait here too; no playbook answers this question for the user.
1. **create-subticket** (`jira_upsert_subticket`): `parent_issue_key` = parent, `summary` = **Title**, `description` = **Description** body, `sprint` = the chosen sprint's id or `"none"`, `labels` = the chosen labels or `[]`. **Always pass both.** Omitting either makes Buddy copy the parent's, and `"parent"` is never sent. Returns `{CHILD}` + `browseUrl` and the sprint and label outcome; a sprint or label Buddy could not set → say so in the report, do not retry with the parent's values.
2. **comment-issue** on `{CHILD}` with the approved-plan body (placeholders replaced).
3. Rename the folder and the file onto the child key (`runs-layout.md` `--rename-from {PARENT} --key {CHILD} --title` the plan title `--adopt`). Set **Ticket** to `{CHILD}` and **Branch** to the new `TASK_BRANCH`. Keep **Parent**. This is the `Plan:` path from now on. Do not keep the parent-key folder or file.
4. **register-issue** on `{CHILD}`. Do not comment on the parent.

**Existing ticket**

0. **Sprint and labels — always ask when `{KEY}` is a child.**
   - **Current values:** **breakdown-context** with `{KEY}` itself. Its "Parent sprint" and "Parent labels" lines are then `{KEY}`'s own sprint and labels, and it lists the project's active sprints. Failed call → current = `unknown`.
   - **Parent:** Buddy's **get-issue** / **plan-issue** do not return a parent today. Take it from, in order: a `parent` field if they ever return one, the parent the user or explore named for this ticket, else — only when the ticket type is **Sub-task** (it always has a parent) — ask the user once in chat for the parent key. Any other type with no known parent → treat it as top-level: Buddy cannot set its sprint or labels, so do not ask, and report `Sprint/labels: unchanged — no parent known (top-level ticket)`.
   - With a parent, also **breakdown-context** on the parent for its sprint(s) and labels. Then ask both in one prompt, two questions, and wait:
     - **Sprint** (single choice): **Keep current ({sprint | none | unknown})** first, then the active sprints by name (the parent's marked `(parent)`), plus **No sprint**. Overflow as in parent + prompt.
     - **Labels** (multiple choice): **Keep current ({labels | none | unknown})** first, then each parent label not already on the ticket, plus **No labels**. Say in the question that any other choice **replaces** the ticket's labels. **Keep current** together with other labels means current plus those; with current `unknown` that cannot be computed, so ask once more which labels the ticket should end up with. The user may type new labels under Other.
     - Never pre-fill from the parent; "same as parent" with several parent sprints or labels → ask which ones.
1. Both **Keep current** → no Jira write for these fields. Otherwise **update-subticket** (`jira_upsert_subticket`): `parent_issue_key` = the parent, `subticket_key` = `{KEY}`, `summary` = the ticket's current summary unchanged (from **get-issue**), and **only** the field the user changed: `sprint` = id or `"none"`, `labels` = the full resulting list or `[]`. Omit a field the user kept — on update an omitted field stays as it is. Never send `description` here.
2. **comment-issue** the approved-plan body on `{KEY}`.
3. **register-issue** on `{KEY}` only if **get-issue** / **plan-issue** did not already return `registeredFeatureId`.

**Re-approve** (after `update` on an approved plan) posts a **new** comment; Buddy has no update-comment for Jira. Do not call **register-issue** again on a registered key. Do not ask about sprint and labels again; that was settled at the first approve.

Do not invent `acli` or Jira REST. Do not claim the description was updated when only a comment was posted.

## 5. Report, then continue

`{KEY}` below is the child in parent mode, otherwise the ticket.

```text
Issue: {KEY} (link: {browseUrl})
Plan: .ai/runs/{TASK_BRANCH}/{YYYY-MM-DD}-{KEY}-issue-plan.md
Jira: comment {commentId} (+ child created | registered)
Sprint: {name | none | kept} · Labels: {a, b | none | kept}   (child tickets; `unchanged — top-level ticket` otherwise)
Ready: yes
```

`Ready: yes` → the plan's `**Source:**` line decides what runs next, in the same turn. No question; the approval is the go.

- `**Source:** emporix-feature` (or no **Source** line) → go straight to `references/implement.md`.
- `**Source:** {caller}`, any other skill (for example `emporix-dev`) → **return to that skill** and run its next step. Do not start `implement`; the caller decides when and how (`SKILL.md` § Callers).

`Ready: no` → stop. Name the blocking question. Resume with `/emporix-feature update {KEY}` then `approve`, or `/emporix-feature implement {KEY}` after the user resolves it in the plan.
