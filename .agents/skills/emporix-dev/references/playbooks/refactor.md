# Refactor

**Change the structure, keep the behaviour. Pin every contract, put a safety net under it, design the target twice, then move in small steps that keep the suite green.**

A behaviour change found on the way is not part of this playbook. Note it as a follow-up **Bugfix** or **Feature** ticket.

1. Explore in plan mode: `emporix-feature` `references/explore.md`, plus `references/plan-rules/refactor.md` § `explore`. That covers the motivation, every contract the target touches, the tests covering each, and the target structure. Offer `how` once for an unfamiliar subsystem.
2. Draft: `emporix-feature` `references/draft.md`, plus `references/plan-rules/refactor.md` § `draft` (Requirements only, a **Safety net** table, the `safety-net` todo first, then `step-…` todos). Hard stop. Feedback → `update` (with `references/plan-rules/refactor.md` § `update`).
3. Approve: `emporix-feature` `references/approve.md`. Then come back to this list.
4. Other repositories: `references/multi-repo.md`. Dependency change → `skip: dependency change via {workflow}` (its foundation todo runs in step 7). Multi-product ticket → dev-plan and repositories (§ After approve). Neither → `skip: single repo`.
5. Worktrees: `references/worktrees.md` (one ticket checkout per affected repository, a sibling worktree or the branch in place as the worktree mode decides; all before architect).
6. Architect: `references/architect.md`, always. The explore target is the brief, and the chosen sketch is the target structure. For internals the sketch wins over **Approach**. A shape that would move a pinned contract is rejected.
7. Implement: `emporix-feature` `references/implement.md` with `references/build.md`, stopping at its report (step 8 reviews; never `emporix-feature` review), in this order:
   - Tests first: the `safety-net` todo, all green on the **unchanged** code.
   - Cleanup: subtract first.
   - Scaffold the new shapes **unwired**, so the suite stays green.
   - Pin: `skip: no new Scenario`.
   - Bodies: the `step-…` todos, with the full suite green after each.
8. Run **Review** (`references/playbooks/review.md`; its Refactor row keeps every Requirement in the plan and stops on a behaviour-changing repair).
9. Run **Open a PR** (`references/playbooks/open-a-pr.md`).

**Reply:** the structure that changed, the contracts it held and the safety net that proves it, and the steps taken. Then what got simpler for the next maintainer, in layers to trace and state to hold (`minimize-reader-load.md`), the follow-up tickets for bugs found on the way, the review verdict, the PR URL(s), and the principles that changed a decision. No new behaviour.
