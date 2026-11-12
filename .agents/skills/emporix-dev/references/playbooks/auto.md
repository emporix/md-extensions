# Auto

**Drive one ticket to an open PR that is ready to merge (required checks green, no conflict, review clean) without stopping, resuming from the first unfinished step. Composes the work playbook; never forks a second implement, review, or PR path. Never merges.**

`/emporix-dev auto {KEY}`. `{KEY}` is required (ask once). Flags pass through to the steps.

1. Detect the stage from evidence (table below) and the work playbook from the plan's `**Playbook:**` line. With no plan, use `references/dispatch.md` § Work playbook for Auto. Print `auto: {KEY} · playbook {name} · start at {step} · repos {ids | this checkout}`.
2. Copy that work playbook's steps into the todo list. Mark finished ones `skip: done — {evidence}`. The Worktrees step always runs again (it reuses existing ticket checkouts, so it asks nothing on resume) when anything from architect on is left, so every edit lands in the ticket checkout.
3. Run the remaining steps. `auto` answers exactly two questions for the user: *draft the plan now?* and *open the PR now?*. Everything else stops as usual: the playbook question from step 1, plan approval (the draft hard stop), the sprint and labels of a child ticket, new or existing (`emporix-feature` `references/approve.md`), explore questions the code cannot answer, the per-repository checkout question under `ASK_USER` (`references/worktrees.md`), design sign-off with `--checkpoint`, build deviations, review FAIL, and any irreversible write.
4. Watch the PR: run **Watch PR** (`references/playbooks/watch-pr.md`) on the ticket's open PRs, in **Merge plan** order. It reuses the ticket checkout, fixes review items through `emporix-pr plan | apply` and CI failures the PR caused, and ships every fix through **Open a PR**. A dependent PR waits until the PR it depends on is clean. A stopped PR stops its dependents. Flags `--max-cycles` and `--watch-timeout` pass through.
5. Report. Open a PR step 4's QA, Postman, and docs owners are named, not run.

**Detect the stage** (multi-product: per repository, from the dev-plan and the slices). Prefer evidence on disk and on GitHub over chat memory.

| Evidence | Start at |
|---|---|
| No plan for `{KEY}`, or `**Status:** draft` | explore (draft when this conversation already explored) |
| Approved, no `### Design sketch`, the playbook runs architect, todos still open | architect |
| Approved, no `### Design sketch`, every todo done (built by `/emporix-feature` before `emporix-dev` took over) | review. Record `### Design sketch` → `Skipped: implemented before emporix-dev` first; never design over finished code |
| Sketch present (or `Skipped:`), todos open or the `Build:` line unfinished | implement (first open build phase) |
| Todos done; no ledger Verdict for this tree, or `FAIL` | review |
| Ledger `PASS` / `PASS (waived)` for this tree, no open PR for the branch (**search-prs**) | Open a PR |
| Open PR for the branch, and the ticket checkout holds work the PR does not (uncommitted changes, or commits not pushed) | Re-ship, then watch. List the changed files first. Run the plan-conformance gate, `emporix-pr` `references/plan-conformance.md` § Plan source and § For each changed hunk, over that work against the PR head: the traceable rows are the plan's todos, and there is no PR plan. A deviation is a hard stop with that file's wording. **Accept** → append it to the issue plan's `### Accepted deviations` with `found unshipped on resume`. **Reject** → stop, and leave the work in place for the user; never revert work this run did not write. Clean or accepted → **Open a PR** (re-ship), whose Bugbot pass covers the same range (PR head to the working tree, unpushed commits included), then Watch the PR |
| Open PR for the branch, nothing new in the ticket checkout | Watch the PR |
| PR merged | stop: report done, do not invent work |

Never re-explore or re-draft when an approved plan exists, unless the user asked for `update` in the same message.

**Reply:** stopped or done and why, the plan path (and dev-plan), the architect outcome and sketch deviations, and per repository the review verdict, PR URL, and Watch PR result (ready to merge, n cycles, or stopped and why, with the checks, merge, and review state). Then the next human step, only when blocked, and the principles that changed a decision.
