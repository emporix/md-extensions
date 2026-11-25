#!/usr/bin/env sh
# Read and write the developer's own Emporix settings — one file per machine,
# shared by every repository, never committed:
#   ${EMPORIX_SETTINGS_FILE:-~/.emporix/settings.json}
#
#   local-settings.sh path                  # print the file path
#   local-settings.sh show                  # print the file ({} when missing)
#   local-settings.sh get <dotted.key> [--repo NAME]      # print one value, empty when unset
#   local-settings.sh set <dotted.key> <v> [--repo NAME]  # write one value; empty <v> removes it
#   local-settings.sh models <role> [--host HOST]         # resolved model list for a role, one per line
#   local-settings.sh init-models                         # write the default model roles that are missing
#
# --repo NAME (worktree.mode only) reads or writes the override for one
# repository, worktree.repos.<NAME>.mode; NAME is the origin repository name
# and may contain dots.
#
# Known keys (others are refused, so a typo never silently does nothing):
#   worktree.mode  ALWAYS_WORKTREE | WORKTREE_ON_DIRTY_BRANCH | ASK_USER |
#                  IN_PLACE | CURRENT_BRANCH   (references/local-settings.md)
#   sonar.enabled  true | false   (emporix-feature sonar-scan; unset = true)
#   models.<role>         a slug, a JSON array of slugs, or a JSON object
#                         {"<host>": slug | [slugs]}
#   models.<role>.<host>  a slug or a JSON array of slugs for one host
#     role: analyst | explorer | architect | coder | reviewer
#     host: claude-code, cursor, … ([a-z0-9-]+)
#
# models resolves, first match wins: models.<role>.<host> → models.<role> when
# it is a slug or an array (every host) → the built-in default for that host
# (claude-code only) → nothing (the calling skill uses its own heuristics).
# Without --host the host is claude-code when CLAUDECODE=1, else none.

set -eu

FILE="${EMPORIX_SETTINGS_FILE:-$HOME/.emporix/settings.json}"
die() { echo "$1" >&2; exit 1; }
command -v jq >/dev/null 2>&1 || die "jq is required. Install jq, then retry."

MODEL_ROLES="analyst explorer architect coder reviewer"
# Built-in defaults, also what init-models writes. Same shape as settings.json.
DEFAULT_MODELS='{
  "analyst":   { "claude-code": ["opus", "sonnet"] },
  "explorer":  { "claude-code": ["sonnet", "haiku"] },
  "architect": { "claude-code": ["opus", "sonnet"] },
  "coder":     { "claude-code": ["sonnet", "opus"] },
  "reviewer":  { "claude-code": ["opus", "sonnet", "haiku"] }
}'
# jq definitions: okslug = one model slug ([A-Za-z0-9._:/-]+, so "opus,sonnet"
# or "opus sonnet" is refused); okval = a slug or a non-empty array of slugs;
# okrole = okval or a non-empty {host: okval} object.
JQ_MODEL_DEFS='def okslug: type == "string" and test("^[A-Za-z0-9._:/-]+$");
  def okval: okslug or (type == "array" and length > 0 and all(.[]; okslug));
  def okhost: test("^[a-z0-9-]+$");
  def okrole: okval
    or (type == "object" and length > 0 and all(to_entries[]; (.key | okhost) and (.value | okval)));
  def list: if type == "string" then [.] else . end;'

jq_path() { # worktree.mode -> ["worktree","mode"]
  printf '%s' "$1" | jq -R -c 'split(".")'
}

read_file() {
  if [ -f "$FILE" ]; then
    jq -e 'type == "object"' "$FILE" >/dev/null 2>&1 || die "$FILE is not a JSON object — fix it or delete it."
    cat "$FILE"
  else
    echo '{}'
  fi
}

write_file() { # $1 = new JSON content
  mkdir -p "$(dirname "$FILE")"
  tmp="$FILE.tmp.$$"
  printf '%s\n' "$1" > "$tmp"
  mv "$tmp" "$FILE"
}

check_role() {
  for _r in $MODEL_ROLES; do
    [ "$_r" = "$1" ] && return 0
  done
  die "Unknown model role '$1'. Known: $MODEL_ROLES"
}

check_host() {
  printf '%s' "$1" | grep -Eq '^[a-z0-9-]+$' || die "Host '$1' must match [a-z0-9-]+ (claude-code, cursor, …)."
}

# A present models block must be an object and every role in it well formed:
# a wrong shape is an error, never a silent fallback.
check_models() { # stdin = settings JSON; $1 = only this role, $2 = skip this role
  _bad=$(jq -r --arg only "${1:-}" --arg skip "${2:-}" "$JQ_MODEL_DEFS"'
    if (has("models") | not) then empty
    elif (.models | type) != "object" then "models"
    else .models | to_entries[] | select(($only == "" or .key == $only) and .key != $skip)
      | select(.value | okrole | not) | "models.\(.key)" end')
  [ "$_bad" != models ] || die "models in $FILE must be a JSON object of roles — fix or remove it in the file."
  [ -z "$_bad" ] || die "$(printf '%s' "$_bad" | head -1) in $FILE must be a slug, an array of slugs, or {\"<host>\": slug | [slugs]} — fix it or unset it."
}

# set models.<role>[.<host>] <value>
set_model() {
  _rest=${1#models.}
  [ "$_rest" != "$1" ] && [ -n "$_rest" ] || die "Use models.<role> or models.<role>.<host> (roles: $MODEL_ROLES)."
  _role=${_rest%%.*}; _host=""
  if [ "$_role" != "$_rest" ]; then
    _host=${_rest#*.}
    [ -n "$_host" ] || die "Use models.<role> or models.<role>.<host> (got '$1')."
  fi
  check_role "$_role"
  [ -z "$_host" ] || check_host "$_host"
  _current=$(read_file)
  # Only the block shape and the role being written are checked, so another malformed
  # role never blocks a write. A role-level set or unset replaces the role, so it may
  # repair a malformed one: only the block shape is checked for it.
  if [ -z "$_host" ]; then printf '%s' "$_current" | check_models "$_role" "$_role"
  else printf '%s' "$_current" | check_models "$_role"; fi
  if [ -n "$_host" ]; then
    printf '%s' "$_current" | jq -e --arg r "$_role" '(.models[$r] | type) as $t | $t == "object" or $t == "null"' >/dev/null \
      || die "models.$_role applies to all hosts; unset it first (set models.$_role '') or set the whole host map on models.$_role."
  fi
  if [ -z "$2" ]; then
    # Drop the key, then a host map or models block it leaves empty.
    _next=$(printf '%s' "$_current" | jq --arg r "$_role" --arg h "$_host" '
      (if $h == "" then del(.models[$r])
       else del(.models[$r][$h]) end)
      | if (.models[$r] | type) == "object" and .models[$r] == {} then del(.models[$r]) else . end
      | if .models == {} then del(.models) else . end')
    write_file "$_next"
    echo "$1=<unset> in $FILE"
    return
  fi
  # A value starting with [ { or " is JSON; anything else is one slug.
  case "$2" in
    \[*|\{*|\"*)
      _json=$(printf '%s' "$2" | jq -c . 2>/dev/null) || die "$1: '$2' is not valid JSON." ;;
    *) _json=$(jq -n -c --arg v "$2" '$v') ;;
  esac
  if [ -z "$_host" ]; then
    printf '%s' "$_json" | jq -e "$JQ_MODEL_DEFS"' okrole' >/dev/null \
      || die "models.$_role must be one slug ([A-Za-z0-9._:/-]), a JSON array of slugs such as '[\"sonnet\",\"opus\"]', or {\"<host>\": slug | [slugs]} (got $_json)."
    # Replaces whatever the role held, a host map included.
    _next=$(printf '%s' "$_current" | jq --arg r "$_role" --argjson v "$_json" '.models[$r] = $v')
  else
    printf '%s' "$_json" | jq -e "$JQ_MODEL_DEFS"' okval' >/dev/null \
      || die "models.$_role.$_host must be one slug ([A-Za-z0-9._:/-]) or a JSON array of slugs such as '[\"sonnet\",\"opus\"]' (got $_json)."
    _next=$(printf '%s' "$_current" | jq --arg r "$_role" --arg h "$_host" --argjson v "$_json" '.models[$r][$h] = $v')
  fi
  write_file "$_next"
  echo "$1=$_json in $FILE"
}

validate() { # $1 key, $2 value (already normalised)
  case "$1" in
    worktree.mode)
      case "$2" in
        ''|ALWAYS_WORKTREE|WORKTREE_ON_DIRTY_BRANCH|ASK_USER|IN_PLACE|CURRENT_BRANCH) ;;
        *) die "worktree.mode must be ALWAYS_WORKTREE, WORKTREE_ON_DIRTY_BRANCH, ASK_USER, IN_PLACE, or CURRENT_BRANCH (got '$2')." ;;
      esac
      ;;
    sonar.enabled)
      case "$2" in
        ''|true|false) ;;
        *) die "sonar.enabled must be true or false (got '$2')." ;;
      esac
      ;;
    *) die "Unknown local setting '$1'. Known: worktree.mode, sonar.enabled, models.<role>, models.<role>.<host>" ;;
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
    current=$(read_file)
    # The block shape always; the roles only the one asked for, so another malformed role does not block it.
    case "$1" in
      models) printf '%s' "$current" | check_models ;;
      models.*) _r=${1#models.}; printf '%s' "$current" | check_models "${_r%%.*}" ;;
    esac
    printf '%s' "$current" | jq -r --argjson p "$(path_for "$1" "$REPO")" '(try getpath($p) catch null) // empty'
    ;;
  set)
    parse_repo "$@"
    [ "$ARGC_LEFT" -eq 2 ] || die "Usage: local-settings.sh set <dotted.key> <value> [--repo NAME]"
    key=$1; value=$2
    case "$key" in
      models|models.*)
        [ -z "$REPO" ] || die "--repo applies to worktree.mode only."
        set_model "$key" "$value"
        exit 0
        ;;
    esac
    case "$key" in
      worktree.mode) value=$(printf '%s' "$value" | tr '[:lower:]' '[:upper:]') ;;
      sonar.enabled) value=$(printf '%s' "$value" | tr '[:upper:]' '[:lower:]') ;;
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
    write_file "$next"
    echo "$key${REPO:+ (repo $REPO)}=${value:-<unset>} in $FILE"
    ;;
  models)
    role=""; host=""; host_given=0
    while [ $# -gt 0 ]; do
      case "$1" in
        --host)
          [ $# -ge 2 ] && [ -n "$2" ] || die "--host needs a host name (claude-code, cursor, …)."
          host=$2; host_given=1; shift 2 ;;
        -*) die "Usage: local-settings.sh models <role> [--host HOST]" ;;
        *) [ -z "$role" ] || die "Usage: local-settings.sh models <role> [--host HOST]"; role=$1; shift ;;
      esac
    done
    [ -n "$role" ] || die "Usage: local-settings.sh models <role> [--host HOST]"
    check_role "$role"
    if [ "$host_given" -eq 0 ] && [ "${CLAUDECODE:-}" = 1 ]; then host=claude-code; fi
    [ -z "$host" ] || check_host "$host"
    current=$(read_file)
    printf '%s' "$current" | check_models "$role"
    printf '%s' "$current" | jq -r --arg r "$role" --arg h "$host" --argjson d "$DEFAULT_MODELS" "$JQ_MODEL_DEFS"'
      (.models[$r]?) as $v
      | (if $v == null then ($d[$r][$h] // [])
         elif ($v | type) == "object" then
           (if $h != "" and $v[$h] != null then ($v[$h] | list) else ($d[$r][$h] // []) end)
         else ($v | list) end)
      | .[]'
    ;;
  init-models)
    current=$(read_file)
    # Only the models block itself must be an object here; a malformed role is
    # left as is (with a warning) so the other missing roles still get defaults.
    printf '%s' "$current" | jq -e '(has("models") | not) or (.models | type == "object")' >/dev/null \
      || die "models in $FILE must be a JSON object of roles — fix or remove it in the file."
    printf '%s' "$current" | jq -r "$JQ_MODEL_DEFS"'(.models // {}) | to_entries[] | select(.value | okrole | not) | .key' \
      | while IFS= read -r _r; do
          echo "models.$_r in $FILE is malformed, left as is — fix it with: set models.$_r …" >&2
        done
    missing=$(printf '%s' "$current" | jq -r --argjson d "$DEFAULT_MODELS" '(.models // {}) as $m | $d | keys_unsorted[] | select(. as $r | $m | has($r) | not)')
    if [ -z "$missing" ]; then
      echo "models: every role is already set in $FILE"
      exit 0
    fi
    # Defaults first, then whatever is already set wins.
    write_file "$(printf '%s' "$current" | jq --argjson d "$DEFAULT_MODELS" '.models = ($d + (.models // {}))')"
    echo "models: wrote defaults for $(printf '%s' "$missing" | tr '\n' ' ' | sed 's/ $//') in $FILE"
    ;;
  *) die "Usage: local-settings.sh path | show | get <key> [--repo NAME] | set <key> <value> [--repo NAME] | models <role> [--host HOST] | init-models" ;;
esac
