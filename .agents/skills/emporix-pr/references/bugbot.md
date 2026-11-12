# Bugbot gate (apply step 5)

Local code-review loop so the easy defects are fixed here instead of by the next Copilot round. Bugbot does not edit files; this parent classifies and fixes. Same launch as `emporix-feature` `references/review.md` § Sources 2.

## Launch

Exactly the launch, prompt, untracked-file handling, in-place fallback, and retry rules of `emporix-feature` `references/review.md` § Sources 2 — that file is the single copy of the Bugbot prompt. The only parameter here: `Diff: uncommitted changes` (this apply's tree, staged + unstaged; untracked files reviewed in place and merged, never staged). A run that fails after the retries → **stop** (`Ready: no`). A failed run is not "no findings".

## Loop (≤ 5 runs)

1. Run Bugbot. Record the run in the plan's Apply block (run n, findings, severities).
2. **No HIGH / MEDIUM** → **clean**; continue to format.
3. HIGH / MEDIUM whose repair stays on the PR plan's surface (the comments' asks, their tests, planned behaviour) → smallest fix, re-run the **full local suite** (`test-gate.md`) until green, then run Bugbot again.
4. HIGH / MEDIUM whose repair would change planned behaviour or widen blast radius → a **deviation** (`plan-conformance.md` outcome): stop with "we will deviate out of the plan"; accept → fix and continue the loop; reject → leave it, it stays open and the gate is not clean.
5. Still HIGH / MEDIUM after run 5 → **cap**. Not clean. List the remaining findings; do not start run 6; the ship gate stops.

LOW / INFO do not fail the gate; list them in the report. Beyond-plan observations that are not defects → report only.

A clean result on this tree is what the `emporix-feature` `pr` stage reuses as its re-ship gate. A formatter rewrite after it (step 6) keeps it valid — formatting only — but needs the suite again; any other edit invalidates it and the `pr` stage runs Bugbot itself.
