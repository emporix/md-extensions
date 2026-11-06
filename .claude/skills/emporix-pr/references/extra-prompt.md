# Extra prompt (wait / loop / stop)

Operator text after the actions (e.g. `and wait for copilot and run 3 times if some issues are found`). Honour intent; do not invent product scope. Prefer **`/emporix-pr auto {pr}`** when the intent is wait + re-run until clean with a 5-cycle cap; use this path for a different N, wait-only, or a stop-before-ship.

## Parse knobs

| Knob | How to read | Default |
|---|---|---|
| `wait` | "wait for copilot / review / sonar" | off unless stated |
| `max_cycles` | "run N times", "up to N", "N rounds" (capped at 5) | 1 if wait-only; else N |
| `only_if_issues` | "if some / any issues are found" | implied when looping |
| `stop_before_ship` | "stop before ship", "let me test", "do not push" | off |
| `watch_timeout` | "wait up to N minutes" | 15 |

`max_cycles` counts full `plan | apply` cycles; the first pipeline is cycle 1.

Example — `plan | apply and wait for copilot and run 3 times if some issues are found`: cycle 1 `plan | apply` + ship → watch → actionable → cycle 2 … up to 3.

## Wait

Same **Watch** as `auto.md`: baseline after the ship, outstanding check immediately and on every poll, clean only on an empty check **plus** a reviewer verdict on `push_sha`. Sonar-only, CI green, empty outstanding, or "no new IDs" is not a verdict. Early exit for **dirty** only (actionable items already visible on the new head). Timeout without a verdict → stop; not clean; do not invent another apply.

## Loop

When `wait` is on, issues remain, and `cycle < max_cycles` → `cycle += 1`, `plan | apply` again (fresh collect, new plan file; pipe approval still holds). Stop when clean, at `max_cycles`, at watch timeout, or when apply stops (gate red, Bugbot cap, rejected deviation, `pr` stage `Ready: no`).

## No-loop extras

- Wait-only (no run / repeat N) → wait once after the pipeline, report clean vs remaining, stop.
- `stop_before_ship` → `apply` ends after the ship gate with `Ready: ship`; the tree stays uncommitted, threads unanswered. Resume later with `/emporix-pr apply` (same plan path): on an unchanged tree it continues at step 8.
- Unrelated ("be brief") → honour when it does not touch a gate. Skipping the test gate, the conformance gate, or Bugbot needs explicit words that name the gate; otherwise keep it. The deviation stop and the ship-through-feature rule cannot be waived by extra text.

## Report

Each cycle: plan path, pushed SHA, wait outcome, actionable count. Final: cycles used, clean or remaining items. Chat only.
