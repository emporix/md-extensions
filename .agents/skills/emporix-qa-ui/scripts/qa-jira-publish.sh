#!/usr/bin/env sh
# Upload QA JPEGs to Jira via Buddy HTTP (not MCP), then post the report comment.
# MCP tool calls cannot carry screenshot bytes — do not base64 files into Buddy tools.
#
#   sh qa-jira-publish.sh <ISSUE-KEY> <PASS|FAIL> <artifacts-dir>
#
# Env:
#   EMPORIX_BUDDY_URL    default http://ai-buddy.vpn.emporix.io
#                        (also reads ai-setup.json jira.buddyUrl)
#   EMPORIX_BUDDY_TOKEN  optional Bearer (only if Buddy requires MCP_BEARER_TOKEN)
set -eu

KEY="${1:?Usage: qa-jira-publish.sh <ISSUE-KEY> <PASS|FAIL> <artifacts-dir>}"
VERDICT="${2:?Usage: qa-jira-publish.sh <ISSUE-KEY> <PASS|FAIL> <artifacts-dir>}"
DIR="${3:?Usage: qa-jira-publish.sh <ISSUE-KEY> <PASS|FAIL> <artifacts-dir>}"

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

ROOT=$(pwd)
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)

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

SHRINK="$SCRIPT_DIR/shrink-screenshots.sh"
if [ -f "$SHRINK" ]; then
  sh "$SHRINK" "$DIR" >/dev/null
fi

auth_args() {
  if [ -n "${EMPORIX_BUDDY_TOKEN:-}" ]; then
    echo "-H" "Authorization: Bearer $EMPORIX_BUDDY_TOKEN"
  fi
}

uploaded=0
failed=0
for jpg in "$DIR"/step-*.jpg "$DIR"/ask-*.jpg; do
  [ -f "$jpg" ] || continue
  case "$jpg" in
    *.jpg.b64) continue ;;
  esac
  base=$(basename "$jpg")
  tmp=$(mktemp)
  # shellcheck disable=SC2046
  code=$(curl -sS -o "$tmp" -w "%{http_code}" \
    -X POST \
    -H "Content-Type: image/jpeg" \
    -H "X-Filename: $base" \
    $(auth_args) \
    --data-binary @"$jpg" \
    "$BUDDY/api/jira/issues/$KEY/attachments" || echo "000")
  if [ "$code" = "201" ] || [ "$code" = "200" ]; then
    uploaded=$((uploaded + 1))
    echo "attached $base ($code)" >&2
  else
    failed=$((failed + 1))
    echo "FAILED $base HTTP $code" >&2
    sed -n '1,8p' "$tmp" >&2 || true
  fi
  rm -f "$tmp"
done

if [ "$uploaded" = 0 ]; then
  echo "No JPEGs uploaded. Need step-*.jpg or ask-*.jpg in $DIR. Is Buddy deployed? VPN up?" >&2
  exit 1
fi
if [ "$failed" != 0 ]; then
  echo "Some uploads failed ($failed). Not posting the comment." >&2
  exit 1
fi

body_json=$(mktemp)
if command -v jq >/dev/null 2>&1; then
  jq -n --arg verdict "$VERDICT" --rawfile body "$DIR/report.md" '{verdict:$verdict,body:$body}' >"$body_json"
else
  python3 -c 'import json,sys; print(json.dumps({"verdict":sys.argv[1],"body":open(sys.argv[2],encoding="utf-8").read()}))' "$VERDICT" "$DIR/report.md" >"$body_json"
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
  echo "FAILED to post QA report HTTP $code" >&2
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

echo "uploaded=$uploaded" >&2
