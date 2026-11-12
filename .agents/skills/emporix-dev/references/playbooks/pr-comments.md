# PR comments

**Fix the review comments on one open PR, with you in the loop: collect every comment, triage it, plan the fixes, stop for your approval, then fix failing-test-first, gate, ship onto the same PR, and reply. Bugbot is never used. Not a work playbook; it never writes `**Playbook:**`.**

`/emporix-dev pr-comments {pr | KEY}`. Pass a PR number or URL, or a key whose open PR **search-prs** finds. With neither, ask once. It runs the same way on a PR opened outside `emporix-dev`, with or without a key.

1. Setup and checkout: `references/pr-fix.md` § Setup, then the ticket checkout for the PR's `headRefName` (`references/worktrees.md`, `--key {KEY}` when there is one).
2. Plan: `references/pr-fix.md` § Plan. Hard stop at its step 5: *approve · change X · cancel*. Change → edit the plan file, show the delta, stop again.
3. Apply, on approval: `references/pr-fix.md` § Apply, attended (every proposed reply you saw in the plan is posted).
4. Name the next owner: `/emporix-dev watch-pr {pr}` to watch for the next review round and CI until the PR can merge. Do not start it.

**Reply:** the triage counts, what was fixed with its failing-then-passing test, the conformance result, the review-loop result, the pushed SHA, the threads replied and resolved, the threads left for you, and the principles that changed a decision.

**Watch PR** runs steps 2–3 unattended (its step 5): invoking Watch PR is the approval, so `references/pr-fix.md` § Plan does not stop, and its § Apply step 9 posts only the unattended replies.
