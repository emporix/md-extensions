# Drive the browser

`references/browser-howto.md` first. `qa-browser.sh ensure` already ran.

`RUN_ID` = `{YYYY-MM-DD}-{KEY-or-local}-{HHmm}`.  
`ARTIFACTS_DIR` = `{QA_DIR}/artifacts_{RUN_ID}`.  
`BROWSER_SESSION` = `qa-{RUN_ID}`.

## Order

1. The approved QA plan (`references/plan.md`) is the script: its **Steps** table, its tenant profile alias, its language. `check-cockpit-token.sh --tenant {alias}` already passed when `GATE=1`. Unique `BROWSER_SESSION` (never reuse an old session id).
2. **open** `BASE_URL`.
3. Clear stale auth (necessary; it cannot fix a rewritten or prefixed token):

   ```bash
   "$AGENT_BROWSER_BIN" --session "$BROWSER_SESSION" cookies clear --json
   "$AGENT_BROWSER_BIN" --session "$BROWSER_SESSION" storage local clear --json
   "$AGENT_BROWSER_BIN" --session "$BROWSER_SESSION" storage session clear --json
   "$AGENT_BROWSER_BIN" --session "$BROWSER_SESSION" reload --json
   ```

4. **snapshot**.
5. Token gate: `references/cockpit-auth.md` — `fill-cockpit-gate.sh --tenant {alias}`
   with snapshot refs only. Never `fill` a JWT literal.
   Save, **snapshot** again. No token screenshot. API 401 after a rendered
   dashboard → bad token, not a click bug. An Ory Sign-in page on MD means
   the wrong start command was used — stop and boot `serve:local-qa`.
6. Each plan row in order: interact → snapshot → assert the **Expected** column → screenshot `$ARTIFACTS_DIR/step-NN-<slug>.png` (slug from the plan). Required rows decide the verdict; optional rows are reported but do not fail the run. Do not add rows.
7. Unclear next action → `references/ask-executor.md`.
8. Failure: screenshot, then **close**.
9. **close** this session (`close --json`). Then stop the app (`references/boot.md`). Do not leave the server up.

## Rules

- Snapshot refs only. Stay on `BASE_URL`. Only the plan's steps; a finding outside them is an observation in the report, not a step.
- No tokens in screenshots or the report.
- **PASS** only if every required row passed.
