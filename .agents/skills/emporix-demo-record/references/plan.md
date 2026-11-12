# Stage `plan` — one demo plan, approved before the browser opens

Turn the story into one file that `record` can dry-run and film without re-deciding anything. Beats and visible results, not selectors: refs come from live snapshots at record time.

## Where

**In plan mode** (Claude Code, the normal case): write the plan into the plan-mode plan file and call `ExitPlanMode` — `emporix-feature` `references/plan-mode.md` § Draft. On approval, plan mode has ended: copy the plan to the path below with `**Status:** approved`, then `record`.

**Without plan mode:** write the path below with `**Status:** draft`, print the report, and stop for `approve / change X / cancel`.

```text
{DEMOS_DIR}/{YYYY-MM-DD}-{slug}-demo-plan.md      ({slug} = --slug, else kebab of the title, else {KEY})
```

`.ai/demos` is local and gitignored. `change X` rewrites the same file. At record time the approved plan is copied to `${DEMOS_DIR}/${RUN_ID}/scenario.md` beside the video.

## Shape

```markdown
# Demo plan — {title}

**Status:** draft | approved
**Ticket:** {KEY} ({browseUrl}) | none
**Audience:** {who watches}
**Outcome:** {the one thing they understand at the end}
**Tenant profile:** {alias}            ← alias only; never tenant credentials
**Language:** en · **FPS:** 30 · **Pointer overlay:** yes | no
**Base URL:** {app.baseUrl or detected hint} · **Auth:** cockpit-token | md-token | none
**Start URL:** {route below the base URL}
**End state:** {what is visible on the last frame, held ≥ 1.5 s}

## Demo data (must exist before the take)

- {entity / state} — {exists: user confirmed | created for the run by … | open}
- none

## Beats

| # | Visible action | Expected visible result | Pause after |
|---|---|---|---|
| 1 | open the quote list from the side menu | list with the "Pending approval" filter active | 1000 ms |
| 2 | click **Approve** on quote Q-1042 | confirmation dialog | 800 ms |
| 3 | click **Confirm** | toast "Quote approved", badge turns green | 1500 ms |

## Reset (between dry run and take)

- {how the session returns to the start URL and state without deleting shared data — e.g. navigate back to the list; the approved quote is demo data created for this run}

## Do not show

- credential entry, tokens, IDs, prices, customer or production data
- unrelated navigation, retries, debug panels, browser errors
- …

## Open questions

- Blocking: none | …
- Not blocking: …
```

### Include

- 3–10 beats, 30–120 seconds, one story. Each beat has a result a viewer can see without narration.
- Pauses for comprehension: 500–800 ms after typing or a small state change, 800–1200 ms after navigation or a dialog, 1500 ms on the final result.
- Demo data with its source. `record` never creates or mutates data the plan does not list.
- The tenant profile **alias**, language, fps.
- A reset that works on the **same authenticated session** (the take is recorded on the dry-run session).

### Leave out

- Snapshot refs, selectors, coordinates.
- Credential steps: authentication happens before `record start` and is never in the beats.
- Tenant names, tokens, personal or production data.
- Alternative paths and error cases, unless the story is about them.

## Quality gate (before publishing)

- Start URL is a hydrated, authenticated page; end state is stable and visible.
- Every beat names a visible result; no beat is "explore" or "check".
- Demo data is `none` or each item has a source; an unknown one is a **blocking** open question.
- Reset is reversible and touches only demo data.
- Tenant profile alias is present in `tenants.sh list` (read, not guessed).
- Do-not-show list present. No route or label that `ui.md`, the code, or the user did not confirm.

A plan that is "click through the orders module" is a failed plan. Keep exploring.

## Hard stop

Print the report (`references/report-template.md` § Plan). In plan mode omit the last line and call `ExitPlanMode`. Then:

| User says | Do |
|---|---|
| approve / looks good / record it / yes | write the approved file (plan mode) or flip `**Status:** approved`, then `record` in the same turn |
| change X | apply to the same plan, re-run the gate, publish again, stop |
| cancel / stop | stop; nothing is started, nothing on Jira |

A blocking open question survives approval → write the plan, report `Status: blocked`, do not `record`.
