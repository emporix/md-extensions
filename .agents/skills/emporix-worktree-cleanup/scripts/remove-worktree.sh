#!/usr/bin/env sh
# Remove a linked worktree created for a Jira key. Never the primary worktree.
#
#   remove-worktree.sh --root <checkout> --key KEY [--force] [--delete-branch] [--merged-head SHA] [--not-cwd]
#   remove-worktree.sh --root <checkout> --path <worktree> [--force] [--delete-branch] [--merged-head SHA] [--not-cwd]
#   remove-worktree.sh --root <checkout> --all-merged [--force] [--delete-branch]
#   remove-worktree.sh --root <checkout> --list
#
# --force: remove even if dirty (still refuses the primary).
# --delete-branch: delete the local branch after remove, only if merged into origin/base.
# --merged-head SHA: the PR head GitHub merged (Merge PR passes it). A worktree whose
#   HEAD is exactly that commit counts as pushed, even after a squash merge and a
#   deleted remote branch. Any other worktree is checked as usual.
# --not-cwd: refuse to remove the worktree the caller's current directory is in
#   (an agent session would lose its own folder). Opt-in: other skills run this
#   script from inside the worktree they remove.
#
# Before removing, every untracked .ai/ file in the worktree (ignored or not:
# git status does not show ignored ones, and git worktree remove deletes them) is
# copied into the primary. A primary file with other content is kept; the copy
# lands beside it as {name}.from-{worktree folder}[-n]. One PRESERVED= line per copy.

set -eu

ROOT=""
KEY=""
FORCE=0
DELETE_BRANCH=0
ALL_MERGED=0
LIST_ONLY=0
MERGED_HEAD=""
NOT_CWD=0
WT_PATH=""
MODES=0

while [ $# -gt 0 ]; do
  case "$1" in
    --root) ROOT="${2:-}"; shift 2 ;;
    --key) KEY="${2:-}"; MODES=$((MODES + 1)); [ -n "$KEY" ] || { echo "--key needs a value" >&2; exit 2; }; shift 2 ;;
    --force) FORCE=1; shift ;;
    --delete-branch) DELETE_BRANCH=1; shift ;;
    --all-merged) ALL_MERGED=1; MODES=$((MODES + 1)); shift ;;
    --list) LIST_ONLY=1; MODES=$((MODES + 1)); shift ;;
    --merged-head) MERGED_HEAD="${2:-}"; shift 2 ;;
    --not-cwd) NOT_CWD=1; shift ;;
    --path) WT_PATH="${2:-}"; MODES=$((MODES + 1)); [ -n "$WT_PATH" ] || { echo "--path needs a value" >&2; exit 2; }; shift 2 ;;
    -h|--help)
      echo "Usage: remove-worktree.sh --root <dir> (--key KEY | --path WORKTREE | --all-merged | --list) [--force] [--delete-branch] [--merged-head SHA] [--not-cwd]" >&2
      exit 0
      ;;
    *) echo "Unknown argument: $1" >&2; exit 2 ;;
  esac
done

die() { echo "$1" >&2; exit 1; }

[ -n "$ROOT" ] || die "Missing --root"
# Exactly one target mode, given once: never pick one silently
# (--all-merged --path X must not remove all; --key A --key B must not drop A).
[ "$MODES" -le 1 ] || { echo "Pass only one of --key, --path, --all-merged, --list, once" >&2; exit 2; }
ROOT=$(cd "$ROOT" && git rev-parse --show-toplevel) || die "Not a git checkout: $ROOT"
# Porcelain lines are "worktree <path>" and "branch <ref>"; paths may contain spaces.
PRIMARY=$(git -C "$ROOT" worktree list --porcelain | awk '/^worktree / { print substr($0, 10); exit }')
[ -n "$PRIMARY" ] || PRIMARY="$ROOT"
PRIMARY_REAL=$(cd "$PRIMARY" && pwd -P)
BASENAME=$(basename "$PRIMARY")
PARENT=$(dirname "$PRIMARY")
BASE=$(git -C "$ROOT" symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@' || echo main)

key_from_path() {
  leaf=$(basename "$1")
  echo "${leaf#"${BASENAME}-"}"
}

list_linked() {
  git -C "$ROOT" worktree list --porcelain | awk -v primary="$PRIMARY" '
    /^worktree / { wt=substr($0, 10); br="" }
    /^branch / { br=substr($0, 8); sub(/^refs\/heads\//, "", br) }
    $0=="" && wt!="" && wt!=primary {
      print wt "\t" br
      wt=""
    }
    END {
      if (wt!="" && wt!=primary) print wt "\t" br
    }
  '
}

# Sets DIRTY (0/1) and UNPUSHED (0/1) for worktree $1 on branch $2. A git status
# that fails reads as dirty, so nothing is removed without --force.
worktree_state() {
  if st=$(git -C "$1" status --porcelain 2>/dev/null); then
    if [ -n "$st" ]; then DIRTY=1; else DIRTY=0; fi
  else
    DIRTY=1
  fi
  UNPUSHED=0
  merged=""
  [ -z "$MERGED_HEAD" ] || merged=$(git -C "$ROOT" rev-parse --verify --quiet "$MERGED_HEAD^{commit}" 2>/dev/null || true)
  if [ -n "$merged" ] && [ "$(git -C "$1" rev-parse HEAD 2>/dev/null || true)" = "$merged" ]; then
    UNPUSHED=0
  elif [ -z "$2" ]; then
    # Detached HEAD: pushed only when base already contains it.
    git -C "$1" merge-base --is-ancestor HEAD "origin/$BASE" 2>/dev/null || UNPUSHED=1
  elif git -C "$1" rev-parse --verify "origin/$2" >/dev/null 2>&1; then
    [ -z "$(git -C "$1" log --oneline "origin/$2..HEAD" 2>/dev/null || true)" ] || UNPUSHED=1
  elif git -C "$ROOT" merge-base --is-ancestor "$2" "origin/$BASE" 2>/dev/null; then
    UNPUSHED=0
  else
    UNPUSHED=1
  fi
}

if [ "$LIST_ONLY" = 1 ]; then
  echo "PRIMARY=$PRIMARY"
  list_linked | while IFS="$(printf '\t')" read -r wt br; do
    [ -n "$wt" ] || continue
    k=$(key_from_path "$wt")
    worktree_state "$wt" "$br"
    echo "WORKTREE=$wt"
    echo "BRANCH=${br:-unknown}"
    echo "KEY=${k:-}"
    echo "DIRTY=$DIRTY"
    echo "UNPUSHED=$UNPUSHED"
  done
  exit 0
fi

# True when no directory between the primary and $1's parent is a symlink, so
# mkdir -p and cp cannot write outside the primary.
inside_primary() {
  d=$(dirname "$1")
  while [ ! -e "$d" ] && [ ! -L "$d" ]; do d=$(dirname "$d"); done
  [ ! -L "$d" ] || return 1
  real=$(cd "$d" 2>/dev/null && pwd -P) || return 1
  [ "$real" = "$PRIMARY_REAL${d#"$PRIMARY"}" ]
}

# Copy the untracked .ai/ files of worktree $1 into the primary. Returns 1 when
# any file could not be listed or copied, so the caller removes nothing.
preserve_ai() {
  pwt="$1"
  [ -d "$pwt/.ai" ] || return 0
  leaf=$(basename "$pwt")
  # -z: names are never C-quoted. Through a file, so a failing git is seen (a pipe
  # would report tr's status). POSIX sh cannot read NUL-separated names, so a name
  # with a newline is refused (nothing removed) instead of split into wrong paths.
  listing=$(mktemp) || return 1
  if ! git -C "$pwt" ls-files -z --others -- .ai > "$listing"; then rm -f "$listing"; return 1; fi
  if [ "$(tr -cd '\n' < "$listing" | wc -c)" -ne 0 ]; then
    echo "A .ai file name in $pwt contains a newline; rename it, then retry" >&2
    rm -f "$listing"
    return 1
  fi
  files=$(tr '\0' '\n' < "$listing")
  rm -f "$listing"
  [ -n "$files" ] || return 0
  printf '%s\n' "$files" | {
    status=0
    while IFS= read -r rel; do
      [ -n "$rel" ] || continue
      src="$pwt/$rel"
      if [ -L "$src" ]; then
        echo "SKIPPED_LINK=$rel"
        continue
      fi
      dest="$PRIMARY/$rel"
      # -L too: a dangling symlink is "absent" to -e, and cp would write through it.
      if [ -e "$dest" ] || [ -L "$dest" ]; then
        [ ! -L "$dest" ] && cmp -s "$src" "$dest" && continue
        cand="$dest.from-$leaf"
        n=2
        same=0
        while [ -e "$cand" ] || [ -L "$cand" ]; do
          if [ ! -L "$cand" ] && cmp -s "$src" "$cand"; then same=1; break; fi
          cand="$dest.from-$leaf-$n"
          n=$((n + 1))
        done
        [ "$same" = 0 ] || continue
        dest="$cand"
      fi
      if ! inside_primary "$dest"; then
        echo "PRESERVE_FAILED=$rel (a directory on its path in the primary is a symlink)" >&2
        status=1
      elif mkdir -p "$(dirname "$dest")" && cp -p "$src" "$dest"; then
        echo "PRESERVED=${dest#"$PRIMARY/"}"
      else
        echo "PRESERVE_FAILED=$rel" >&2
        status=1
      fi
    done
    exit "$status"
  }
}

# Returns 1 (never exits) on a refusal, so --all-merged can go on to the next one.
remove_one() {
  wt="$1"
  [ -n "$wt" ] || return 0
  if [ "$wt" = "$PRIMARY" ]; then echo "Refusing to remove the primary worktree: $PRIMARY" >&2; return 1; fi
  if [ ! -d "$wt" ]; then echo "Worktree path missing: $wt" >&2; return 1; fi
  if [ "$NOT_CWD" = 1 ]; then
    wtp=$(cd "$wt" && pwd -P)
    case "$(pwd -P)/" in
      "$wtp/"*) echo "Refusing to remove the worktree this command runs in: $wt (leave the session's folder first, or keep the worktree)" >&2; return 1 ;;
    esac
  fi

  branch=$(git -C "$wt" branch --show-current 2>/dev/null || true)
  worktree_state "$wt" "$branch"

  if [ "$FORCE" != 1 ]; then
    if [ "$DIRTY" = 1 ]; then echo "Worktree is dirty: $wt (pass --force after the user confirms)" >&2; return 1; fi
    if [ "$UNPUSHED" = 1 ]; then echo "Unpushed commits in $wt (push or pass --force)" >&2; return 1; fi
  fi

  if ! preserve_ai "$wt"; then
    echo "Could not preserve the .ai files of $wt; nothing removed" >&2
    return 1
  fi
  echo "REMOVING=$wt"
  echo "BRANCH=${branch:-unknown}"
  if [ "$FORCE" = 1 ]; then
    git -C "$ROOT" worktree remove --force "$wt" || return 1
  else
    git -C "$ROOT" worktree remove "$wt" || return 1
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
  list_linked | while IFS="$(printf '\t')" read -r wt br; do
    [ -n "$wt" ] || continue
    [ -n "$br" ] || continue
    if git -C "$ROOT" merge-base --is-ancestor "$br" "origin/$BASE" 2>/dev/null; then
      k=$(key_from_path "$wt")
      echo "KEY=${k:-unknown}"
      remove_one "$wt" || echo "SKIP=$wt"
    else
      echo "SKIP_NOT_MERGED=$wt"
    fi
  done
  echo "PRIMARY=$PRIMARY"
  exit 0
fi

# --path: exactly this linked worktree (the one a caller listed and the user confirmed).
if [ -n "$WT_PATH" ]; then
  WT_PATH=$(cd "$WT_PATH" 2>/dev/null && pwd -P) || die "Worktree path missing: $WT_PATH"
  match=""
  while IFS="$(printf '\t')" read -r wt br; do
    [ -n "$wt" ] || continue
    [ "$(cd "$wt" 2>/dev/null && pwd -P)" = "$WT_PATH" ] && match="$wt"
  done <<EOF_LIST
$(list_linked)
EOF_LIST
  [ -n "$match" ] || die "Not a linked worktree of $PRIMARY: $WT_PATH"
  remove_one "$match" || exit 1
  echo "PRIMARY=$PRIMARY"
  exit 0
fi

[ -n "$KEY" ] || die "Missing --key (or pass --path / --all-merged / --list)"
case "$KEY" in
  [A-Z][A-Z0-9_]*-*[0-9]*) ;;
  *) die "KEY must look like ABC-123" ;;
esac

WT=""
CANDIDATE="$PARENT/${BASENAME}-${KEY}"
if [ -d "$CANDIDATE" ]; then
  WT="$CANDIDATE"
else
  # The branch is the key itself or starts with "{KEY}-" (COP-1 never matches COP-10-x).
  WT=$(git -C "$ROOT" worktree list --porcelain | awk -v key="$KEY" '
    /^worktree / { wt=substr($0, 10) }
    /^branch / {
      br=substr($0, 8); sub(/^refs\/heads\//, "", br)
      if (br == key || substr(br, 1, length(key) + 1) == key "-") { print wt; exit }
    }
  ')
fi

[ -n "$WT" ] || die "No worktree for $KEY under $PARENT"
remove_one "$WT" || exit 1
echo "PRIMARY=$PRIMARY"
