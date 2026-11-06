# How to run the browser

One path. Full host access on every call (`required_permissions: ["all"]`).

## 1. Resolve the CLI (do not install by hand)

From the product repo root:

```bash
SCRIPT=$(skill_script emporix-qa-ui qa-browser.sh)
sh "$SCRIPT" ensure
```

That script:

- Reuses `.ai/qa/browser-local.json` when `command` is the pinned **v0.38.2** CLI
- Else reuses `~/.cache/agent-tools/agent-browser/v0.38.2/…` and writes the JSON
- Ignores an older cached CLI (v0.34.x `record start` recreates the context and drops localStorage)
- Downloads + `doctor` **only** when the binary is missing (first machine)
- Prints `BROWSER_COMMAND=…` and `BROWSER_NOTES=reused …` or `installed`

Do not run `agent-browser install`, do not paste the descriptor's ensure-installed block, do not run `doctor` after a reuse. If `open` later fails because Chrome is gone: `sh "$SCRIPT" forget && sh "$SCRIPT" ensure` once.

## 2. Drive

```bash
AGENT_BROWSER_BIN="$BROWSER_COMMAND"
RUN_ID="{YYYY-MM-DD}-{KEY}-HHmm"
BROWSER_SESSION="qa-${RUN_ID}"
ARTIFACTS_DIR="{QA_DIR}/artifacts_${RUN_ID}"
mkdir -p "$ARTIFACTS_DIR"

"$AGENT_BROWSER_BIN" --session "$BROWSER_SESSION" open "$BASE_URL" --json
"$AGENT_BROWSER_BIN" --session "$BROWSER_SESSION" snapshot -i --json
"$AGENT_BROWSER_BIN" --session "$BROWSER_SESSION" fill "$ELEMENT_REF" "$VALUE" --json
# Cockpit Token: do not fill a JWT here. Use fill-cockpit-gate.sh (cockpit-auth.md).
"$AGENT_BROWSER_BIN" --session "$BROWSER_SESSION" click "$ELEMENT_REF" --json
# screenshot: absolute path — see descriptor
```

Always `--session` and `--json`. Snapshot refs only.

## 3. close

```bash
"$AGENT_BROWSER_BIN" --session "$BROWSER_SESSION" close --json 2>/dev/null || true
```

## Do not

- Cursor IDE browser, Playwright, user Chrome, cloud browsers
- `skills get`, a second port, an extra `vite build` when `BASE_URL` already answers
- Guess a click — `references/ask-executor.md`
