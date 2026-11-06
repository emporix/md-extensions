# Native agent-browser recording

The approved demo plan (`references/plan.md`) is the script: its beats, pauses, start URL, reset, and tenant profile alias. Use the **same** browser session that passed the dry run. Authentication and
initial navigation happen **before** recording. The pinned CLI is
**v0.38.2** (`qa-browser.sh`). That build records the active tab in place:
no new context, no new tab, and no navigation unless you pass a URL.

Do **not** use v0.34.x. That release’s `record start` created a fresh
context, dropped `localStorage` (MD `accessToken`, cockpit `token`), showed
the Tenant / Token gate on camera, and a following `reload` stopped the
encoder after a few frames.

## Output and cleanup

```bash
RUN_ID="{YYYY-MM-DD-HHmmss}-{slug}"
OUT_DIR="$DEMOS_DIR/$RUN_ID"
VIDEO_PATH="$OUT_DIR/demo.webm"
BROWSER_SESSION="demo-$RUN_ID"
mkdir -p "$OUT_DIR"

RECORDING=0
cleanup() {
  if [ "$RECORDING" = 1 ]; then
    "$BROWSER_COMMAND" --session "$BROWSER_SESSION" record stop --json \
      >/dev/null 2>&1 || true
  fi
  "$BROWSER_COMMAND" --session "$BROWSER_SESSION" close --json \
    >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM
```

If `open` lands on `about:blank` with no interactive elements, leftover
sessions are holding the daemon. `close --all`, then `open` the start URL
again before filling the gate.

```bash
echo "$("$BROWSER_COMMAND" --version 2>/dev/null)" | grep -Fq 0.38.2 \
  || { echo "Need agent-browser 0.38.2. Run: sh \"$SCRIPT\" forget && sh \"$SCRIPT\" ensure" >&2; exit 1; }
```

Authenticate before recording (`references/cockpit-auth.md`):
`check-cockpit-token.sh --tenant {alias}`, `open`, clear storage,
`fill-cockpit-gate.sh --tenant {alias}`, wait for module UI + a successful
API load. Reset to the plan's start URL **in this session** while still
authenticated, following the plan's **Reset** section. Do not `record start` on the Tenant / Token gate.
Do not `fill` a JWT literal.

## Record

Pass **no URL** to `record start` — a URL reloads the tab cold and can
re-run the gate.

```bash
ABS_VIDEO=$(cd "$OUT_DIR" && pwd)/demo.webm
"$BROWSER_COMMAND" --session "$BROWSER_SESSION" record start "$ABS_VIDEO" \
  --fps "$FPS" --json
RECORDING=1
```

Snapshot immediately. If Tenant + Token + Save are the only controls:

- **Stop.** Do not fill the visible Token field. Do not
  `restore-local-qa-session.sh` + `reload` (that kills the 0.34 encoder and
  is unnecessary on 0.38). The CLI is the wrong pin, or auth was never
  applied on this session.

If the module UI from the dry run is still visible, drive only the plan's
beats, with the plan's pauses:

```bash
"$BROWSER_COMMAND" --session "$BROWSER_SESSION" snapshot -i --json
"$BROWSER_COMMAND" --session "$BROWSER_SESSION" click "$ELEMENT_REF" --json
"$BROWSER_COMMAND" --session "$BROWSER_SESSION" wait 1000 --json

"$BROWSER_COMMAND" --session "$BROWSER_SESSION" record stop --json
RECORDING=0
test -s "$ABS_VIDEO"
```

Use `fill`, `select`, keyboard, scrolling, and assertions only as the plan
rehearsed. A beat the plan does not have is not recorded.
Never `fill` the cockpit/MD Token field here — that is `fill-cockpit-gate.sh`
before recording. Refresh refs after every navigation or material DOM change.
Do not `reload` or `open` a URL while recording unless the scenario itself
navigates; keep the hydrated session.

Current `agent-browser` supports WebM and MP4; this skill emits WebM.
`record start` requires ffmpeg with a supported encoder. The preflight
`doctor` / `record --help` check is authoritative for the installed pin.

Optional: `--cursor` for a pointer overlay (hidden from snapshots).

## Verify

```bash
BYTES=$(wc -c <"$ABS_VIDEO" | tr -d ' ')
if command -v ffprobe >/dev/null 2>&1; then
  DURATION=$(ffprobe -v error -show_entries format=duration \
    -of default=noprint_wrappers=1:nokey=1 "$ABS_VIDEO")
else
  DURATION=unknown
fi
```

Reject takes shorter than a few seconds (`duration` under ~2) — that is the
dead-encoder failure mode.

Do **not** judge the take with `ffmpeg -ss` stills — WebM often seeks to the
first keyframe. Decode sequentially:

```bash
FRAMES=$(mktemp -d)
cleanup_with_frames() {
  cleanup
  rm -rf "$FRAMES"
}
trap cleanup_with_frames EXIT INT TERM
ffmpeg -y -i "$ABS_VIDEO" -vf fps=1 "$FRAMES/f-%03d.png" -loglevel error
# inspect first and last extracted frames
```

If those frames show Tenant / Token / Save, **delete** `demo.webm` and the
frames directory. Do not replay a credential-bearing take. If secrets or
customer data may have appeared, delete that take immediately and record a
sanitized one. After a successful inspection, remove `$FRAMES` as well
(the trap also runs on exit).
