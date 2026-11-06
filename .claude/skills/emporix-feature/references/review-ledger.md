# Review ledger

`{RUN_FOLDER}/{KEY}-review-findings.md` (`emporix-setup/references/runs-layout.md`). One file per ticket, inside the ticket-branch folder. Findings outlive one run: a stopped review, a hand fix, and a new run must all land in the same place, and the PR stage reads it to write the self-review summary. `.ai/runs` is never committed.

Row numbers are **global** across cycles and runs, so a resolution always points at one finding.

```markdown
# Self-review {KEY}

Plan: {plan path}
Branch: {branch}
Base: {BASE_BRANCH}

## Run 1 — {ISO timestamp}

Parent model: {slug | unknown}
Reviewer model: {slug | inherit (host cannot switch) | in-place fallback}
Bugbot: {subagent | skill | unavailable}

### Cycle 1 of 5 — {ISO timestamp}

Diff: {n} files, +{a} −{d} ({branch commits + working tree | working tree only})

| # | Severity | Source | Location | Finding | Class | Plan item | Resolution | Fixed in cycle |
|---|---|---|---|---|---|---|---|---|
| 1 | HIGH | reviewer | `src/cart/total.ts:42` | Discount applied before tax; Scenario 2 says after | in-plan | scenario-2-discount-after-tax | fixed — moved discount after tax, test extended | 1 |
| 2 | MEDIUM | bugbot | `src/cart/total.ts` | `coupon` may be null on the empty-cart path | in-plan | seam CartTotals | fixed — null guard + Scenario 3 test | 1 |
| 3 | LOW | reviewer | `src/cart/total.spec.ts:10` | Test name does not describe behaviour | in-plan | — | open (low) | |

Gate: {commands, pass/fail}
Result: fix

### Cycle 2 of 5 — {ISO timestamp}

Diff: …

| # | Severity | Source | Location | Finding | Class | Plan item | Resolution | Fixed in cycle |
|---|---|---|---|---|---|---|---|---|
| 3 | LOW | reviewer | `src/cart/total.spec.ts:10` | (carried) | in-plan | — | open (low) | |

Result: clean

### Verdict — {ISO timestamp}

review: PASS | cycles: 2 | open: 0 | waived: 0 | low: 1
```

## Fields

- `Source`: `reviewer`, `bugbot`, or `reviewer+bugbot` (same defect from both).
- `Class`: `in-plan` or `beyond-plan` — the parent's decision, not the reviewer's suggestion.
- `Plan item`: the todo id, `Scenario N`, `Requirement N`, or seam the finding belongs to; `—` when it is a plain defect on planned code.
- `Resolution`: `fixed — {what changed}` · `open` · `open (low)` · `beyond-plan — not fixed` · `waived — {user's reason}` · `fixed by user — {note}` (set at the start of a later run when the row is gone from the diff and the user said so).
- `Fixed in cycle`: the cycle whose gate ran green with the fix. Empty until then.
- `Result` per cycle: `fix` (in-plan only, edits follow) · `clean` (no actionable) · `beyond-plan` (no edits) · `cap` (cycle 5, in-plan left) · `gate-red` (fix applied, suite still red).

## Rules

- A row moves to `fixed` only with evidence: the next cycle did not report it **and** the diff at `Location` shows the change the finding asked for. "I remember fixing it" is not evidence.
- Carry every still-open row into the next cycle's table (one line, `(carried)` in Finding is fine) so each cycle is readable alone.
- Beyond-plan rows keep `beyond-plan — not fixed` until the user widens the plan (`update` → `approve`) or waives them.
- `waived` only on the user's explicit words in this conversation, with the reason.
- Never delete a run or a row. A new conversation appends `## Run {n+1}`.
- The PR stage reads the **latest Verdict** and every row of the latest run (plus carried rows) to build the summary comment. A Verdict older than the current tree (edits after it) is stale: run `review` again before `pr`.
- A **re-ship** (`pr` onto an existing PR, see `references/pr.md` § 1a) appends `## Run {n} — re-ship — {ISO timestamp}` with `Reviewer model: Bugbot pass (no plan boundary)`, a `Plan conformance:` line when `emporix-pr apply` passed one in (`clean` or the accepted deviations), one row per Bugbot finding, `Result: clean | blocked`, and its own Verdict line. It does not replace the first ship's run; the summary comment lists both. No ledger yet (PR opened outside `emporix-feature`) → the `pr` stage creates the file with this header and the re-ship as `## Run 1`. Key-less branch → the file is `{RUN_FOLDER}/{TASK_BRANCH}-review-findings.md`.
