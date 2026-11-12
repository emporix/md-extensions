#!/usr/bin/env sh
# Behaviour tests for ensure-branch.sh.
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../../.." && pwd)
ENSURE="$ROOT/skills/emporix-feature/scripts/ensure-branch.sh"
fail() { echo "FAIL: $1" >&2; exit 1; }
field() { printf '%s\n' "$1" | sed -n "s/^$2=//p" | head -n 1; }

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
TMP=$(cd "$TMP" && pwd -P)

P="$TMP/my repo"
git init -q -b main "$P"
git -C "$P" -c user.email=t@example.com -c user.name=t commit -q --allow-empty -m init
git -C "$P" remote add origin "$P"

# New branch → created in this checkout.
out=$(sh "$ENSURE" --root "$P" --branch COP-1-feature --base main)
[ "$(field "$out" CREATED)" = 1 ] || fail "first run should create: $out"
[ "$(git -C "$P" branch --show-current)" = COP-1-feature ] || fail "checkout should be on the branch"
git -C "$P" checkout -q main

# Branch in a linked worktree whose path has a space → refuse, naming the whole path.
git -C "$P" worktree add -q "$TMP/my repo-COP-1" COP-1-feature
if out=$(sh "$ENSURE" --root "$P" --branch COP-1-feature --base main 2>&1); then
  fail "a branch in another worktree must not be switched to: $out"
fi
printf '%s\n' "$out" | grep -q "in $TMP/my repo-COP-1\." || fail "error should name the whole worktree path: $out"

# --base auto (ai-setup.json's default baseBranch) means the remote default, never origin/auto.
git -C "$P" checkout -q main
out=$(sh "$ENSURE" --root "$P" --branch COP-3-auto --base auto)
[ "$(field "$out" CREATED)" = 1 ] || fail "--base auto should create the branch: $out"
[ "$(git -C "$P" branch --show-current)" = COP-3-auto ] || fail "--base auto should check out the branch"

echo "ensure-branch.test.sh: ok"
