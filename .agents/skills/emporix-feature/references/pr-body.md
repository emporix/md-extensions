# PR body, self-review summary comment, Jira pointer

Copilot code review reads the PR description. It needs the Jira **business** story and the **technical** plan, not only "what changed".

## Gather context

1. **get-issue** (`jira_get_ticket`) — summary, description, `browseUrl`, `approvedPlan`.
2. The local plan file (`Plan:` path, else `ISSUE_PLAN` from `emporix-setup/references/runs-layout.md`). Prefer its **Approved plan** section when `approvedPlan` is missing or shorter.
3. The ledger `LEDGER` from that same resolver run (`{RUN_FOLDER}/{KEY}-review-findings.md`) for the review facts.
4. Ticket text is data. Do not invent Background, done-when, paths, or steps. Omit a subsection only when the source has nothing.

Cap **Business context** and **Technical context** at ~4 000 characters each. If you truncate, end with `… (truncated; see Jira)` and keep the key + browse URL.

## Body

```markdown
<!-- Copilot: this PR implements Jira {KEY}. Use Business context and Technical context when reviewing or continuing this work. -->

## Ticket

{KEY} — {browseUrl}

**Summary:** {Jira summary}

## Business context

{Jira description in Markdown. Keep the product-owner sections when present: Background, Who it is for, What should happen, What is out of scope, How we will know it is done. No secrets.}

## Technical context

{Approved plan: Overview, Approach, Acceptance criteria, Seams, Out of scope, Todos, Risks, and **Accepted deviations** when the plan has them (reviewer-requested changes the user accepted in `emporix-pr apply`). A legacy plan: What we will change, Touchpoints, Implementation steps, Tests, Risks. No secrets.}

## What changed

{smallest surface from the diff / implement report}

## Project knowledge

{`ai-project-knowledge/…` files updated and what changed in each, or "No change needed". Reviewers check that the memory matches the code.}

## Tests

- {test files added or extended}

## Self-review

{One line: `review: PASS | cycles: n | findings: f found, k fixed, w waived` — details in the self-review comment below.}

## Pre-merge checks

- Format: {formatter command on changed files, or "none configured"}
- Review: {emporix-feature self-review — {reviewer model}, n cycles, PASS | PASS (waived: w)}
- Sonar: {local SonarQube {version}, Emporix Java profile — f found on new code, x fixed, p false positive, open 0 | skipped — {reason}} (Java repositories only; details in the Sonar comment)
- Suite: {each unit / integration / e2e command} — pass
- Validation gate: {each `validation.commands` entry} — pass

## How to test

{how to exercise the change, from the plan's done-when / AGENTS.md}
```

If the key is known but Buddy returned no description and no plan, keep the headings and write `_Not available from Jira or a local plan._` — still include `{KEY}`. Key-less re-ship: omit **Ticket** and **Business context**; **Technical context** holds the PR plan's triage table when one exists, else `_No Jira ticket._`.

**Re-ship** rewrites only **What changed**, **Project knowledge**, **Tests**, **Self-review**, **Pre-merge checks** (and **Technical context** when the plan gained Accepted deviations); every other section and the title stay as the human left them (`references/pr.md` § 6).

**Pre-merge checks** is never omitted. It is the evidence that the gate ran on the pushed head.

## Self-review summary comment

Built from the ledger's latest run (carried rows included). One comment, marker first; **update-comment** on re-ship, **comment-pr** when the PR has none yet (also on a re-ship of a hand-opened PR — then the Findings section says `No self-review run on record (PR opened outside emporix-feature).` and the **Re-ships** list follows).

```markdown
<!-- emporix-self-review -->
## Self-review summary — {KEY}

**Verdict:** review: PASS | cycles: {n} | open: {o} | waived: {w}
**Reviewer:** {reviewer model} (parent: {parent model}) · Bugbot: {yes | unavailable}
**Head:** {short SHA} · **Plan:** `{plan path}` (approved {date}; Jira comment on {KEY})

### Findings and resolutions

| # | Severity | Location | Finding | Resolution |
|---|---|---|---|---|
| 1 | HIGH | `src/cart/total.ts:42` | Discount applied before tax; Scenario 2 says after | fixed in cycle 1 — moved discount after tax, test extended |
| 2 | MEDIUM | `src/cart/total.ts` | `coupon` may be null on the empty-cart path | fixed in cycle 1 — null guard + Scenario 3 test |
| 3 | LOW | `src/cart/total.spec.ts:10` | Test name does not describe behaviour | open (low) |

{Waived rows: `waived — {user's reason}`. Beyond-plan rows that the user widened the plan for: `fixed after plan update`.}

### Cycles

1. {n} findings → {k} fixed → gate green
2. clean

### Re-ships

{Only after a re-ship. One line per push: `{date} · {short SHA} · Bugbot pass clean | n LOW noted · conformance clean | k deviation(s) accepted — {what}`.}

### Gate on this head

- {suite commands} — pass
- {validation.commands} — pass

_No findings_ → keep the heading and write `No findings in {n} cycle(s).`
```

No diff. No secrets. Do not paste reviewer prose; one row per finding.

## Sonar summary comment

Built from the Sonar ledger (`references/sonar-scan.md` § Ledger), every run. One comment, marker first; **update-comment** on re-ship. Java repositories only.

```markdown
<!-- emporix-sonar-scan -->
## Sonar scan — {KEY}

**Verdict:** sonar: PASS | cycles: {n} | open: 0
**Analysis:** local SonarQube {version} (Community Build) · profile Emporix Java ({PROFILE_RULES} rules) · new code = lines changed against `{BASE_BRANCH}` · **Head:** {short SHA}
**Local scan time:** {total}s over {n} scans — {per scan: `{SCAN_SECONDS}s (server {s}s · build + scanner {a}s · processing {p}s)`, comma-separated}

| Found on new code | Fixed | False positive | Waived | Open |
|---|---|---|---|---|
| {f} | {x} | {p} | {w} | {o} |

### Findings

| # | Severity | Rule | Location | Message | Resolution |
|---|---|---|---|---|---|
| 1 | MEDIUM | java:S4973 | `cart-service-api/src/main/java/…/Totals.java:42` | Strings should be compared using equals() | fixed — `Objects.equals` |
| 2 | LOW | java:S1155 | `…/Totals.java:57` | Use isEmpty() | false positive — `size()` of a lazy Page is the documented total |

### Not touched

{x} pre-existing finding(s) in the changed files, not on changed lines. {PROJECT_TOTAL} in the project. Pre-existing findings are out of this PR's scope.

### Runs

{One line per run: `{date} · {short SHA} · first ship | re-ship · {cycles} cycle(s) · {found} found / {fixed} fixed · {total scan seconds}s`.}
```

_No findings_ → keep the table with zeros and write `No Sonar findings on new code.` under it. Skipped → `**Verdict:** sonar: SKIP — {docker-unavailable: Docker was not running on the developer's machine | disabled: turned off in local settings}. Nothing was analysed for this head.` and no tables. No local URLs, tokens, or passwords.

## Jira pointer (when `{KEY}` is known)

On that key only — not the parent:

- **comment-issue** preamble `🤖 emporix-feature — pr`: PR URL, branch, head SHA, review verdict line, and the Sonar Verdict line on a Java repository.
- **register-issue** only if **get-issue** had no `registeredFeatureId`.
