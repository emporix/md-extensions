# PR open

**Run at the end of every work playbook, and directly for "open the PR", "ship it", or `pr {KEY}`. This is the only step that commits, pushes, or opens or updates a PR. The commit, push, and PR work is `emporix-feature` `references/pr.md` (§§ 2–8 on a re-ship, `references/reship.md`); the review gate in front of it never uses Bugbot.**

1. Shape: **search-prs** for the ticket branch in each repository:
   - **First ship** (no open PR for the branch): the review ledger's latest Verdict for this tree is `PASS` or `PASS (waived)`. `FAIL` or none → ask *fix by hand / waive listed findings / stop* (waive: `references/review-loop.md` § Waive), or run **Review** (`references/playbooks/review.md`). On a Java repository the Sonar ledger's latest Verdict must also be `PASS`, `PASS (waived)`, or `SKIP` for this tree (`emporix-feature` `references/pr.md` § 1b); `FAIL` → ask the same question for its rows (waive: `references/sonar-scan.md` § After the loop step 4); none → `emporix-feature` `pr.md` § 1b runs it. This is the one place the review's and Sonar's PASS and FAIL questions are asked.
   - **Re-ship** (an open PR for the branch, and the tree holds new work such as hand edits): `references/reship.md`: its gates are a Sonar pass on a Java repository and one reviewer-panel pass over the new diff, with LOW rows fixed locally (never Bugbot). A full review is not required.
   - Multi-product ticket: every repository. A blocked one holds back its dependents in the **Merge plan**.
2. PR question, first ship only: *open the PR now?* Name the QA options from `emporix-feature` § Gates (the review row). **Auto** answers yes. Not yet → stop; `/emporix-dev pr {KEY}` resumes here. A re-ship updates the open PR without asking again; the user asked for it.
3. Commit, push, PR, with cwd = the ticket checkout. **First ship**: `emporix-feature` `references/pr.md` as written, with one override that wins over its § 6 text: when § 6 runs **create-pr**, its `--title` is the conventional title from `references/conventional-titles.md` (`{type}({KEY}): {summary}`), never § 6's `{KEY} {one-line summary}`. Before **create-pr**, check the title against every rule in `references/conventional-titles.md` (type, scope, `!`, lowercase imperative summary, no trailing period, at most 72 characters). The structural part, as a POSIX extended regex (`[[ "$TITLE" =~ $RE ]]` in bash, or `grep -E`; not Python `re`, which has no `[:space:]`), is `^(feat|fix|refactor|perf|docs|test|build|ci|chore)(\([A-Z][A-Z0-9_]+-[0-9]+\))?!?: [a-z0-9](.*[^[:space:].])?$`; the reference stays authoritative for what a regex cannot check (imperative mood, a summary of the delivered change). Any rule fails → rewrite the title first; if its § 1 finds an open PR for the branch after all, stop and re-ship instead, never following its § 1a. **Re-ship**: `references/reship.md`. Multi-product ticket: once per repository, in **Merge plan** order (`references/multi-repo.md` § The PR question and shipping).
3b. Repo hooks: fire `at: pr` (`references/repo-hooks.md` § Fire), once the PR exists.
4. Name the next owners. Do not run them unless the **Auto** playbook says so (it runs PR watch):
   - Review comments, with you approving the fixes → `/emporix-dev pr-comments {pr}`
   - Until mergeable (required checks, conflicts, and review together) → `/emporix-dev pr-watch {pr}`
   - Merge once GitHub reports it green → `/emporix-dev pr-merge {pr}` (asks first; `--yes` does not)
   - QA evidence → `/emporix-qa-ui {KEY}` (`ui` / `fullstack`), `/emporix-qa-local-api {KEY}` (backend with `qa.postman`)
   - An HTTP contract changed → `/emporix-qa-postman {KEY}` (its own PR into `postman-collections` `develop`)
   - `docs.targets` set → `/emporix-docs-update {KEY}` (its own PRs)
   - After merge → **PR merge** deletes the remote branch and offers the worktree and local branch cleanup; merged elsewhere → `/emporix-worktree-cleanup {KEY}` from each repository's main checkout (once per repository that got a worktree)

**Reply:** first ship or re-ship, each PR URL in **Merge plan** order with "merge first" / "merge after {repo}", the gate that passed (review verdict or reviewer pass, and the Sonar Verdict on a Java repository), the LOW findings (fixed, and each one left open with why), the next owners that apply, and the principles that changed a decision.

## Rules

- Never launch Bugbot, and never run `emporix-feature` `references/pr.md` § 1a; a re-ship is `references/reship.md`.
- Never force-push. One PR per branch and key. Do not merge.
