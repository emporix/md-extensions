#!/usr/bin/env sh
# Create or reuse a linked git worktree for one ticket branch.
# Never checks out that branch in the primary worktree when another branch is
# already there (so a second agent can keep working).
#
#   ensure-worktree.sh --root <checkout> --branch <name> [--base <branch>] [--key KEY]
#
# Prints: PRIMARY= WORKTREE= BRANCH= CREATED=0|1

set -eu

ROOT=""
BRANCH=""
BASE=""
KEY=""

while [ $# -gt 0 ]; do
  case "$1" in
    --root) ROOT="${2:-}"; shift 2 ;;
    --branch) BRANCH="${2:-}"; shift 2 ;;
    --base) BASE="${2:-}"; shift 2 ;;
    --key) KEY="${2:-}"; shift 2 ;;
    -h|--help)
      echo "Usage: ensure-worktree.sh --root <dir> --branch <name> [--base <branch>] [--key KEY]" >&2
      exit 0
      ;;
    *) echo "Unknown argument: $1" >&2; exit 2 ;;
  esac
done

die() { echo "$1" >&2; exit 1; }

# /.ai is gitignored, so git worktree add does not copy it. Point the sibling
# at the primary checkout's local .ai. A directory pattern ".ai/" does not
# match this symlink, so also exclude /.ai in the worktree when the branch
# does not already ignore it.
link_ai() {
  wt="$1"
  [ -n "$wt" ] || return 0
  [ "$wt" != "$PRIMARY" ] || return 0
  [ -d "$PRIMARY/.ai" ] || return 0
  if [ -L "$wt/.ai" ]; then
    :
  elif [ -e "$wt/.ai" ]; then
    return 0
  else
    ln -s "$PRIMARY/.ai" "$wt/"
  fi
  ignore_ai_link "$wt"
}

ignore_ai_link() {
  wt="$1"
  if git -C "$wt" check-ignore -q .ai; then
    return 0
  fi
  exclude=$(git -C "$wt" rev-parse --git-path info/exclude)
  mkdir -p "$(dirname "$exclude")"
  if [ -f "$exclude" ] && grep -qx '/.ai' "$exclude"; then
    return 0
  fi
  if [ -f "$exclude" ] && [ -s "$exclude" ]; then
    if [ "$(tail -c 1 "$exclude" | wc -l)" -eq 0 ]; then
      printf '\n' >> "$exclude"
    fi
  fi
  printf '%s\n' '/.ai' >> "$exclude"
}

[ -n "$ROOT" ] || die "Missing --root"
[ -d "$ROOT" ] || die "Not a directory: $ROOT"
[ -n "$BRANCH" ] || die "Missing --branch"
case "$BRANCH" in
  *[!A-Za-z0-9._/-]* | "" ) die "Unsafe branch name" ;;
esac

ROOT=$(cd "$ROOT" && git rev-parse --show-toplevel) || die "Not a git checkout: $ROOT"

PRIMARY=$(git -C "$ROOT" worktree list --porcelain | awk '/^worktree / { print $2; exit }')
[ -n "$PRIMARY" ] || PRIMARY="$ROOT"

if [ -z "$BASE" ]; then
  BASE=$(git -C "$ROOT" symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@' || true)
  [ -n "$BASE" ] || BASE=main
fi

# Reuse: branch already checked out in some worktree.
EXISTING=$(git -C "$ROOT" worktree list --porcelain | awk -v b="refs/heads/$BRANCH" '
  $1=="worktree" { wt=$2 }
  $1=="branch" && $2==b { print wt; exit }
')
if [ -n "$EXISTING" ]; then
  link_ai "$EXISTING"
  echo "PRIMARY=$PRIMARY"
  echo "WORKTREE=$EXISTING"
  echo "BRANCH=$BRANCH"
  echo "CREATED=0"
  exit 0
fi

BASENAME=$(basename "$PRIMARY")
PARENT=$(dirname "$PRIMARY")
if [ -n "$KEY" ]; then
  DEST="$PARENT/${BASENAME}-${KEY}"
else
  SLUG=$(echo "$BRANCH" | tr '/' '-')
  DEST="$PARENT/${BASENAME}-${SLUG}"
fi

if [ -e "$DEST" ]; then
  if git -C "$DEST" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    link_ai "$DEST"
    echo "PRIMARY=$PRIMARY"
    echo "WORKTREE=$DEST"
    echo "BRANCH=$(git -C "$DEST" branch --show-current)"
    echo "CREATED=0"
    exit 0
  fi
  die "Path exists and is not a git worktree: $DEST"
fi

git -C "$ROOT" fetch origin --prune >/dev/null 2>&1 || true

if git -C "$ROOT" show-ref --verify --quiet "refs/heads/$BRANCH"; then
  git -C "$ROOT" worktree add "$DEST" "$BRANCH"
elif git -C "$ROOT" show-ref --verify --quiet "refs/remotes/origin/$BRANCH"; then
  git -C "$ROOT" worktree add -b "$BRANCH" "$DEST" "origin/$BRANCH"
else
  git -C "$ROOT" worktree add -b "$BRANCH" "$DEST" "origin/$BASE"
fi

link_ai "$DEST"
echo "PRIMARY=$PRIMARY"
echo "WORKTREE=$DEST"
echo "BRANCH=$BRANCH"
echo "CREATED=1"
