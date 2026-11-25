#!/usr/bin/env sh
# Behaviour tests for local-settings.sh.
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../../.." && pwd)
LS="$ROOT/skills/emporix-setup/scripts/local-settings.sh"
fail() { echo "FAIL: $1" >&2; exit 1; }

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
export EMPORIX_SETTINGS_FILE="$TMP/sub/settings.json"
run() { sh "$LS" "$@"; }

# Missing file: show prints {}, get prints nothing.
[ "$(run show | tr -d ' \n')" = '{}' ] || fail "show without a file"
[ -z "$(run get worktree.mode)" ] || fail "get without a file"

# Every mode is accepted, in any case, and normalised.
for m in always_worktree WORKTREE_ON_DIRTY_BRANCH ask_user in_place current_branch; do
  run set worktree.mode "$m" >/dev/null
done
[ "$(run get worktree.mode)" = CURRENT_BRANCH ] || fail "normalised mode"
if run set worktree.mode sometimes 2>/dev/null; then fail "unknown mode accepted"; fi

# Per-repository override with --repo, including a name with dots.
run set worktree.mode IN_PLACE --repo cockpits >/dev/null
run set worktree.mode worktree_on_dirty_branch --repo emporix.github.io >/dev/null
[ "$(run get worktree.mode --repo cockpits)" = IN_PLACE ] || fail "repo get"
[ "$(run get worktree.mode --repo emporix.github.io)" = WORKTREE_ON_DIRTY_BRANCH ] || fail "dotted repo get"
[ "$(run get worktree.mode)" = CURRENT_BRANCH ] || fail "default untouched by a repo set"
[ -z "$(run get worktree.mode --repo other)" ] || fail "unset repo is empty"

# Empty value removes the override and the empty entry; other keys survive.
run set worktree.mode '' --repo cockpits >/dev/null
[ "$(jq -r '.worktree.repos | has("cockpits")' "$EMPORIX_SETTINGS_FILE")" = false ] || fail "empty repo entry left"
[ "$(jq -r '.worktree.repos | has("emporix.github.io")' "$EMPORIX_SETTINGS_FILE")" = true ] || fail "other repo dropped"

# --repo only for worktree.mode; it needs a name.
if run set worktree.mode IN_PLACE --repo 2>/dev/null; then fail "--repo without a name accepted"; fi
if run get worktree.mode --repo 2>/dev/null; then fail "get --repo without a name accepted"; fi

# sonar.enabled: true or false in any case; anything else is refused; no --repo.
run set sonar.enabled FALSE >/dev/null
[ "$(run get sonar.enabled)" = false ] || fail "sonar.enabled normalised"
if run set sonar.enabled maybe 2>/dev/null; then fail "sonar.enabled accepted a non-boolean"; fi
if run set sonar.enabled true --repo cockpits 2>/dev/null; then fail "--repo accepted for sonar.enabled"; fi
[ "$(run get worktree.mode)" = CURRENT_BRANCH ] || fail "worktree.mode untouched by sonar.enabled"

# --- Model roles -----------------------------------------------------------
models() { CLAUDECODE= run models "$@" | tr '\n' ' ' | sed 's/ $//'; }

# Built-in defaults resolve before anything is written, for claude-code only.
[ "$(models coder --host claude-code)" = "sonnet opus" ] || fail "default coder"
[ "$(models analyst --host claude-code)" = "opus sonnet" ] || fail "default analyst"
[ -z "$(models coder --host cursor)" ] || fail "no default for cursor"
[ -z "$(models coder)" ] || fail "no host, no default"
[ "$(CLAUDECODE=1 run models reviewer | tr '\n' ' ')" = "opus sonnet haiku " ] || fail "CLAUDECODE=1 selects claude-code"
if run models nobody 2>/dev/null; then fail "unknown role resolved"; fi
if run models coder --host 2>/dev/null; then fail "--host without a name accepted"; fi

# init-models writes only the missing roles and keeps the other settings.
run set models.coder opus >/dev/null
run init-models >/dev/null
[ "$(jq -c .models.coder "$EMPORIX_SETTINGS_FILE")" = '"opus"' ] || fail "init-models overwrote a set role"
[ "$(jq -c '.models.analyst["claude-code"]' "$EMPORIX_SETTINGS_FILE")" = '["opus","sonnet"]' ] || fail "init-models default"
[ "$(run get worktree.mode)" = CURRENT_BRANCH ] || fail "init-models touched worktree"
run init-models | grep -q 'already set' || fail "second init-models is a no-op"

# A slug or an array applies to every host.
[ "$(models coder --host cursor)" = opus ] || fail "slug for every host"
run set models.coder '["sonnet","opus"]' >/dev/null
[ "$(models coder --host anything)" = "sonnet opus" ] || fail "array for every host"

# A host entry on a role set for every host is refused; a host map replaces it.
if run set models.coder.cursor gpt-5.4-medium 2>/dev/null; then fail "host set on a role for every host"; fi
run set models.coder '{"cursor":"gpt-5.4-medium"}' >/dev/null
[ "$(models coder --host cursor)" = gpt-5.4-medium ] || fail "host map entry"
[ "$(models coder --host claude-code)" = "sonnet opus" ] || fail "host map falls back to the default"
run set models.coder.claude-code '["opus"]' >/dev/null
[ "$(models coder --host claude-code)" = opus ] || fail "host entry beats the default"
run set models.coder sonnet >/dev/null
[ "$(jq -c .models.coder "$EMPORIX_SETTINGS_FILE")" = '"sonnet"' ] || fail "slug replaces a host map"

# Bad roles, hosts, and values are refused; --repo is worktree-only.
if run set models.nobody opus 2>/dev/null; then fail "unknown role accepted"; fi
if run set models opus 2>/dev/null; then fail "bare models accepted"; fi
if run set models.coder.Cursor x 2>/dev/null; then fail "bad host accepted"; fi
if run set models.coder '["opus",1]' 2>/dev/null; then fail "non-string array element accepted"; fi
if run set models.coder '[]' 2>/dev/null; then fail "empty array accepted"; fi
if run set models.coder '{"cursor":42}' 2>/dev/null; then fail "number in a host map accepted"; fi
if run set models.coder opus,sonnet 2>/dev/null; then fail "comma list taken as one slug"; fi
if run set models.coder 'opus sonnet' 2>/dev/null; then fail "space list taken as one slug"; fi
if run set models.coder '[bad' 2>/dev/null; then fail "broken JSON accepted"; fi
if run set models.coder. opus 2>/dev/null; then fail "trailing dot accepted"; fi
if run set "models.analyst explorer" opus 2>/dev/null; then fail "multi-word role accepted"; fi
run set models.coder false >/dev/null
[ "$(jq -c .models.coder "$EMPORIX_SETTINGS_FILE")" = '"false"' ] || fail "a bare word is always a slug"
run set models.coder '"opus"' >/dev/null
[ "$(jq -c .models.coder "$EMPORIX_SETTINGS_FILE")" = '"opus"' ] || fail "quoted JSON string"
if run set models.coder.cursor '' 2>/dev/null; then fail "host unset on a role for every host"; fi
[ -z "$(run get models.coder.cursor)" ] || fail "get of a host on a role for every host"
run set models.coder sonnet >/dev/null
if run set models.coder opus --repo cockpits 2>/dev/null; then fail "--repo accepted for models"; fi

# Empty value removes a host entry and prunes the map it leaves empty.
run set models.reviewer '' >/dev/null
run set models.reviewer.cursor gpt-5.4-medium >/dev/null
run set models.reviewer.cursor '' >/dev/null
[ "$(jq -r '.models | has("reviewer")' "$EMPORIX_SETTINGS_FILE")" = false ] || fail "empty host map left"
[ "$(models reviewer --host claude-code)" = "opus sonnet haiku" ] || fail "unset role falls back to the default"

# A malformed stored value is an error, never a silent fallback.
cp "$EMPORIX_SETTINGS_FILE" "$TMP/good.json"
jq '.models.coder = 5' "$TMP/good.json" > "$EMPORIX_SETTINGS_FILE"
if run models coder --host claude-code 2>/dev/null; then fail "malformed role resolved"; fi
echo '{"models":{"coder":5}}' > "$EMPORIX_SETTINGS_FILE"
run init-models >/dev/null 2>&1 || fail "a malformed role blocks init-models"
[ "$(jq -c .models.coder "$EMPORIX_SETTINGS_FILE")" = 5 ] || fail "init-models changed a malformed role"
[ "$(jq -c '.models.analyst["claude-code"]' "$EMPORIX_SETTINGS_FILE")" = '["opus","sonnet"]' ] || fail "init-models skipped other roles"
run init-models 2>&1 >/dev/null | grep -q 'models.coder .* malformed' || fail "init-models warns on a malformed role"
jq '.models = "opus"' "$TMP/good.json" > "$EMPORIX_SETTINGS_FILE"
if run init-models 2>/dev/null; then fail "malformed models block accepted"; fi
# An explicit null is present, so it is malformed, not missing.
echo '{"models":null}' > "$EMPORIX_SETTINGS_FILE"
if run models analyst --host claude-code >/dev/null 2>&1; then fail "null models block resolved"; fi
if run init-models >/dev/null 2>&1; then fail "null models block accepted by init-models"; fi
[ "$(jq -c .models "$EMPORIX_SETTINGS_FILE")" = null ] || fail "init-models replaced a null models block"
if run get models.coder >/dev/null 2>&1; then fail "get read a null models block"; fi
if run set models.coder sonnet >/dev/null 2>&1; then fail "role set on a null models block"; fi
if run set models.coder.cursor x >/dev/null 2>&1; then fail "host set on a null models block"; fi
run models analyst 2>&1 | grep -q 'must be a JSON object' || fail "null models block message"
[ "$(jq -c .models "$EMPORIX_SETTINGS_FILE")" = null ] || fail "a refused set changed a null models block"
echo '{"models":{"coder":null}}' > "$EMPORIX_SETTINGS_FILE"
if run models coder --host claude-code >/dev/null 2>&1; then fail "null role resolved"; fi
out=$(run init-models 2>&1) || fail "a null role blocks init-models"
printf '%s' "$out" | grep -q 'models.coder .* malformed' || fail "init-models warns on a null role"
printf '%s' "$out" | grep -q 'wrote defaults for analyst explorer architect reviewer in' || fail "init-models names the roles it wrote"
[ "$(jq -c .models.coder "$EMPORIX_SETTINGS_FILE")" = null ] || fail "init-models changed a null role"
[ "$(jq -c '.models.analyst["claude-code"]' "$EMPORIX_SETTINGS_FILE")" = '["opus","sonnet"]' ] || fail "a null role made init-models skip other roles"
run set models.coder sonnet >/dev/null || fail "a null role cannot be replaced"
[ "$(jq -c .models.coder "$EMPORIX_SETTINGS_FILE")" = '"sonnet"' ] || fail "role set on a null role"
jq '.models.coder = 5' "$TMP/good.json" > "$EMPORIX_SETTINGS_FILE"
[ "$(models analyst --host claude-code)" = "opus sonnet" ] || fail "a malformed role spoils another role"
echo '{"models":{"analyst":"opus","coder":5}}' > "$EMPORIX_SETTINGS_FILE"
[ "$(run get models.analyst)" = opus ] || fail "a malformed role spoils get of another role"
if run get models.coder >/dev/null 2>&1; then fail "get read a malformed role"; fi
if run get models >/dev/null 2>&1; then fail "get read a models block with a malformed role"; fi
echo '{"models":{"analyst":{"claude-code":"opus"},"coder":5}}' > "$EMPORIX_SETTINGS_FILE"
[ "$(run get models.analyst.claude-code)" = opus ] || fail "a malformed role spoils get of another role's host"
if run get models.coder.claude-code >/dev/null 2>&1; then fail "get read a host of a malformed role"; fi
run set models.analyst.cursor gpt-5.4-medium >/dev/null || fail "a malformed role blocks a host set on another role"
run set models.analyst sonnet >/dev/null || fail "a malformed role blocks a set of another role"
[ "$(jq -c .models "$EMPORIX_SETTINGS_FILE")" = '{"analyst":"sonnet","coder":5}' ] || fail "set of another role touched a malformed role"
run set models.analyst '' >/dev/null || fail "a malformed role blocks an unset of another role"
[ "$(jq -c .models "$EMPORIX_SETTINGS_FILE")" = '{"coder":5}' ] || fail "unset of another role touched a malformed role"
echo '{"models":{"coder":{"cursor":42}}}' > "$EMPORIX_SETTINGS_FILE"
if run set models.coder.claude-code opus >/dev/null 2>&1; then fail "host set into a malformed host map"; fi
[ "$(jq -c .models "$EMPORIX_SETTINGS_FILE")" = '{"coder":{"cursor":42}}' ] || fail "a refused host set changed the file"
jq '.models.coder = 5' "$TMP/good.json" > "$EMPORIX_SETTINGS_FILE"
run set models.coder sonnet >/dev/null || fail "a malformed role cannot be replaced"
jq '.models.coder = 5' "$TMP/good.json" > "$EMPORIX_SETTINGS_FILE"
run set models.coder '' >/dev/null || fail "a malformed role cannot be unset"
jq '.models.coder = 5' "$TMP/good.json" > "$EMPORIX_SETTINGS_FILE"
if run set models.coder.cursor x 2>/dev/null; then fail "host set on a malformed role"; fi
echo '[]' > "$EMPORIX_SETTINGS_FILE"
if run models coder 2>/dev/null; then fail "non-object settings file accepted"; fi
run models coder 2>&1 | grep -q 'not a JSON object' || fail "non-object file message"
cp "$TMP/good.json" "$EMPORIX_SETTINGS_FILE"

# The file is written atomically and leaves no temp files.
ls -a "$(dirname "$EMPORIX_SETTINGS_FILE")" | grep -q '\.tmp\.' && fail "temp file left"

echo "local-settings.test.sh: ok"
