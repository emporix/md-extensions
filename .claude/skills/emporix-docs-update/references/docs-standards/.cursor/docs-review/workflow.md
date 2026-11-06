---
title: Docs Self-Review Workflow
---

# Docs Self-Review Workflow

> **See also:** [guide.md](guide.md) for the full author and maintainer guide (docs-standards, subtree setup, propagation).

## Overview

Single-turn flow with native Cursor Keep/Undo for auto-fixes:

1. **Review** — readonly subagent returns findings (no file writes)
2. **Apply** — parent applies `Auto-fixable: yes` findings in the same turn
3. **Report** — unified chat report: applied changes, remaining decisions, needs more information

## Manual trigger

```
Run docs style self-review for my current changes.
```

Similar phrasing also works (for example `run self review on the changes`).

## Review

1. Parent collects changed docs files and optional task context from this chat (pasted AC/task text, GitHub PR/issue URLs).
2. Readonly subagent scans changed docs against `.style-guide/` and [sufficiency-and-fit.md](sufficiency-and-fit.md).
3. Returns structured findings with:
   - file path + line reference (required for every finding; use `:LINE` or `:START-END` for ranges)
   - severity, lane (`style` | `sufficiency` | `task-fit`), rule, issue, suggested fix
   - `Auto-fixable: yes | no`
   - grammar and spelling findings with corrected text when unambiguous
4. Parent verifies every finding has a line reference before applying or reporting.

The review subagent does not modify files.

## Apply (same turn)

1. Parent immediately applies only `Auto-fixable: yes` findings. No "Yes" confirmation.
2. One `StrReplace` per fix — each appears in Cursor's diff UI.
3. Author accepts (Keep) or rejects (Undo) each change.
4. Sufficiency, task-fit, and structural findings are not auto-applied.

This includes obvious grammar and spelling corrections.

### Lanes

- **Obvious fixes:** applies only findings marked `Auto-fixable: yes` (style/grammar).
- **Reader sufficiency:** always runs; always `Auto-fixable: no`.
- **Task-fit:** runs only when task context is in this chat or the trigger; always `Auto-fixable: no`.
- **Guided structural:** runs only after explicit author confirmation in a follow-up, and applies approved `Reworked structure suggestion` items as targeted section-level edits.

Structural findings remain `Auto-fixable: no` even when a concrete rewrite is provided.

### Stepper conversion example

Invalid pattern:

```md
## Step 1 - Open the storefront
...
## Step 2 - Approve the quote
...
```

Compliant rewrite:

```md
{% stepper %}
{% step %}
#### Open the storefront

...
{% endstep %}

{% step %}
#### Approve the quote

...
{% endstep %}
{% endstepper %}
```

## Unified report

The parent returns one **Docs Self-Review** report:

- **Verdict** and **Ready for peer review** (from remaining open items after apply)
- **Task context:** none (task-fit skipped) or listed sources
- **Applied auto-fixes** — each with `file:line`, what was wrong, and what changed
- **Needs your decision** — remaining items by severity, with `file:line`, issue, and suggested fix
- **Needs more information** — omitted when none
- **Next step** — fix remaining items, optional guided structural apply, or re-run self-review

## Author checklist

- Update docs content.
- Run manual docs style self-review (optionally include task description, AC, or a PR/issue URL in the same chat).
- Read the unified report (`file:line` on every item).
- Use Keep/Undo on each auto-applied edit.
- Manually fix remaining decision items (and supply more information when asked).
- Re-run review after significant changes.
- Submit for peer review when verdict is `pass` or `pass-with-warnings`.

## Hybrid gate rules

- Block only when remaining `critical` findings are present after apply.
- Remaining `major` and `minor` findings are warnings.

## Planned: automatic trigger

After the manual flow is stable, enable automatic **review-only** self-review through project hooks. A stop hook must not apply file edits. See [guide.md](guide.md).
<!-- This will be added at later stage. -->

### Example hook blueprint (not active yet)

```json
{
  "version": 1,
  "hooks": {
    "stop": [
      {
        "type": "prompt",
        "prompt": "If documentation files changed, run a review-only docs style self-review using .cursor/docs-review/subagent-prompt.md and return findings in chat. Do not apply file edits from a stop hook."
      }
    ]
  }
}
```
