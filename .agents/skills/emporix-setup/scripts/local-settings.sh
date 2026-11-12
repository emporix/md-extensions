#!/usr/bin/env sh
# Read and write the developer's own Emporix settings — one file per machine,
# shared by every repository, never committed:
#   ${EMPORIX_SETTINGS_FILE:-~/.emporix/settings.json}
#
#   local-settings.sh path                  # print the file path
#   local-settings.sh show                  # print the file ({} when missing)
#   local-settings.sh get <dotted.key> [--repo NAME]      # print one value, empty when unset
#   local-settings.sh set <dotted.key> <v> [--repo NAME]  # write one value; empty <v> removes it
#
# --repo NAME (worktree.mode only) reads or writes the override for one
# repository, worktree.repos.<NAME>.mode; NAME is the origin repository name
# and may contain dots.
#
# Known keys (others are refused, so a typo never silently does nothing):
#   worktree.mode  ALWAYS_WORKTREE | WORKTREE_ON_DIRTY_BRANCH | ASK_USER |
#                  IN_PLACE | CURRENT_BRANCH   (references/local-settings.md)

set -eu

FILE="${EMPORIX_SETTINGS_FILE:-$HOME/.emporix/settings.json}"
die() { echo "$1" >&2; exit 1; }
command -v jq >/dev/null 2>&1 || die "jq is required. Install jq, then retry."

jq_path() { # worktree.mode -> ["worktree","mode"]
  printf '%s' "$1" | jq -R -c 'split(".")'
}

read_file() {
  if [ -f "$FILE" ]; then
    jq -e . "$FILE" >/dev/null 2>&1 || die "$FILE is not valid JSON — fix it or delete it."
    cat "$FILE"
  else
    echo '{}'
  fi
}

validate() { # $1 key, $2 value (already normalised)
  case "$1" in
    worktree.mode)
      case "$2" in
        ''|ALWAYS_WORKTREE|WORKTREE_ON_DIRTY_BRANCH|ASK_USER|IN_PLACE|CURRENT_BRANCH) ;;
        *) die "worktree.mode must be ALWAYS_WORKTREE, WORKTREE_ON_DIRTY_BRANCH, ASK_USER, IN_PLACE, or CURRENT_BRANCH (got '$2')." ;;
      esac
      ;;
    *) die "Unknown local setting '$1'. Known: worktree.mode" ;;
  esac
}

# path_for <dotted.key> [repo] -> JSON path; the repo name is one element, dots and all.
path_for() {
  if [ -n "${2:-}" ]; then
    [ "$1" = worktree.mode ] || die "--repo applies to worktree.mode only."
    jq -n -c --arg r "$2" '["worktree","repos",$r,"mode"]'
  else
    jq_path "$1"
  fi
}

# Split a trailing "--repo NAME" off the arguments: sets REPO and ARGC_LEFT.
REPO=""
parse_repo() {
  ARGC_LEFT=$#
  while [ $# -gt 0 ]; do
    if [ "$1" = --repo ]; then
      [ $# -ge 2 ] && [ -n "$2" ] || die "--repo needs a repository name."
      REPO=$2; ARGC_LEFT=$((ARGC_LEFT - 2)); shift 2
    else
      shift
    fi
  done
}

cmd=${1:-}
[ $# -eq 0 ] || shift
case "$cmd" in
  path) echo "$FILE" ;;
  show) read_file | jq . ;;
  get)
    parse_repo "$@"
    [ "$ARGC_LEFT" -eq 1 ] || die "Usage: local-settings.sh get <dotted.key> [--repo NAME]"
    read_file | jq -r --argjson p "$(path_for "$1" "$REPO")" 'getpath($p) // empty'
    ;;
  set)
    parse_repo "$@"
    [ "$ARGC_LEFT" -eq 2 ] || die "Usage: local-settings.sh set <dotted.key> <value> [--repo NAME]"
    key=$1; value=$2
    case "$key" in
      worktree.mode) value=$(printf '%s' "$value" | tr '[:lower:]' '[:upper:]') ;;
    esac
    validate "$key" "$value"
    current=$(read_file)
    path=$(path_for "$key" "$REPO")
    if [ -z "$value" ]; then
      # Drop the key, then a repository entry it leaves empty.
      next=$(printf '%s' "$current" | jq --argjson p "$path" 'delpaths([$p])
        | if (.worktree.repos? | type) == "object" then .worktree.repos |= with_entries(select(.value != {})) else . end')
    else
      next=$(printf '%s' "$current" | jq --argjson p "$path" --arg v "$value" 'setpath($p; $v)')
    fi
    mkdir -p "$(dirname "$FILE")"
    tmp="$FILE.tmp.$$"
    printf '%s\n' "$next" > "$tmp"
    mv "$tmp" "$FILE"
    echo "$key${REPO:+ (repo $REPO)}=${value:-<unset>} in $FILE"
    ;;
  *) die "Usage: local-settings.sh path | show | get <key> [--repo NAME] | set <key> <value> [--repo NAME]" ;;
esac
