#!/usr/bin/env sh
# Behaviour tests for ensure-worktree.sh.
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../../.." && pwd)
ENSURE="$ROOT/skills/emporix-feature/scripts/ensure-worktree.sh"
fail() { echo "FAIL: $1" >&2; exit 1; }
field() { printf '%s\n' "$1" | sed -n "s/^$2=//p" | head -n 1; }

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
TMP=$(cd "$TMP" && pwd -P)

# A primary checkout on main with one commit, and an origin to fetch from.
P="$TMP/repo"
git init -q -b main "$P"
git -C "$P" -c user.email=t@example.com -c user.name=t commit -q --allow-empty -m init
git -C "$P" remote add origin "$P"

# New branch → a sibling worktree named after the key is created on it.
out=$(sh "$ENSURE" --root "$P" --branch COP-1-feature --base main --key COP-1)
[ "$(field "$out" CREATED)" = 1 ] || fail "first run should create: $out"
[ "$(field "$out" WORKTREE)" = "$TMP/repo-COP-1" ] || fail "worktree path: $out"
[ "$(field "$out" BRANCH)" = COP-1-feature ] || fail "branch: $out"

# Same branch again → reused, not created.
out=$(sh "$ENSURE" --root "$P" --branch COP-1-feature --base main --key COP-1)
[ "$(field "$out" CREATED)" = 0 ] || fail "second run should reuse: $out"
[ "$(field "$out" WORKTREE)" = "$TMP/repo-COP-1" ] || fail "reused path: $out"

# The key's folder exists but is on another branch → refuse, never hand it out.
git -C "$P" worktree add -q -b COP-2-old "$TMP/repo-COP-2" main
if out=$(sh "$ENSURE" --root "$P" --branch COP-2-new --base main --key COP-2 2>&1); then
  fail "a worktree on another branch must not be reused: $out"
fi
printf '%s\n' "$out" | grep -q 'COP-2-old' || fail "error should name the branch found: $out"
printf '%s\n' "$out" | grep -q 'COP-2-new' || fail "error should name the branch requested: $out"

# Paths with spaces: the sibling is named after the whole primary folder and reused.
S="$TMP/my repo"
git init -q -b main "$S"
git -C "$S" -c user.email=t@example.com -c user.name=t commit -q --allow-empty -m init
git -C "$S" remote add origin "$S"
out=$(sh "$ENSURE" --root "$S" --branch COP-3-feature --base main --key COP-3)
[ "$(field "$out" PRIMARY)" = "$S" ] || fail "primary with a space: $out"
[ "$(field "$out" WORKTREE)" = "$TMP/my repo-COP-3" ] || fail "worktree with a space: $out"
out=$(sh "$ENSURE" --root "$S" --branch COP-3-feature --base main --key COP-3)
[ "$(field "$out" CREATED)" = 0 ] || fail "reuse with a space: $out"
[ "$(field "$out" WORKTREE)" = "$TMP/my repo-COP-3" ] || fail "reused path with a space: $out"

# --base auto (ai-setup.json's default baseBranch) means the remote default, never origin/auto.
out=$(sh "$ENSURE" --root "$P" --branch COP-3-auto --base auto --key COP-3)
[ "$(field "$out" CREATED)" = 1 ] || fail "--base auto should create from the default branch: $out"
[ "$(field "$out" BRANCH)" = COP-3-auto ] || fail "--base auto branch: $out"

echo "ensure-worktree.test.sh: ok"
