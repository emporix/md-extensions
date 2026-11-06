#!/usr/bin/env sh
# Attach only demo.webm to Jira, then post the demo report with no Screenshots.
# Never upload PNG/JPEG/md/txt. Never call qa-jira-publish.sh.
#
#   sh publish-demo.sh <ISSUE-KEY> <PASS|FAIL> <demo-dir> [preamble]
#
# Env:
#   EMPORIX_BUDDY_URL    default http://ai-buddy.vpn.emporix.io
#   EMPORIX_BUDDY_TOKEN  optional Bearer
set -eu

KEY="${1:?Usage: publish-demo.sh <ISSUE-KEY> <PASS|FAIL> <demo-dir> [preamble]}"
VERDICT="${2:?Usage: publish-demo.sh <ISSUE-KEY> <PASS|FAIL> <demo-dir> [preamble]}"
DIR="${3:?Usage: publish-demo.sh <ISSUE-KEY> <PASS|FAIL> <demo-dir> [preamble]}"
PREAMBLE="${4:-🤖 emporix-demo-record — $VERDICT}"

case "$VERDICT" in
  PASS|FAIL) ;;
  *)
    echo "Verdict must be PASS or FAIL, got: $VERDICT" >&2
    exit 1
    ;;
esac

[ -d "$DIR" ] || {
  echo "Not a directory: $DIR" >&2
  exit 1
}
[ -f "$DIR/report.md" ] || {
  echo "Missing $DIR/report.md" >&2
  exit 1
}
[ -f "$DIR/demo.webm" ] || {
  echo "Missing $DIR/demo.webm — demo publish attaches the WebM only." >&2
  exit 1
}

ROOT=$(pwd)

resolve_buddy() {
  u=""
  if [ -n "${EMPORIX_BUDDY_URL:-}" ]; then
    u=$EMPORIX_BUDDY_URL
  elif [ -f "$ROOT/ai-setup.json" ] && command -v jq >/dev/null 2>&1; then
    u=$(jq -r '.jira.buddyUrl // empty' "$ROOT/ai-setup.json")
  fi
  if [ -z "$u" ] || [ "$u" = "null" ]; then
    u="http://ai-buddy.vpn.emporix.io"
  fi
  u=${u%/}
  case "$u" in
    */api/mcp) u=${u%/api/mcp} ;;
    */mcp) u=${u%/mcp} ;;
  esac
  echo "$u"
}

BUDDY=$(resolve_buddy)
echo "Buddy: $BUDDY" >&2

auth_args() {
  if [ -n "${EMPORIX_BUDDY_TOKEN:-}" ]; then
    echo "-H" "Authorization: Bearer $EMPORIX_BUDDY_TOKEN"
  fi
}

bytes=$(wc -c <"$DIR/demo.webm" | tr -d ' ')
if [ "$bytes" -gt 8388608 ]; then
  echo "demo.webm is ${bytes} bytes; Buddy max is 8MB. Trim the take. Do not attach stills." >&2
  exit 1
fi
if [ "$bytes" -lt 1 ]; then
  echo "demo.webm is empty." >&2
  exit 1
fi

tmp=$(mktemp)
# shellcheck disable=SC2046
code=$(curl -sS -o "$tmp" -w "%{http_code}" \
  -X POST \
  -H "Content-Type: video/webm" \
  -H "X-Filename: demo.webm" \
  $(auth_args) \
  --data-binary @"$DIR/demo.webm" \
  "$BUDDY/api/jira/issues/$KEY/attachments" || echo "000")
if [ "$code" != "201" ] && [ "$code" != "200" ]; then
  echo "FAILED demo.webm HTTP $code" >&2
  sed -n '1,12p' "$tmp" >&2 || true
  rm -f "$tmp"
  exit 1
fi
echo "attached demo.webm ($code)" >&2
rm -f "$tmp"

body_json=$(mktemp)
if command -v jq >/dev/null 2>&1; then
  jq -n --arg verdict "$VERDICT" --arg preamble "$PREAMBLE" --rawfile body "$DIR/report.md" \
    '{verdict:$verdict,preamble:$preamble,inlineScreenshots:false,body:$body}' >"$body_json"
else
  python3 -c 'import json,sys; print(json.dumps({"verdict":sys.argv[1],"preamble":sys.argv[2],"inlineScreenshots":False,"body":open(sys.argv[3],encoding="utf-8").read()}))' \
    "$VERDICT" "$PREAMBLE" "$DIR/report.md" >"$body_json"
fi

resp=$(mktemp)
# shellcheck disable=SC2046
code=$(curl -sS -o "$resp" -w "%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  $(auth_args) \
  --data-binary @"$body_json" \
  "$BUDDY/api/jira/issues/$KEY/qa-report" || echo "000")
rm -f "$body_json"

if [ "$code" != "201" ] && [ "$code" != "200" ]; then
  echo "FAILED to post demo report HTTP $code" >&2
  sed -n '1,20p' "$resp" >&2 || true
  rm -f "$resp"
  exit 1
fi

if command -v jq >/dev/null 2>&1; then
  jq . "$resp"
else
  cat "$resp"
fi
rm -f "$resp"
echo "uploaded=1 (demo.webm only; no screenshots)" >&2
