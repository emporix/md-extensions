#!/usr/bin/env sh
# Behaviour tests for detect-legacy-frontend-rules.sh and the shipped manifest.
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../../.." && pwd)
DETECT="$ROOT/skills/emporix-setup/scripts/detect-legacy-frontend-rules.sh"
M="$ROOT/skills/emporix-setup/references/legacy-frontend-ai-rules.sha256"
fail() { echo "FAIL: $1" >&2; exit 1; }
sha() { if command -v sha256sum >/dev/null 2>&1; then sha256sum "$1"; else shasum -a 256 "$1"; fi | cut -d' ' -f1; }

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

R="$TMP/repo"
mkdir -p "$R/.cursor/rules" "$R/.claude/rules" "$R/.github/skills/contribute-global-rule"
printf '# Core\n' >"$R/.cursor/rules/00-core.mdc"
printf '# Old testing\n' >"$TMP/orig-testing"
printf '# Testing, edited by the team\n' >"$R/.claude/rules/testing.md"
printf '# skill\n' >"$R/.github/skills/contribute-global-rule/SKILL.md"
printf '# Our own rule\n' >"$R/.cursor/rules/orders.mdc"
{
  printf '%s  %s\n' "$(sha "$R/.cursor/rules/00-core.mdc")" .cursor/rules/00-core.mdc
  printf '%s  %s\n' "$(sha "$TMP/orig-testing")" .claude/rules/testing.md
  printf '%s  %s\n' "$(sha "$R/.github/skills/contribute-global-rule/SKILL.md")" .github/skills/contribute-global-rule/SKILL.md
  printf '%s  %s\n' 0000000000000000000000000000000000000000000000000000000000000000 .cursorrules
} >"$TMP/manifest"
EMPORIX_LEGACY_MANIFEST="$TMP/manifest"
export EMPORIX_LEGACY_MANIFEST

printf '%s\n' '{"name":"app","description":"was on frontend-ai-rules","scripts":{"postinstall":"node node_modules/frontend-ai-rules/scripts/sync-rules.js"},"devDependencies":{"frontend-ai-rules":"git+https://github.com/emporix/frontend-ai-rules.git#master"}}' >"$R/package.json"
out=$(sh "$DETECT" "$R")
echo "$out" | grep -qx 'REMOVE .cursor/rules/00-core.mdc' || fail "untouched synced rule not REMOVE: $out"
echo "$out" | grep -qx 'KEEP .claude/rules/testing.md' || fail "edited synced rule not KEEP: $out"
echo "$out" | grep -qx 'REMOVE .github/skills/contribute-global-rule/SKILL.md' || fail "synced skill not REMOVE: $out"
echo "$out" | grep -q 'orders.mdc' && fail "project rule listed: $out"
echo "$out" | grep -q 'cursorrules' && fail "absent file listed: $out"
echo "$out" | grep -qx 'PKG dependency' || fail "dependency not detected: $out"
echo "$out" | grep -qx 'PKG postinstall' || fail "postinstall not detected: $out"

# The package name only in text is not an install
printf '%s\n' '{"name":"app","description":"migrated from frontend-ai-rules"}' >"$R/package.json"
out=$(sh "$DETECT" "$R")
echo "$out" | grep -q '^PKG' && fail "description text matched: $out"

# Clean repo prints nothing
mkdir -p "$TMP/clean"
out=$(sh "$DETECT" "$TMP/clean")
[ -z "$out" ] || fail "clean repo output: $out"

# Missing manifest is an error
EMPORIX_LEGACY_MANIFEST="$TMP/none"
sh "$DETECT" "$TMP/clean" 2>/dev/null && fail "missing manifest accepted"

# Shipped manifest
[ -s "$M" ] || fail "shipped manifest missing or empty"
grep -Evq '^[0-9a-f]{64}  [^ ]+$' "$M" && fail "malformed manifest line"
for p in .cursorrules .claude/CLAUDE.md .github/copilot-instructions.md \
  .cursor/rules/00-core.mdc .claude/rules/00-core.md .github/instructions/00-core.instructions.md \
  .cursor/skills/contribute-global-rule/SKILL.md .claude/skills/contribute-global-rule/SKILL.md \
  .github/skills/contribute-global-rule/SKILL.md; do
  awk -v p="$p" '$2 == p { f = 1 } END { exit !f }' "$M" || fail "manifest lacks $p"
done
awk '$2 ~ /api-calls-preferred/ { f = 1 } END { exit !f }' "$M" && fail "unsynced api-calls-preferred in manifest"

echo "PASS detect-legacy-frontend-rules"
