# PR plan file template

Path: `{RUN_FOLDER}/{YYYY-MM-DD}-{KEY}-pr-plan.md` (`emporix-setup/references/runs-layout.md`). Never committed (`.ai/` is ignored). Link files with paths the editor can open. Brief: no praise, no restating the PR.

**Todo order:** for each behaviour Fix: replicate failing test → product fix → (next pair) → test gate → plan conformance → Bugbot gate → format → ship.

```markdown
# PR plan {KEY} — PR #{number}

**Status:** draft | approved
**PR:** {url}
**Branch:** {headRefName} → {baseRefName}
**Head:** {sha at plan time}
**Issue plan:** {path to the approved *-issue-plan.md | none}
**Source:** emporix-pr plan — {ISO timestamp}

## Triage

| ID | Source | Location | Severity | Summary | Class | Plan impact | Thread |
|---|---|---|---|---|---|---|---|
| H1 | {login} | `path:L` | — | … | Fix | none | {thread id} |
| C1 | copilot | `path:L` (previously missed) | medium | … | Fix | planned behaviour: {Scenario n} | none |
| S1 | sonar | `path:L` / `rule` | major | … | Fix | none | {thread id} |
| C2 | copilot | `summary` | — | … | Question | — | none |

## Fixes

### {id} — {title}

- Comment: {ID(s)} — {one line of the ask}
- Problem: …
- Replicate first (`{id}-failing-test`): {test file / scenario that is red on HEAD}
- Change (`{id}`): {concrete product change}
- Confirm: that test green; planned behaviour {scenario / requirement} unchanged

## Out of scope / Disagree / Questions

- {ID} — {class} — {reply to post}

## Test gate (required — local, full)

`test-gate.md`. Commands: {exact commands from AGENTS.md Tests + validation.commands}. Unit **and** integration when both exist. Green before the conformance gate and Bugbot; green again before ship when files changed after the last green run. CI alone does not count.

## Plan conformance (required — hard stop on deviation)

`plan-conformance.md`. Diff of this apply vs the PR head at plan time. Every hunk traceable to a triage row; no planned behaviour weakened; blast radius inside the issue plan. Expected watch points: {rows with non-none plan impact, or "none"}. A deviation stops with "we will deviate out of the plan" until the user accepts or rejects.

## Bugbot gate (required — review loop)

`bugbot.md`. Bugbot on the uncommitted diff, at most 5 runs, until no HIGH / MEDIUM. Fix inside this plan's surface, re-run the full suite, run again. Cap with leftovers → stop, no ship.

## Format (last code step)

`AGENTS.md` Commands → Format on edited files only. Files rewritten → re-run the full suite.

## Ship

`resolve-and-ship.md`. Ship gate: full suite green + Bugbot clean + conformance clean or accepted. Then `emporix-feature pr {KEY}` (re-ship), then reply + resolve threads with the pushed SHA.

## Todos

- [ ] {id}-failing-test — {red test}
- [ ] {id} — {fix}
- [ ] test-gate
- [ ] plan-conformance
- [ ] bugbot-gate
- [ ] format
- [ ] ship
- [ ] reply-resolve
```

## Rules for the body

- One root cause → one `*-failing-test` todo then one fix todo.
- Pure style Nits and docs-only: no `*-failing-test` todo.
- Never omit the gate / format / ship sections or reorder a product fix before its replicate todo.
- `apply` ticks the todos in place as it goes and appends a `## Apply {ISO timestamp}` block at the end (commands run, Bugbot runs, deviations and the user's decision, pushed SHA, threads resolved).
