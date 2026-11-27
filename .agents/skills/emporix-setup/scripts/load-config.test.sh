#!/usr/bin/env sh
# Behaviour tests for load-config.sh (values read from ai-setup.json).
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../../.." && pwd)
LOADER="$ROOT/skills/emporix-setup/scripts/load-config.sh"
fail() { echo "FAIL: $1" >&2; exit 1; }

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

# Prints BUDDY_SYNC after sourcing the loader in a repo whose ai-setup.json is $1.
N=0
buddy_sync() {
  N=$((N + 1))
  d="$TMP/r$N"
  mkdir -p "$d"
  printf '%s\n' "$1" > "$d/ai-setup.json"
  printf '# Agents\n' > "$d/AGENTS.md"
  printf '# Project\n' > "$d/PROJECT.md"
  (
    set +e
    cd "$d" || exit 1
    EMPORIX_SKILLS_ROOT="$ROOT/skills"
    . "$LOADER" >/dev/null 2>&1
    printf '%s' "${BUDDY_SYNC:-unset}"
  )
}

# buddy.sync=false is the opt-out and must stay false.
got=$(buddy_sync '{"buddy":{"sync":false}}')
[ "$got" = "false" ] || fail "buddy.sync=false read as $got"
# Missing or true means enabled.
[ "$(buddy_sync '{}')" = "true" ] || fail "missing buddy.sync is not true"
[ "$(buddy_sync '{"buddy":{"sync":true}}')" = "true" ] || fail "buddy.sync=true is not true"

echo "load-config.test.sh: PASS"
