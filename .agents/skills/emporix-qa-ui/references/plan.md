# Stage `plan` — one QA plan, approved before anything runs

Turn the exploration into one file that `run` can execute without re-deciding anything. Steps and expected results, not clicks and selectors: refs come from live snapshots at run time.

## Where

**In plan mode** (Claude Code, the normal case): write the plan into the plan-mode plan file and call `ExitPlanMode` — `emporix-feature` `references/plan-mode.md` § Draft. On approval, plan mode has ended: copy the plan to the path below with `**Status:** approved`, then `run`.

**Without plan mode:** write the path below with `**Status:** draft`, print the report, and stop for `approve / change X / cancel`.

```text
{QA_DIR}/{YYYY-MM-DD}-{KEY}-qa-plan.md        ({KEY} = Jira key, else pr{number}, else local)
```

`.ai/qa` is local and gitignored. One plan per ticket; `change X` rewrites the same file.

## Shape

```markdown
# UI QA plan — {KEY}: {short title}

**Status:** draft | approved
**Ticket:** {KEY} ({browseUrl}) | PR #{n} | none
**Issue plan:** {RUN_FOLDER}/{date}-{KEY}-issue-plan.md | none
**Tenant profile:** {alias}            ← alias only; never tenant credentials
**Language:** en
**Base URL:** {app.baseUrl or detected hint} · **Auth:** cockpit-token | md-token | none
**Branch / worktree:** {branch} [· {absolute worktree path}]

## What changed for the user

Two or three sentences. Source: issue plan **Overview**, ticket, or diff.

## Preconditions (must exist before the run)

- {entity or state} — {how we know it exists: user confirmed / seeded by … / open}
- none

## Steps

| # | Required | Route or setup | Action | Expected (visible) | Screenshot slug |
|---|---|---|---|---|---|
| 1 | yes | `/orders` | open from the side menu | order list loads with the "Matching" column | `orders-list` |
| 2 | yes | row for {precondition order} | click **Auto match** | toast "Matched 3 lines", row badge turns green | `auto-match-toast` |
| 3 | no | same page | click **Auto match** again | button disabled, hint "Already matched" | `auto-match-disabled` |

Scenario coverage: Step 1–2 → Scenario 1; Step 3 → Scenario 2.

## Out of scope

- …

## Open questions

- Blocking: none | …
- Not blocking: …
```

### Include

- One **required** happy path for the change; optional steps for the empty / error / permission case the issue plan or the user named.
- Expected results a screenshot can show: text, state, count, navigation. Each required step maps to a Scenario or a done-when line.
- Preconditions with their source. `run` never creates data the plan does not list.
- The tenant profile **alias** and language.

### Leave out

- Snapshot refs, CSS selectors, coordinates — they are discovered at run time.
- Steps for behaviour the ticket does not touch; full-app regression.
- Tenant names, tokens, client credentials, personal data.
- API or persistence checks (that is `emporix-qa-postman` / `emporix-qa-local-api`).

## Quality gate (before publishing)

- At least one required step with a visible expected result.
- Every required step traces to a Scenario, a done-when line, or the user's brief.
- Preconditions are `none` or each has a source; an unknown one is a **blocking** open question.
- Tenant profile alias set and present in `tenants.sh list` (read, not guessed).
- No invented routes or labels: each route or control name was seen in `ui.md`, the diff, or confirmed by the user.

A plan whose steps are "open the page, check it works" is a failed plan. Keep exploring.

## Hard stop

Print the report (`references/report-templates.md` § Plan). In plan mode omit the last line and call `ExitPlanMode`. Then:

| User says | Do |
|---|---|
| approve / looks good / run it / yes | write the approved file (plan mode) or flip `**Status:** approved`, then `run` in the same turn |
| change X | apply to the same plan, re-run the gate, publish again, stop |
| cancel / stop | stop; nothing is started, nothing on Jira |

A blocking open question survives approval → write the plan, report `Ready: no`, do not `run`.
