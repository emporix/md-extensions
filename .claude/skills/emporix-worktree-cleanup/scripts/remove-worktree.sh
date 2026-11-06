#!/usr/bin/env sh
# Remove a linked worktree created for a Jira key. Never the primary worktree.
#
#   remove-worktree.sh --root <checkout> --key KEY [--force] [--delete-branch]
#   remove-worktree.sh --root <checkout> --all-merged [--force] [--delete-branch]
#   remove-worktree.sh --root <checkout> --list
#
# --force: remove even if dirty (still refuses the primary).
# --delete-branch: delete the local branch after remove, only if merged into origin/base.

set -eu

ROOT=""
KEY=""
FORCE=0
DELETE_BRANCH=0
ALL_MERGED=0
LIST_ONLY=0

while [ $# -gt 0 ]; do
  case "$1" in
    --root) ROOT="${2:-}"; shift 2 ;;
    --key) KEY="${2:-}"; shift 2 ;;
    --force) FORCE=1; shift ;;
    --delete-branch) DELETE_BRANCH=1; shift ;;
    --all-merged) ALL_MERGED=1; shift ;;
    --list) LIST_ONLY=1; shift ;;
    -h|--help)
      echo "Usage: remove-worktree.sh --root <dir> (--key KEY | --all-merged | --list) [--force] [--delete-branch]" >&2
      exit 0
      ;;
    *) echo "Unknown argument: $1" >&2; exit 2 ;;
  esac
done

die() { echo "$1" >&2; exit 1; }

[ -n "$ROOT" ] || die "Missing --root"
ROOT=$(cd "$ROOT" && git rev-parse --show-toplevel) || die "Not a git checkout: $ROOT"
PRIMARY=$(git -C "$ROOT" worktree list --porcelain | awk '/^worktree / { print $2; exit }')
[ -n "$PRIMARY" ] || PRIMARY="$ROOT"
BASENAME=$(basename "$PRIMARY")
PARENT=$(dirname "$PRIMARY")
BASE=$(git -C "$ROOT" symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@' || echo main)

key_from_path() {
  leaf=$(basename "$1")
  echo "${leaf#"${BASENAME}-"}"
}

list_linked() {
  git -C "$ROOT" worktree list --porcelain | awk -v primary="$PRIMARY" '
    $1=="worktree" { wt=$2; br="" }
    $1=="branch" { sub(/^refs\/heads\//, "", $2); br=$2 }
    $1=="" && wt!="" && wt!=primary {
      print wt "\t" br
      wt=""
    }
    END {
      if (wt!="" && wt!=primary) print wt "\t" br
    }
  '
}

if [ "$LIST_ONLY" = 1 ]; then
  echo "PRIMARY=$PRIMARY"
  list_linked | while IFS="$(printf '\t')" read -r wt br; do
    [ -n "$wt" ] || continue
    k=$(key_from_path "$wt")
    echo "WORKTREE=$wt"
    echo "BRANCH=${br:-unknown}"
    echo "KEY=${k:-}"
  done
  exit 0
fi

remove_one() {
  wt="$1"
  [ -n "$wt" ] || return 0
  [ "$wt" != "$PRIMARY" ] || die "Refusing to remove the primary worktree: $PRIMARY"
  [ -d "$wt" ] || die "Worktree path missing: $wt"

  branch=$(git -C "$wt" branch --show-current 2>/dev/null || true)
  dirty=$(git -C "$wt" status --porcelain)
  unpushed=0
  if [ -n "$branch" ]; then
    if git -C "$wt" rev-parse --verify "origin/$branch" >/dev/null 2>&1; then
      [ -z "$(git -C "$wt" log --oneline "origin/$branch..HEAD" 2>/dev/null || true)" ] || unpushed=1
    elif git -C "$ROOT" merge-base --is-ancestor "$branch" "origin/$BASE" 2>/dev/null; then
      unpushed=0
    else
      unpushed=1
    fi
  fi

  if [ "$FORCE" != 1 ]; then
    [ -z "$dirty" ] || die "Worktree is dirty: $wt (pass --force after the user confirms)"
    [ "$unpushed" = 0 ] || die "Unpushed commits in $wt (push or pass --force)"
  fi

  echo "REMOVING=$wt"
  echo "BRANCH=${branch:-unknown}"
  if [ "$FORCE" = 1 ]; then
    git -C "$ROOT" worktree remove --force "$wt"
  else
    git -C "$ROOT" worktree remove "$wt"
  fi
  git -C "$ROOT" worktree prune

  if [ "$DELETE_BRANCH" = 1 ] && [ -n "$branch" ]; then
    if git -C "$ROOT" merge-base --is-ancestor "$branch" "origin/$BASE" 2>/dev/null; then
      git -C "$ROOT" branch -d "$branch" || true
      echo "DELETED_BRANCH=$branch"
    else
      echo "BRANCH_NOT_MERGED=$branch"
    fi
  fi
  echo "REMOVED=1"
}

if [ "$ALL_MERGED" = 1 ]; then
  git -C "$ROOT" fetch origin --prune >/dev/null 2>&1 || true
  removed=0
  list_linked | while IFS="$(printf '\t')" read -r wt br; do
    [ -n "$wt" ] || continue
    [ -n "$br" ] || continue
    if git -C "$ROOT" merge-base --is-ancestor "$br" "origin/$BASE" 2>/dev/null; then
      k=$(key_from_path "$wt")
      echo "KEY=${k:-unknown}"
      remove_one "$wt" || echo "SKIP=$wt"
      removed=1
    else
      echo "SKIP_NOT_MERGED=$wt"
    fi
  done
  echo "PRIMARY=$PRIMARY"
  exit 0
fi

[ -n "$KEY" ] || die "Missing --key (or pass --all-merged / --list)"
case "$KEY" in
  [A-Z][A-Z0-9_]*-*[0-9]*) ;;
  *) die "KEY must look like ABC-123" ;;
esac

WT=""
CANDIDATE="$PARENT/${BASENAME}-${KEY}"
if [ -d "$CANDIDATE" ]; then
  WT="$CANDIDATE"
else
  WT=$(git -C "$ROOT" worktree list --porcelain | awk -v key="$KEY" '
    $1=="worktree" { wt=$2 }
    $1=="branch" && index($2, key) { print wt; exit }
  ')
fi

[ -n "$WT" ] || die "No worktree for $KEY under $PARENT"
remove_one "$WT"
echo "PRIMARY=$PRIMARY"
