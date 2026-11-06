# Reports

Chat only. Short. Do not paste the plan body, the diff, or the ledger. Add `Worktree: {absolute path}` to any report **only** when `--worktree` was used.

## Draft (hard stop)

```text
Plan: .ai/runs/{TASK_BRANCH}/{YYYY-MM-DD}-{KEY}-issue-plan.md (draft) | (plan mode) {plan file path}
Mode: parent + prompt → child under {PARENT} | existing ticket {KEY}
Todos: {n} · Scenarios {1–m} → {scenario ids}
Blocking questions: none | {count — listed in the file}
approve · change X · cancel
```

In plan mode drop the last line and call `ExitPlanMode` right after the report (`references/plan-mode.md`); the approval dialog carries the three choices.

## Approve

```text
Issue: {KEY} (link: {browseUrl})
Plan: .ai/runs/{TASK_BRANCH}/{YYYY-MM-DD}-{KEY}-issue-plan.md (approved)
Jira: comment {commentId} [· child created · registered]
Ready: yes | no — {blocking question}
```

`Ready: yes` is followed by implement in the same turn.

## Implement

```text
Issue: {KEY} (link: {browseUrl})
Branch: {TASK_BRANCH}
Mockups: {MOCKUPS_DIR}/{KEY}-… | none
Tests: {test files added or extended}
Gate: {commands} — pass | fail ({command})
Knowledge: {ai-project-knowledge/… — what changed} | no change needed
Buddy: updated {service} ({n} replaced, {m} added) | skipped — {reason}
Ready: review | no
```

The `Buddy:` line is present only when a knowledge file changed (`references/knowledge.md § 3`). Add `Knowledge stale: {file} — {statement} — run /emporix-setup --rescan {module}` when you saw unrelated stale content you did not rewrite. `Ready: review` is followed by the review stage in the same turn. `Ready: no` names the failed command or the drifted seam and how to resume (`/emporix-feature implement {KEY}` after the fix).

## Review

```text
Issue: {KEY} (link: {browseUrl})
Plan: {plan path}
Ledger: .ai/runs/{TASK_BRANCH}/{KEY}-review-findings.md
Reviewer: {model} · Bugbot: yes | unavailable
review: PASS | cycles: {n} | open: 0 | waived: {w}
Jira comment: {commentId}
Ready: pr
```

Then the question: *Open the PR now?* (with the QA options). On FAIL:

```text
review: FAIL | cycles: {n} | reason={beyond-plan | cap | gate-red} | remaining: {one-liners}
Ready: no
```

Then one line per remaining finding (severity, location, what, why it is beyond the plan when it is), and the question: *fix by hand, waive, or stop?*

## PR

```text
Issue: {KEY} (link: {browseUrl})
Branch: {branch}
Commit: {pushed head SHA}
Author: {token-owner login} ({commit author email})
Review: self-review {reviewer model} — {n} cycles, PASS | PASS (waived: w)
Gate: {commands, comma-separated} — pass
PR: {number} (link: {prUrl})
Self-review comment: {url}
Jira comment: {commentId}
Ready: yes
Next: /emporix-docs-update {KEY}        (only when docs.targets is set)
```

`Ready: no` when a gate failed, the commit author is an agent, the push was rejected, or the PR exists in a closed/merged state. Name the failed step and how to resume (`/emporix-feature pr {KEY}` after the fix; `/emporix-feature review {KEY}` when the verdict is stale).

## Handoff lines other skills read

- `Ready:` — `Ready: {next stage}` (`review`, `pr`) = gate green, continuing or waiting for the user; `Ready: yes` = done; `Ready: no` = blocked, with the reason and how to resume. `emporix-pr` uses the same vocabulary (`Ready: ship`).

- `Issue:` — the ticket (the child in parent mode).
- `Plan:` — the approved plan path, under `.ai/runs/{TASK_BRANCH}/`. `emporix-pr` (plan-conformance gate) and `emporix-docs-update` resolve it with `emporix-setup/references/runs-layout.md` and read its **Approved plan** section. A glob of only `.ai/runs/*-{KEY}-issue-plan.md` misses the folder.
- `Branch:` / `Worktree:` — where the change lives.
- `PR:` — `emporix-pr auto` watches `Commit:` as the head for the next review.
