#!/usr/bin/env sh
# Decide where one ticket branch lives in one repository: a linked sibling
# worktree or the checkout itself. Reads the developer's worktree mode; never
# changes anything (no checkout, no worktree, no fetch).
#
#   resolve-checkout.sh --root <checkout> --branch <name> [--base <branch>]
#                       [--key <Jira key>] [--working-branch <name>]
#                       [--fallback ALWAYS_WORKTREE|IN_PLACE]
#                       [--force-worktree] [--group-worktree]
#
# Worktree mode, first match wins:
#   EMPORIX_WORKTREE_MODE env var                      (MODE_SOURCE=env)
#   .worktree.repos.<REPO>.mode in ${EMPORIX_SETTINGS_FILE:-~/.emporix/settings.json}
#                                                      (MODE_SOURCE=settings:repos.<REPO>)
#   .worktree.mode in the same file                    (MODE_SOURCE=settings)
#   --fallback, the calling skill's default            (MODE_SOURCE=default)
# Values (any case): ALWAYS_WORKTREE | WORKTREE_ON_DIRTY_BRANCH | ASK_USER |
#                    IN_PLACE | CURRENT_BRANCH.
# REPO is the origin repository name (owner/name -> name), else the main
# checkout's folder name. A present worktree / repos / repos.<REPO> value that
# is not an object is an error, never a silent fallback.
#
# CURRENT_BRANCH keeps whatever branch is checked out (DECISION=current) and
# exits 1 instead when HEAD is detached, the branch is the base branch, or
# its name carries another ticket key than --key (feat/COP-7-x is COP-7), or
# it is not --working-branch (the plan's recorded **Working branch:**, passed
# on every resumed run so a switch to another branch is caught).
#
# --group-worktree: multi-repository tickets. A first pass over every
# repository found one that needs a worktree under WORKTREE_ON_DIRTY_BRANCH
# (REASON not-on-base / uncommitted-changes / reuse-worktree), so the mode
# applies to all of them at once: a clean-base repository gets a worktree too
# (REASON=other-repo-not-clean). A branch already in a checkout stays there.
#
# Prints:
#   MODE= MODE_SOURCE= REPO= ROOT= PRIMARY= BASE= CURRENT= DIRTY=0|1 EXISTING=
#   DECISION=worktree|in-place|ask|move|current
#   REASON=flag|reuse-worktree|branch-in-checkout|branch-in-primary|mode|
#          not-on-base|uncommitted-changes|clean-base|other-repo-not-clean|default
#
# DECISION=worktree  → run ensure-worktree.sh
# DECISION=in-place  → run ensure-branch.sh
# DECISION=current   → CURRENT_BRANCH: run nothing; work on CURRENT in ROOT
# DECISION=ask       → ASK_USER: ask the user for this repository, then run one of them
# DECISION=move      → a worktree is wanted (ALWAYS_WORKTREE or --force-worktree)
#                      but the ticket branch is checked out in the main checkout,
#                      so git cannot add one. Ask the user to move it or continue
#                      in place (emporix-feature references/worktree.md
#                      § Branch in the main checkout). Never run ensure-worktree.sh.

set -eu

ROOT=""
BRANCH=""
BASE=""
KEY=""
WORKING=""
FALLBACK="ALWAYS_WORKTREE"
FORCE=0
GROUP=0

while [ $# -gt 0 ]; do
  case "$1" in
    --root) ROOT="${2:-}"; shift 2 ;;
    --branch) BRANCH="${2:-}"; shift 2 ;;
    --base) BASE="${2:-}"; shift 2 ;;
    --key) KEY="${2:-}"; shift 2 ;;
    --working-branch) WORKING="${2:-}"; shift 2 ;;
    --fallback) FALLBACK="${2:-}"; shift 2 ;;
    --force-worktree) FORCE=1; shift ;;
    --group-worktree) GROUP=1; shift ;;
    -h|--help)
      echo "Usage: resolve-checkout.sh --root <dir> --branch <name> [--base <branch>] [--key KEY] [--working-branch NAME] [--fallback ALWAYS_WORKTREE|IN_PLACE] [--force-worktree] [--group-worktree]" >&2
      exit 0
      ;;
    *) echo "Unknown argument: $1" >&2; exit 2 ;;
  esac
done

die() { echo "$1" >&2; exit 1; }
upper() { printf '%s' "$1" | tr '[:lower:]' '[:upper:]'; }

[ -n "$ROOT" ] || die "Missing --root"
[ -d "$ROOT" ] || die "Not a directory: $ROOT"
[ -n "$BRANCH" ] || die "Missing --branch"
case "$BRANCH" in
  *[!A-Za-z0-9._/-]* | "" ) die "Unsafe branch name" ;;
esac

FALLBACK=$(upper "$FALLBACK")
case "$FALLBACK" in
  ALWAYS_WORKTREE|IN_PLACE) ;;
  *) die "Unknown --fallback '$FALLBACK' (ALWAYS_WORKTREE or IN_PLACE)" ;;
esac

# ---------------------------------------------------------------------------
# Repository identity (the per-repository override is keyed by it).
# ---------------------------------------------------------------------------
ROOT=$(cd "$ROOT" && git rev-parse --show-toplevel) || die "Not a git checkout: $ROOT"

PRIMARY=$(git -C "$ROOT" worktree list --porcelain | awk '/^worktree / { print substr($0, 10); exit }')
[ -n "$PRIMARY" ] || PRIMARY="$ROOT"

REPO=$(git -C "$ROOT" remote get-url origin 2>/dev/null | sed -e 's#/*$##' -e 's#\.git$##' -e 's#.*[/:]##' || true)
[ -n "$REPO" ] || REPO=$(basename "$PRIMARY")

# ---------------------------------------------------------------------------
# Worktree mode.
# ---------------------------------------------------------------------------
USER_MODES="ALWAYS_WORKTREE, WORKTREE_ON_DIRTY_BRANCH, ASK_USER, IN_PLACE, or CURRENT_BRANCH"
SETTINGS="${EMPORIX_SETTINGS_FILE:-$HOME/.emporix/settings.json}"
MODE=""
MODE_SOURCE=""
if [ -n "${EMPORIX_WORKTREE_MODE:-}" ]; then
  MODE=$(upper "$EMPORIX_WORKTREE_MODE"); MODE_SOURCE=env
elif [ -f "$SETTINGS" ]; then
  command -v jq >/dev/null 2>&1 || die "jq is required to read $SETTINGS"
  jq -e . "$SETTINGS" >/dev/null 2>&1 || die "$SETTINGS is not valid JSON — fix it or delete it."
  # One read: "!message" for a wrong shape, else "<repo mode>|<default mode>".
  out=$(jq -r --arg r "$REPO" '
    if type != "object" then "!the file must hold a JSON object"
    elif has("worktree") and (.worktree | type) != "object" then "!worktree must be an object like {\"mode\": \"ASK_USER\"}"
    elif (.worktree // {} | has("repos")) and (.worktree.repos | type) != "object" then "!worktree.repos must be an object keyed by repository name"
    elif (.worktree.repos // {} | has($r)) and (.worktree.repos[$r] | type) != "object" then "!worktree.repos.\"\($r)\" must be an object like {\"mode\": \"IN_PLACE\"}, got: \(.worktree.repos[$r] | tojson)"
    else "\(.worktree.repos[$r].mode? // "")|\(.worktree.mode? // "")"
    end' "$SETTINGS")
  case "$out" in "!"*) die "$SETTINGS: ${out#!}" ;; esac
  if [ -n "${out%%|*}" ]; then
    MODE=$(upper "${out%%|*}"); MODE_SOURCE="settings:repos.$REPO"
  elif [ -n "${out#*|}" ]; then
    MODE=$(upper "${out#*|}"); MODE_SOURCE=settings
  fi
fi
if [ -z "$MODE" ]; then
  MODE=$FALLBACK; MODE_SOURCE=default
fi
case "$MODE" in
  ALWAYS_WORKTREE|WORKTREE_ON_DIRTY_BRANCH|ASK_USER|IN_PLACE|CURRENT_BRANCH) ;;
  *) die "Unknown worktree mode '$MODE' (from $MODE_SOURCE). Use $USER_MODES." ;;
esac

# ---------------------------------------------------------------------------
# Repository state.
# ---------------------------------------------------------------------------
[ "$BASE" != auto ] || BASE=""
if [ -z "$BASE" ]; then
  BASE=$(git -C "$ROOT" symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@' || true)
  if [ -z "$BASE" ]; then
    for b in main master develop development; do
      if git -C "$ROOT" show-ref --verify --quiet "refs/heads/$b"; then BASE=$b; break; fi
    done
  fi
  [ -n "$BASE" ] || BASE=main
fi

CURRENT=$(git -C "$ROOT" branch --show-current)
DIRTY=0
[ -z "$(git -C "$ROOT" status --porcelain)" ] || DIRTY=1

EXISTING=$(git -C "$ROOT" worktree list --porcelain | awk -v b="refs/heads/$BRANCH" '
  /^worktree / { wt=substr($0, 10) }
  $1=="branch" && $2==b { print wt; exit }
')

# ---------------------------------------------------------------------------
# Decision.
# ---------------------------------------------------------------------------
if [ -n "$EXISTING" ] && [ "$EXISTING" != "$PRIMARY" ]; then
  DECISION=worktree; REASON=reuse-worktree
elif [ -n "$EXISTING" ]; then
  # The ticket branch is already checked out in the main checkout. Git allows
  # one checkout per branch, so a worktree for it is impossible until the main
  # checkout leaves it. Only a worktree request objects to the branch being there.
  if [ "$FORCE" = 1 ] || [ "$MODE" = ALWAYS_WORKTREE ]; then
    DECISION=move; REASON=branch-in-primary
  else
    DECISION=in-place; REASON=branch-in-checkout
  fi
elif [ "$FORCE" = 1 ]; then
  DECISION=worktree; REASON=flag
else
  case "$MODE" in
    ALWAYS_WORKTREE) DECISION=worktree; REASON=mode ;;
    IN_PLACE)
      if [ "$MODE_SOURCE" = default ]; then REASON=default; else REASON=mode; fi
      DECISION=in-place ;;
    CURRENT_BRANCH)
      [ -n "$CURRENT" ] || die "Worktree mode CURRENT_BRANCH ($MODE_SOURCE): HEAD is detached in $ROOT. Check out a branch, or pass --worktree."
      [ "$CURRENT" != "$BASE" ] || die "Worktree mode CURRENT_BRANCH ($MODE_SOURCE): $ROOT is on the base branch $BASE. Check out a feature branch first, or pass --worktree."
      if [ -n "$KEY" ]; then
        OTHER=$(printf '%s\n' "${CURRENT##*/}" | grep -oE '^[A-Z][A-Z0-9_]+-[0-9]+' || true)
        if [ -n "$OTHER" ] && [ "$OTHER" != "$KEY" ]; then
          die "Worktree mode CURRENT_BRANCH ($MODE_SOURCE): $ROOT is on $CURRENT, a branch of $OTHER, not $KEY. Check out a branch for $KEY, or pass --worktree."
        fi
      fi
      DECISION=current; REASON=mode ;;
    ASK_USER) DECISION=ask; REASON=mode ;;
    WORKTREE_ON_DIRTY_BRANCH)
      if [ "$CURRENT" != "$BASE" ]; then
        DECISION=worktree; REASON=not-on-base
      elif [ "$DIRTY" = 1 ]; then
        DECISION=worktree; REASON=uncommitted-changes
      elif [ "$GROUP" = 1 ]; then
        DECISION=worktree; REASON=other-repo-not-clean
      else
        DECISION=in-place; REASON=clean-base
      fi
      ;;
  esac
fi

# A resumed CURRENT_BRANCH ticket stays on the branch its plan recorded,
# whichever path decided above (current, reuse-worktree, branch-in-checkout).
# Only an explicit --force-worktree is exempt.
if [ "$MODE" = CURRENT_BRANCH ] && [ -n "$WORKING" ] && [ "$FORCE" = 0 ]; then
  if [ "$DECISION" = current ]; then EFFECTIVE=$CURRENT; else EFFECTIVE=$BRANCH; fi
  if [ "$EFFECTIVE" != "$WORKING" ]; then
    die "Worktree mode CURRENT_BRANCH ($MODE_SOURCE): this ticket would continue on $EFFECTIVE, but the plan's Working branch is $WORKING. Check out $WORKING to continue it; nothing was changed."
  fi
fi

echo "MODE=$MODE"
echo "MODE_SOURCE=$MODE_SOURCE"
echo "REPO=$REPO"
echo "ROOT=$ROOT"
echo "PRIMARY=$PRIMARY"
echo "BASE=$BASE"
echo "CURRENT=$CURRENT"
echo "DIRTY=$DIRTY"
echo "EXISTING=$EXISTING"
echo "DECISION=$DECISION"
echo "REASON=$REASON"
