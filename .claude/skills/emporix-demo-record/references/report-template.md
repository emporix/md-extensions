# Reports

## Plan (hard stop)

```text
Demo plan: .ai/demos/{YYYY-MM-DD}-{slug}-demo-plan.md (draft) | (plan mode) {plan file path}
Story: {audience} — {outcome, one line}
Beats: {n} · ~{seconds} s · start {route} → {end state}
Tenant profile: {alias} · Language: {lang} · {fps} fps
Demo data: none | {count — listed in the file} · Blocking questions: none | {count}
approve · change X · cancel
```

In plan mode drop the last line and call `ExitPlanMode` (`emporix-feature` `references/plan-mode.md`); the approval dialog carries the three choices.

## Demo report (record)

Copy the approved plan to `${DEMOS_DIR}/${RUN_ID}/scenario.md`, then write `${DEMOS_DIR}/${RUN_ID}/report.md`:

```markdown
# Demo recording — {title}

- Recorded: {ISO timestamp}
- Plan: [scenario.md](scenario.md) (approved demo plan)
- Start URL: {safe URL without credentials/query secrets}
- Browser: agent-browser {version}
- Format: WebM ({fps} fps)
- Duration: {seconds or unknown}
- Size: {bytes}
- Dry run: passed
- Sensitive-data check: passed

## Walkthrough
1. …

## Limitations
- {none, or exact limitation}
```

Final chat output:

```text
Demo: {absolute path to demo.webm}
Plan: {absolute path to scenario.md}
Tenant profile: {alias}
Duration: {seconds or unknown}
Status: ready | blocked
Issue: {KEY or none}
Jira comment: {commentId or skipped}
Note: demo.webm attached on Jira. Comment must have no Screenshots section. Local copy: {path}
```

Link the local WebM. Do not claim visual quality or success when the dry run,
recording stop, non-empty check, or sensitive-data check failed.
