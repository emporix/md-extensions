# Playbook: brand-readiness

Internal playbook of `emporix-design`. The supervisor does not read this
file; one `generalPurpose` subagent reads it (`references/dispatch.md`). Do
not read the other playbooks. Resolve `DESIGNS_DIR` (`.ai/designs`; source
`emporix-setup/scripts/load-config.sh`) if the supervisor did not pass it.

Temporary, read-only checks whether an app channel can take any brand. No
Figma needed. This playbook is deleted once its checks graduate
(`references/brand-readiness/readiness-model.md`: states, maturity, sunset).
The scripts reuse `scripts/brand/color.mjs`.

## Arguments

- `{target}` (required) — app repo root
- `--channel storefront` — only channel so far
- `--checks R2,R4` — default: all scripted checks
- `--site-themes` — also run R4 under every site theme file (brand range)

## Workflow

`SCRIPTS` = `scripts/brand-readiness/` in this skill; `CONFIG` = `references/brand-readiness/channels/{channel}/{repo}.json`.

1. **Pick the config.** `CONFIG` for the target's repo name. None → stop and
   say a channel config is needed (copy the storefront one as a start).
2. **Run** (read-only; touches nothing outside `.ai/`):
   ```bash
   node SCRIPTS/check.mjs --target {target} --config CONFIG --site-themes \
     --out {target}/${DESIGNS_DIR}/readiness/{yyyymmdd}-{channel}
   ```
   Exit 1 means at least one check is `open`. R2 says whether it was
   verified by the target's compiler or by name only; say which.
3. **Judge**, briefly, what a script cannot:
   - R2 `dynamic`: do the full class names appear elsewhere (works by luck)?
   - R4 `assumed` pairs: is the real background the page?
   - R4 failures in a styleguide page mirror token pairs: count the pair once.
4. **Report** (chat, compact):
   - table: check · state · errors/warnings · tracked ticket item
   - top findings per check with `file:line`
   - under site themes: pairs that fail only with that brand
   - for each `fixed` check: propose its guard (which script or test the
     target should own, where it would run). For each `graduated` check:
     propose deleting it here (script and config entry).
5. **Feed back**, only when asked: new items or state changes for the
   tracking ticket (COP-7095 for the storefront). Do not edit the target's
   code or tests; fixes are the target team's.

## Rules

- Read-only for the target. Never edit components, tokens or tests.
- A check is added only as a script. If it needs judgement every time, it is
  a SKILL.md instruction, not a check.
- When a check's `guard` is set in the config and present in the target,
  the check is `graduated`: say so and suggest removing it here.
