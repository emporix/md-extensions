# Bugfix

**Wrong behaviour that exists today. Reproduce it, find the root cause, prove it with a failing test, fix it at the cause, and change nothing else.**

1. Explore in plan mode: `emporix-feature` `references/explore.md`, plus `references/plan-rules/bugfix.md` § `explore`. Gather the evidence by running **Investigation** steps 2–4 (knowledge and Buddy, `how` over the subsystem, logs only when needed). That covers the symptom as observed vs expected, the shortest reproduction, the root cause at a seam, and the blast radius. Also say whether the fix stays inside one function. Intended behaviour → stop and suggest the **Feature** playbook.
2. Draft: `emporix-feature` `references/draft.md`, plus `references/plan-rules/bugfix.md` § `draft` (**Reproduction**, **Root cause**, Scenario 1 = the regression, the regression todo first). Hard stop. Feedback → `update` (with `references/plan-rules/bugfix.md` § `update`).
3. Approve: `emporix-feature` `references/approve.md`. Then come back to this list.
4. Other repositories: `references/multi-repo.md`. Dependency change → `skip: dependency change via {workflow}` (its foundation todo runs in step 7). Multi-product ticket → dev-plan and repositories (§ After approve). Neither → `skip: single repo`.
5. Worktrees: `references/worktrees.md` (one ticket checkout per affected repository, a sibling worktree or the branch in place as the worktree mode decides; all before architect).
6. Architect: `references/architect.md`, only when the fix crosses a function boundary, changes a type or public signature, or moves a decision between layers. Otherwise `skip: fix stays inside {function}`.
7. Implement: `emporix-feature` `references/implement.md` with `references/build.md`, stopping at its report (step 8 reviews; never `emporix-feature` review). Tests first: run the regression test against the **unchanged** code. It must fail with the reported symptom (quote the assertion). If it passes, stop with `Ready: no` and run `update`, because the root cause is wrong. Then fix at the root-cause seam (with a sketch: scaffold and bodies), and get every test green.
8. Run **Review** (`references/playbooks/review.md`).
9. Run **Open a PR** (`references/playbooks/open-a-pr.md`).

**Reply:** what was broken and for whom, the root cause, the fix, and the failing-then-passing regression output verbatim. Then the blast-radius paths covered, the review verdict, and the PR URL(s), and the principles that changed a decision.
