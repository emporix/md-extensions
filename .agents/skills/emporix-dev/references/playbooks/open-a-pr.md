# Open a PR

**Run at the end of every work playbook, and directly for "open the PR", "ship it", or `pr {KEY}`. This is the only step that commits, pushes, or opens or updates a PR, and `emporix-feature` does it, not `emporix-dev`.**

1. Shape: **search-prs** for the ticket branch in each repository, then follow the two shapes of `emporix-feature` `references/pr.md`:
   - **First ship** (no open PR for the branch): the review ledger's latest Verdict for this tree is `PASS` or `PASS (waived)`. `FAIL` or none → ask *fix by hand / waive listed findings / stop*, or run review (`emporix-feature` § Gates).
   - **Re-ship** (an open PR for the branch, and the tree holds new work such as hand edits): the gate is the one Bugbot pass `pr.md` runs over the new diff. A full review is not required.
   - Multi-product ticket: every repository. A blocked one holds back its dependents in the **Merge plan**.
2. PR question, first ship only: *open the PR now?* Name the QA options from `emporix-feature` § Gates (the review row). **Auto** answers yes. Not yet → stop; `/emporix-dev pr {KEY}` resumes here. A re-ship updates the open PR without asking again; the user asked for it.
3. Commit, push, PR: `emporix-feature` `references/pr.md` as written, with cwd = the ticket checkout. It formats, runs the full suite, commits once as the token owner, pushes (never force), opens or updates the PR, posts or updates the self-review comment, and posts the Jira pointer. Multi-product ticket: once per repository, in **Merge plan** order (`references/multi-repo.md` § The PR question and shipping).
4. Name the next owners. Do not run them unless the **Auto** playbook says so (it runs Watch PR):
   - Review comments → `/emporix-pr auto {pr} --worktree` (`--worktree` makes it reuse the ticket checkout: the worktree, or the main checkout when the branch is in place)
   - Until mergeable (required checks, conflicts, and review together) → `/emporix-dev watch-pr {pr}`
   - QA evidence → `/emporix-qa-ui {KEY}` (`ui` / `fullstack`), `/emporix-qa-local-api {KEY}` (backend with `qa.postman`)
   - An HTTP contract changed → `/emporix-qa-postman {KEY}` (its own PR into `postman-collections` `develop`)
   - `docs.targets` set → `/emporix-docs-update {KEY}` (its own PRs)
   - After merge → `/emporix-worktree-cleanup {KEY}` from each repository's main checkout (once per repository that got a worktree)

**Reply:** first ship or re-ship, each PR URL in **Merge plan** order with "merge first" / "merge after {repo}", the gate that passed (review verdict or Bugbot pass), the next owners that apply, and the principles that changed a decision.
