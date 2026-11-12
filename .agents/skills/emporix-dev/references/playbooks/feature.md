# Feature

**New or changed behaviour. Plan it with the user, design it twice, build against the design, ship through `emporix-feature`.**

1. Explore in plan mode: `emporix-feature` `references/explore.md`, plus `references/plan-rules/feature.md`. Run `how` over an unfamiliar subsystem. Another repository involved → decide the model with `references/multi-repo.md` (dependency change or multi-product ticket).
2. Draft: `emporix-feature` `references/draft.md`, plus `references/plan-rules/feature.md`. Hard stop (`ExitPlanMode`, or *approve · change X · cancel*). Feedback → `update` (with `references/plan-rules/feature.md` § `update`), then publish again.
3. Approve: `emporix-feature` `references/approve.md` (Jira comment, plan in `{RUN_FOLDER}`). Then come back to this list. Do not start `emporix-feature` implement on your own.
4. Other repositories: `references/multi-repo.md`. Dependency change → `skip: dependency change via {workflow}` (its foundation todo runs in step 7). Multi-product ticket → dev-plan and repositories (§ After approve). Neither → `skip: single repo`.
5. Worktrees: `references/worktrees.md` (one ticket checkout per affected repository, a sibling worktree or the branch in place as the worktree mode decides; all before architect).
6. Architect: `references/architect.md`. Skip only for a trivial change (one function, obvious placement, no new type, public signature, or module), with `skip: trivial — {why}`.
7. Implement: `emporix-feature` `references/implement.md` with `references/build.md` (scaffold, then fail-first tests, then bodies; the sketch is the contract), stopping at its report (step 8 reviews; never `emporix-feature` review).
8. Run **Review** (`references/playbooks/review.md`).
9. Run **Open a PR** (`references/playbooks/open-a-pr.md`).

**Reply:** what was built, for whom, and what changes for them. The design candidates and the pick as a table, deviations with their diagnoses, the review verdict, the PR URL(s), and open decisions, and the principles that changed a decision.
