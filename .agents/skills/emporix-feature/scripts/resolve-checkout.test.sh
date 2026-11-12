#!/usr/bin/env sh
# Behaviour tests for resolve-checkout.sh.
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../../.." && pwd)
RESOLVE="$ROOT/skills/emporix-feature/scripts/resolve-checkout.sh"
fail() { echo "FAIL: $1" >&2; exit 1; }
field() { printf '%s\n' "$1" | sed -n "s/^$2=//p" | head -n 1; }

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
TMP=$(cd "$TMP" && pwd -P)

# Never read the developer's real settings.
unset EMPORIX_WORKTREE_MODE || true
export EMPORIX_SETTINGS_FILE="$TMP/settings.json"

P="$TMP/repo"
git init -q -b main "$P"
git -C "$P" -c user.email=t@example.com -c user.name=t commit -q --allow-empty -m init

run() { sh "$RESOLVE" --root "$P" --branch COP-1-feature --base main "$@"; }
expect() { # $1 output, $2 decision, $3 reason
  [ "$(field "$1" DECISION)" = "$2" ] || fail "decision $2 expected: $1"
  [ "$(field "$1" REASON)" = "$3" ] || fail "reason $3 expected: $1"
}

# No setting → caller fallback.
out=$(run); expect "$out" worktree mode
[ "$(field "$out" MODE_SOURCE)" = default ] || fail "source default: $out"
out=$(run --fallback IN_PLACE); expect "$out" in-place default

# Settings file, lower case accepted.
printf '{"worktree":{"mode":"ask_user"}}\n' > "$EMPORIX_SETTINGS_FILE"
out=$(run); expect "$out" ask mode
[ "$(field "$out" MODE)" = ASK_USER ] || fail "mode normalised: $out"
[ "$(field "$out" MODE_SOURCE)" = settings ] || fail "source settings: $out"

# Env wins over the file.
out=$(EMPORIX_WORKTREE_MODE=ALWAYS_WORKTREE run --fallback IN_PLACE); expect "$out" worktree mode
[ "$(field "$out" MODE_SOURCE)" = env ] || fail "source env: $out"

# --force-worktree wins over the mode.
out=$(run --force-worktree); expect "$out" worktree flag

# Unknown values are refused; IN_PLACE is a user value too (branch in this checkout).
if out=$(EMPORIX_WORKTREE_MODE=SOMETIMES run 2>&1); then fail "unknown mode accepted: $out"; fi
out=$(EMPORIX_WORKTREE_MODE=in_place run --fallback ALWAYS_WORKTREE); expect "$out" in-place mode
[ "$(field "$out" MODE_SOURCE)" = env ] || fail "IN_PLACE from env: $out"

# WORKTREE_ON_DIRTY_BRANCH: clean base → in place.
printf '{"worktree":{"mode":"WORKTREE_ON_DIRTY_BRANCH"}}\n' > "$EMPORIX_SETTINGS_FILE"
out=$(run); expect "$out" in-place clean-base

# … clean base, but another repository of the ticket needs a worktree → worktree too.
out=$(run --group-worktree); expect "$out" worktree other-repo-not-clean
# … the group flag changes nothing under the other modes.
out=$(EMPORIX_WORKTREE_MODE=ASK_USER run --group-worktree); expect "$out" ask mode

# … uncommitted changes on base → worktree.
echo x > "$P/file.txt"
out=$(run); expect "$out" worktree uncommitted-changes
[ "$(field "$out" DIRTY)" = 1 ] || fail "dirty flag: $out"
rm "$P/file.txt"

# … on another branch → worktree.
git -C "$P" checkout -q -b COP-9-other
out=$(run); expect "$out" worktree not-on-base
[ "$(field "$out" CURRENT)" = COP-9-other ] || fail "current branch: $out"

# Ticket branch already in the main checkout → stays there. ALWAYS_WORKTREE and
# --force-worktree cannot get a worktree for it (git allows one checkout per
# branch), so they say "move" instead of a worktree ensure-worktree.sh cannot make.
git -C "$P" checkout -q -b COP-1-feature
out=$(run); expect "$out" in-place branch-in-checkout
out=$(run --group-worktree); expect "$out" in-place branch-in-checkout
out=$(EMPORIX_WORKTREE_MODE=ALWAYS_WORKTREE run); expect "$out" move branch-in-primary
out=$(run --force-worktree); expect "$out" move branch-in-primary
git -C "$P" checkout -q main

# Ticket branch in a linked worktree → reuse it, whatever the mode (no question).
git -C "$P" worktree add -q "$TMP/repo-COP-1" COP-1-feature
printf '{"worktree":{"mode":"ASK_USER"}}\n' > "$EMPORIX_SETTINGS_FILE"
out=$(run); expect "$out" worktree reuse-worktree
[ "$(field "$out" EXISTING)" = "$TMP/repo-COP-1" ] || fail "existing path: $out"

# Paths with spaces: the primary and the linked worktree are read whole.
S="$TMP/my repo"
git init -q -b main "$S"
git -C "$S" -c user.email=t@example.com -c user.name=t commit -q --allow-empty -m init
git -C "$S" worktree add -q -b COP-1-feature "$TMP/my repo-COP-1" main
out=$(sh "$RESOLVE" --root "$S" --branch COP-1-feature --base main)
expect "$out" worktree reuse-worktree
[ "$(field "$out" PRIMARY)" = "$S" ] || fail "primary with a space: $out"
[ "$(field "$out" EXISTING)" = "$TMP/my repo-COP-1" ] || fail "existing with a space: $out"

# Per-repository override: keyed by origin repository name, wins over worktree.mode,
# loses to the env var.
R="$TMP/folder-name"
git init -q -b main "$R"
git -C "$R" -c user.email=t@example.com -c user.name=t commit -q --allow-empty -m init
git -C "$R" remote add origin git@github.com:emporix/cockpits.git
runr() { sh "$RESOLVE" --root "$R" --branch COP-1-feature --base main "$@"; }
printf '{"worktree":{"mode":"ALWAYS_WORKTREE","repos":{"cockpits":{"mode":"in_place"},"folder-name":{"mode":"ASK_USER"}}}}\n' > "$EMPORIX_SETTINGS_FILE"
out=$(runr); expect "$out" in-place mode
[ "$(field "$out" MODE_SOURCE)" = "settings:repos.cockpits" ] || fail "repo override source: $out"
[ "$(field "$out" REPO)" = cockpits ] || fail "repo from origin: $out"
out=$(EMPORIX_WORKTREE_MODE=ASK_USER runr); expect "$out" ask mode
printf '{"worktree":{"mode":"ASK_USER","repos":{"cockpits":{}}}}\n' > "$EMPORIX_SETTINGS_FILE"
out=$(runr); expect "$out" ask mode
[ "$(field "$out" MODE_SOURCE)" = settings ] || fail "empty repo entry falls through: $out"

# Wrong shapes fail loudly instead of falling back.
printf '{"worktree":{"repos":{"cockpits":"in_place"}}}\n' > "$EMPORIX_SETTINGS_FILE"
if out=$(runr 2>&1); then fail "non-object repo entry accepted: $out"; fi
printf '%s\n' "$out" | grep -q 'worktree.repos."cockpits" must be an object' || fail "repo entry message: $out"
printf '{"worktree":{"repos":["cockpits"]}}\n' > "$EMPORIX_SETTINGS_FILE"
if out=$(runr 2>&1); then fail "non-object repos accepted: $out"; fi
printf '%s\n' "$out" | grep -q 'worktree.repos must be an object' || fail "repos message: $out"
printf '{"worktree":"ALWAYS_WORKTREE"}\n' > "$EMPORIX_SETTINGS_FILE"
if out=$(runr 2>&1); then fail "non-object worktree accepted: $out"; fi
printf '%s\n' "$out" | grep -q 'worktree must be an object' || fail "worktree message: $out"

# --group-worktree pulls only WORKTREE_ON_DIRTY_BRANCH repositories into worktrees.
printf '{"worktree":{"mode":"WORKTREE_ON_DIRTY_BRANCH","repos":{"cockpits":{"mode":"IN_PLACE"}}}}\n' > "$EMPORIX_SETTINGS_FILE"
out=$(runr --group-worktree); expect "$out" in-place mode

# CURRENT_BRANCH: stay on the checked-out branch; never the base, a detached HEAD,
# or another ticket's branch.
printf '{"worktree":{"mode":"CURRENT_BRANCH"}}\n' > "$EMPORIX_SETTINGS_FILE"
git -C "$R" checkout -q -b my-spike
out=$(runr --key COP-1); expect "$out" current mode
[ "$(field "$out" CURRENT)" = my-spike ] || fail "current branch: $out"
git -C "$R" checkout -q -b feat/COP-1-own
out=$(runr --key COP-1); expect "$out" current mode
git -C "$R" checkout -q -b feat/COP-7-other
if out=$(runr --key COP-1 2>&1); then fail "another ticket's branch accepted: $out"; fi
printf '%s\n' "$out" | grep -q 'a branch of COP-7, not COP-1' || fail "other ticket message: $out"
git -C "$R" checkout -q main
if out=$(runr --key COP-1 2>&1); then fail "base branch accepted: $out"; fi
printf '%s\n' "$out" | grep -q 'on the base branch main' || fail "base message: $out"
git -C "$R" checkout -q --detach
if out=$(runr 2>&1); then fail "detached HEAD accepted: $out"; fi
printf '%s\n' "$out" | grep -q 'detached' || fail "detached message: $out"
git -C "$R" checkout -q main
# … a resumed run passes the plan's Working branch: the same branch passes, another
# key-less branch is refused (no key to tell them apart).
git -C "$R" checkout -q -b other-spike
if out=$(runr --key COP-1 --working-branch my-spike 2>&1); then fail "switched working branch accepted: $out"; fi
printf '%s\n' "$out" | grep -q "the plan's Working branch is my-spike" || fail "working branch message: $out"
git -C "$R" checkout -q my-spike
out=$(runr --key COP-1 --working-branch my-spike); expect "$out" current mode
git -C "$R" checkout -q main
# … the ticket branch already checked out here is in place, as in every mode.
git -C "$R" checkout -q -b COP-1-feature
out=$(runr --key COP-1); expect "$out" in-place branch-in-checkout
# … but not when the plan recorded another working branch: the ticket would be rebound.
if out=$(runr --key COP-1 --working-branch my-spike 2>&1); then fail "ticket branch accepted against a recorded working branch: $out"; fi
printf '%s\n' "$out" | grep -q "the plan's Working branch is my-spike" || fail "rebind message: $out"
out=$(runr --key COP-1 --working-branch COP-1-feature); expect "$out" in-place branch-in-checkout
# … --force-worktree is an explicit override and is not checked.
git -C "$R" checkout -q main
out=$(runr --key COP-1 --working-branch my-spike --force-worktree); expect "$out" worktree flag
git -C "$R" checkout -q COP-1-feature
git -C "$R" checkout -q main

# --base auto, no origin/HEAD, default branch "development": still the base.
D="$TMP/dev-only"
git init -q -b development "$D"
git -C "$D" -c user.email=t@example.com -c user.name=t commit -q --allow-empty -m init
if out=$(sh "$RESOLVE" --root "$D" --branch COP-1-x --base auto 2>&1); then fail "CURRENT_BRANCH on development accepted: $out"; fi
printf '%s\n' "$out" | grep -q 'on the base branch development' || fail "development base message: $out"

# Broken settings file → clear error.
echo '{' > "$EMPORIX_SETTINGS_FILE"
if out=$(run 2>&1); then fail "invalid JSON accepted: $out"; fi
printf '%s\n' "$out" | grep -q 'not valid JSON' || fail "error should say invalid JSON: $out"

echo "resolve-checkout.test.sh: ok"
