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

Comment preamble: `🤖 emporix-feature`. Body = only the **Approved plan** section (from that heading through **Open questions**). Not the title, business description, plan-quality block, or "After you approve". Replace `{NEW_KEY}` / `{KEY}` placeholders with the real key. Do not shorten the body; truncate only if over tool limits, and then drop long **Context** before **Todos** / **Approach** / **Acceptance criteria**.

## 4. Write

**Parent + prompt**

1. **create-subticket** (`jira_upsert_subticket`): `parent_issue_key` = parent, `summary` = **Title**, `description` = **Description** body. Returns `{CHILD}` + `browseUrl`.
2. **comment-issue** on `{CHILD}` with the approved-plan body (placeholders replaced).
3. Rename the folder and the file onto the child key (`runs-layout.md` `--rename-from {PARENT} --key {CHILD} --title` the plan title `--adopt`). Set **Ticket** to `{CHILD}` and **Branch** to the new `TASK_BRANCH`. Keep **Parent**. This is the `Plan:` path from now on. Do not keep the parent-key folder or file.
4. **register-issue** on `{CHILD}`. Do not comment on the parent.

**Existing ticket**

1. **comment-issue** the approved-plan body on `{KEY}`.
2. **register-issue** on `{KEY}` only if **get-issue** / **plan-issue** did not already return `registeredFeatureId`.

**Re-approve** (after `update` on an approved plan) posts a **new** comment; Buddy has no update-comment for Jira. Do not call **register-issue** again on a registered key.

Do not invent `acli` or Jira REST. Do not claim the description was updated when only a comment was posted.

## 5. Report, then continue

`{KEY}` below is the child in parent mode, otherwise the ticket.

```text
Issue: {KEY} (link: {browseUrl})
Plan: .ai/runs/{TASK_BRANCH}/{YYYY-MM-DD}-{KEY}-issue-plan.md
Jira: comment {commentId} (+ child created | registered)
Ready: yes
```

`Ready: yes` → go straight to `references/implement.md` in the same turn. No question; the approval is the go.

`Ready: no` → stop. Name the blocking question. Resume with `/emporix-feature update {KEY}` then `approve`, or `/emporix-feature implement {KEY}` after the user resolves it in the plan.
