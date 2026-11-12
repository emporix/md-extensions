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

# The file is written atomically and leaves no temp files.
ls -a "$(dirname "$EMPORIX_SETTINGS_FILE")" | grep -q '\.tmp\.' && fail "temp file left"

echo "local-settings.test.sh: ok"
