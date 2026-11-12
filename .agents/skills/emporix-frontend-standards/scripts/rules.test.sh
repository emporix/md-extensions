#!/usr/bin/env sh
# Checks the bundled frontend rules: set, frontmatter, index, dedup edits.
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../../.." && pwd)
DIR="$ROOT/skills/emporix-frontend-standards"
R="$DIR/references/rules"
fail() { echo "FAIL: $1" >&2; exit 1; }

expected="api-data core e2e-test-ids emporix-component-library i18n module-federation npm-dependencies primereact testing ui-components"
[ -d "$R" ] || fail "missing $R"
got=$(cd "$R" && ls -- *.md | sed 's/\.md$//' | LC_ALL=C sort | tr '\n' ' ' | sed 's/ $//')
[ "$got" = "$expected" ] || fail "rule set: $got"

# SKILL.md table names must match the rule files (no extras, no missing).
table=$(awk -F'[|`]' '
  /^\| `core` / { t = 1 }
  t && /^\| `[^`]+` / { gsub(/ /, "", $3); print $3 }
  t && /^$/ { exit }
' "$DIR/SKILL.md" | LC_ALL=C sort | tr '\n' ' ' | sed 's/ $//')
[ "$table" = "$expected" ] || fail "SKILL.md table: $table"

# frontend-rules.md base + optional names must exist as rule files.
for r in core ui-components emporix-component-library testing e2e-test-ids api-data npm-dependencies i18n primereact module-federation; do
  [ -f "$R/$r.md" ] || fail "frontend-rules.md references missing rule: $r"
done

for r in $expected; do
  f="$R/$r.md"
  [ "$(sed -n 2p "$f")" = "name: $r" ] || fail "$r: line 2 must be 'name: $r'"
  d=$(awk 'NR > 1 && /^---$/ { exit } /^description: / { sub(/^description: /, ""); print }' "$f")
  [ -n "$d" ] || fail "$r: missing description"
  case "$d" in *": "*) fail "$r: description contains ': '" ;; esac
  grep -Fq "| \`$r\` |" "$DIR/SKILL.md" || fail "$r missing from the SKILL.md rule table"
done

# Library contribution workflow: bundled files, listed in SKILL.md, and every
# rule link to it resolves.
L="$DIR/references/library"
for f in workflow conventions api-calls component-library release consumer; do
  [ -f "$L/$f.md" ] || fail "missing library/$f.md"
  grep -Fq "| \`$f.md\` |" "$DIR/SKILL.md" || fail "library/$f.md missing from the SKILL.md library table"
done
for f in $(grep -oh '\$RULES_ROOT/\.\./library/[a-z-]*\.md' "$R"/*.md | sed 's#.*/##' | sort -u); do
  [ -f "$L/$f" ] || fail "rule links missing library/$f"
done
grep -q 'library/workflow.md' "$R/api-data.md" || fail "api-data must link the library workflow"
grep -q 'library/workflow.md' "$R/emporix-component-library.md" || fail "emporix-component-library must link the library workflow"
grep -rq 'emporix-library-contribute' "$DIR/SKILL.md" "$DIR/references" "$ROOT/skills/emporix-setup" "$ROOT/README.md" && fail "stale emporix-library-contribute reference"

grep -qx 'always: true' "$R/core.md" || fail "core must be always-on"
grep -qx 'requires: primereact' "$R/primereact.md" || fail "primereact requires"
grep -qx 'requires: @originjs/vite-plugin-federation' "$R/module-federation.md" || fail "module-federation requires"

# Frontmatter paths / requires must match the SKILL.md table columns.
check_paths() {
  r=$1
  want=$2
  got=$(awk 'NR > 1 && /^---$/ { exit } /^paths: / { sub(/^paths: /, ""); print }' "$R/$r.md")
  [ "$got" = "$want" ] || fail "$r: paths want $want got $got"
}
check_paths ui-components '["src/components/**", "src/pages/**"]'
check_paths emporix-component-library '["src/**/*.tsx"]'
check_paths testing '["**/*.test.ts", "**/*.test.tsx"]'
check_paths e2e-test-ids '["src/**/*.tsx"]'
check_paths api-data '["src/api/**", "**/*.api.ts"]'
check_paths npm-dependencies '["**/package.json", "**/yarn.lock", "**/package-lock.json"]'
check_paths i18n '["src/translations/**"]'
check_paths primereact '["src/**/*.tsx"]'
check_paths module-federation '["**/RemoteComponent.tsx", "**/vite.config.ts", "**/main.tsx"]'

grep -q 'Global rules feedback' "$R/core.md" && fail "core still has the feedback priority"
grep -q 'Minimal diff' "$R/core.md" && fail "core still has Minimal diff"
grep -q 'npm run lint' "$R/core.md" && fail "core still lists quality gate commands"
grep -q 'Write or update tests in the same change' "$R/testing.md" && fail "testing still has the generic tests rule"
grep -q 'frontend-ai-rules' "$R"/*.md && fail "a rule still mentions frontend-ai-rules"
grep -Eq '00-core|contributing-global-rules' "$R"/*.md && fail "stale FE rule name"
grep -q 'commit-with-validation' "$R"/*.md && fail "commit-with-validation still referenced"

echo "PASS rules"
