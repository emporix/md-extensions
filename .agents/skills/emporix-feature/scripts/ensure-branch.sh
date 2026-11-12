#!/usr/bin/env sh
# Create or checkout a ticket branch in this checkout (no linked worktree).
#
#   ensure-branch.sh --root <checkout> --branch <name> [--base <branch>]
#
# Prints: ROOT= BRANCH= CREATED=0|1
# Refuses a dirty tree that is not already on $BRANCH.
# Refuses if $BRANCH is already checked out in another worktree (use --worktree).

set -eu

ROOT=""
BRANCH=""
BASE=""

while [ $# -gt 0 ]; do
  case "$1" in
    --root) ROOT="${2:-}"; shift 2 ;;
    --branch) BRANCH="${2:-}"; shift 2 ;;
    --base) BASE="${2:-}"; shift 2 ;;
    -h|--help)
      echo "Usage: ensure-branch.sh --root <dir> --branch <name> [--base <branch>]" >&2
      exit 0
      ;;
    *) echo "Unknown argument: $1" >&2; exit 2 ;;
  esac
done

die() { echo "$1" >&2; exit 1; }

[ -n "$ROOT" ] || die "Missing --root"
[ -d "$ROOT" ] || die "Not a directory: $ROOT"
[ -n "$BRANCH" ] || die "Missing --branch"
case "$BRANCH" in
  *[!A-Za-z0-9._/-]* | "" ) die "Unsafe branch name" ;;
esac

ROOT=$(cd "$ROOT" && git rev-parse --show-toplevel) || die "Not a git checkout: $ROOT"

# "auto" is ai-setup.json's default baseBranch: the remote default, like an empty --base.
[ "$BASE" != auto ] || BASE=""
if [ -z "$BASE" ]; then
  BASE=$(git -C "$ROOT" symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@' || true)
  [ -n "$BASE" ] || BASE=main
fi

CURRENT=$(git -C "$ROOT" branch --show-current)
if [ "$CURRENT" = "$BRANCH" ]; then
  echo "ROOT=$ROOT"
  echo "BRANCH=$BRANCH"
  echo "CREATED=0"
  exit 0
fi

EXISTING=$(git -C "$ROOT" worktree list --porcelain | awk -v b="refs/heads/$BRANCH" '
  /^worktree / { wt=substr($0, 10) }
  $1=="branch" && $2==b { print wt; exit }
')
if [ -n "$EXISTING" ] && [ "$EXISTING" != "$ROOT" ]; then
  die "Branch $BRANCH is already checked out in $EXISTING. Use --worktree or work in that folder."
fi

if [ -n "$(git -C "$ROOT" status --porcelain)" ]; then
  die "Working tree is dirty on ${CURRENT:-detached}. Commit, stash, or discard before switching to $BRANCH."
fi

git -C "$ROOT" fetch origin --prune >/dev/null 2>&1 || true

CREATED=0
if git -C "$ROOT" show-ref --verify --quiet "refs/heads/$BRANCH"; then
  git -C "$ROOT" checkout "$BRANCH"
elif git -C "$ROOT" show-ref --verify --quiet "refs/remotes/origin/$BRANCH"; then
  git -C "$ROOT" checkout -b "$BRANCH" --track "origin/$BRANCH"
  CREATED=1
elif git -C "$ROOT" show-ref --verify --quiet "refs/remotes/origin/$BASE"; then
  git -C "$ROOT" checkout -b "$BRANCH" "origin/$BASE"
  CREATED=1
elif git -C "$ROOT" show-ref --verify --quiet "refs/heads/$BASE"; then
  git -C "$ROOT" checkout -b "$BRANCH" "$BASE"
  CREATED=1
else
  die "Cannot create $BRANCH: no origin/$BRANCH, origin/$BASE, or local $BASE"
fi

echo "ROOT=$ROOT"
echo "BRANCH=$BRANCH"
echo "CREATED=$CREATED"
