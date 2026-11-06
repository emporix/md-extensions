#!/usr/bin/env sh
# Upload Newman/Postman evidence to Jira via Buddy HTTP (not MCP), then post the report.
# Do not attach report.md, generated environment files (secrets), or
# mockup-*.html (local authoring only — Jira gets the rendered PNGs).
#
#   sh publish-jira-evidence.sh <ISSUE-KEY> <PASS|FAIL> <artifacts-dir> [preamble]
#
# Env:
#   EMPORIX_BUDDY_URL           default http://ai-buddy.vpn.emporix.io
#   EMPORIX_BUDDY_TOKEN         optional Bearer
#   EMPORIX_EVIDENCE_PREAMBLE   default 🤖 emporix-qa-local-api — {VERDICT}
set -eu

KEY="${1:?Usage: publish-jira-evidence.sh <ISSUE-KEY> <PASS|FAIL> <artifacts-dir> [preamble]}"
VERDICT="${2:?Usage: publish-jira-evidence.sh <ISSUE-KEY> <PASS|FAIL> <artifacts-dir> [preamble]}"
DIR="${3:?Usage: publish-jira-evidence.sh <ISSUE-KEY> <PASS|FAIL> <artifacts-dir> [preamble]}"
PREAMBLE_ARG="${4:-}"

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

content_type_for() {
  case "$1" in
    *.html|*.htm) echo "text/html" ;;
    *.json) echo "application/json" ;;
    *.txt) echo "text/plain" ;;
    *.md) echo "text/markdown" ;;
    *.jpg|*.jpeg) echo "image/jpeg" ;;
    *.png) echo "image/png" ;;
    *.webm) echo "video/webm" ;;
    *.mp4) echo "video/mp4" ;;
    *) echo "application/octet-stream" ;;
  esac
}

# Mockup slug folders keep HTML local — only rendered PNGs go to Jira.
skip_all_html=0
for _png in "$DIR"/mockup-*.png; do
  if [ -f "$_png" ]; then
    skip_all_html=1
    break
  fi
done

# Demo folders: attach only the WebM (no screenshots, no scenario.md).
demo_video_only=0
for _vid in "$DIR"/demo.webm "$DIR"/*.webm; do
  if [ -f "$_vid" ]; then
    demo_video_only=1
    break
  fi
done

should_skip() {
  base=$(basename "$1")
  case "$base" in
    report.md|*.postman_environment.json|*.env|*.pem|*.key|mockup-*.html|mockup-*.htm)
      return 0
      ;;
    *.html|*.htm)
      [ "$skip_all_html" = 1 ] && return 0
      ;;
    *.png|*.jpg|*.jpeg|*.gif|*.webp|brief.md|scenario.md|scenario.txt|*.txt|*.md)
      [ "$demo_video_only" = 1 ] && return 0
      ;;
  esac
  echo "$base" | grep -Ei 'secret|token|credential|password|postman_environment' >/dev/null 2>&1
}

BUDDY=$(resolve_buddy)
echo "Buddy: $BUDDY" >&2

auth_args() {
  if [ -n "${EMPORIX_BUDDY_TOKEN:-}" ]; then
    echo "-H" "Authorization: Bearer $EMPORIX_BUDDY_TOKEN"
  fi
}

uploaded=0
failed=0

upload_one() {
  file="$1"
  [ -f "$file" ] || return 0
  if should_skip "$file"; then
    echo "skip $(basename "$file")" >&2
    return 0
  fi
  base=$(basename "$file")
  ctype=$(content_type_for "$base")
  tmp=$(mktemp)
  # shellcheck disable=SC2046
  code=$(curl -sS -o "$tmp" -w "%{http_code}" \
    -X POST \
    -H "Content-Type: $ctype" \
    -H "X-Filename: $base" \
    $(auth_args) \
    --data-binary @"$file" \
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
}

seen=" "
for file in \
  "$DIR"/*.postman_collection.json \
  "$DIR"/*.html \
  "$DIR"/*.png \
  "$DIR"/*.jpg \
  "$DIR"/*.jpeg \
  "$DIR"/brief.md \
  "$DIR"/scenario.md \
  "$DIR"/demo.webm \
  "$DIR"/*.webm \
  "$DIR"/evidence-*.txt
do
  [ -f "$file" ] || continue
  base=$(basename "$file")
  case "$seen" in
    *" $base "*) continue ;;
  esac
  seen="$seen$base "
  upload_one "$file"
done

if [ "$failed" != 0 ]; then
  echo "Some uploads failed ($failed). Not posting the comment." >&2
  exit 1
fi
if [ "$uploaded" = 0 ]; then
  echo "No files uploaded from $DIR; posting the comment only." >&2
fi

if [ -n "$PREAMBLE_ARG" ]; then
  PREAMBLE="$PREAMBLE_ARG"
elif [ -n "${EMPORIX_EVIDENCE_PREAMBLE:-}" ]; then
  PREAMBLE="$EMPORIX_EVIDENCE_PREAMBLE"
else
  PREAMBLE="🤖 emporix-qa-local-api — $VERDICT"
fi
body_json=$(mktemp)
INLINE=true
[ "$demo_video_only" = 1 ] && INLINE=false
if command -v jq >/dev/null 2>&1; then
  jq -n --arg verdict "$VERDICT" --arg preamble "$PREAMBLE" --argjson inline "$INLINE" --rawfile body "$DIR/report.md" \
    '{verdict:$verdict,preamble:$preamble,inlineScreenshots:$inline,body:$body}' >"$body_json"
else
  python3 -c 'import json,sys; print(json.dumps({"verdict":sys.argv[1],"preamble":sys.argv[2],"inlineScreenshots":sys.argv[3]=="true","body":open(sys.argv[4],encoding="utf-8").read()}))' \
    "$VERDICT" "$PREAMBLE" "$INLINE" "$DIR/report.md" >"$body_json"
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
