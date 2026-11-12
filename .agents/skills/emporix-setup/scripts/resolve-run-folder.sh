#!/usr/bin/env sh
# Resolve the .ai/runs folder for one ticket. The folder name is the ticket
# branch and, when there is a Jira key, always starts with that key.
#
#   resolve-run-folder.sh --root <checkout> [--key KEY] [--branch NAME]
#     [--title TEXT] [--pr NUMBER] [--create] [--adopt] [--rename-from PARENT]
#
# Always prints:
#   KEY TASK_BRANCH RUN_FOLDER AMBIGUOUS PLAN_ELSEWHERE LEGACY
#   ISSUE_PLAN LEDGER PR_PLAN DOCS_PLAN
# And, when set: MATCH, OTHER_FOLDER, PLAN_MATCH, ADOPT_MOVED, ADOPT_SKIP,
# RENAMED, RENAME_CONFLICT, ERROR.
#
# --create makes the folder. --adopt moves a legacy flat file from .ai/runs
# into that folder. It never overwrites and never merges two ticket folders.
# --rename-from PARENT renames PARENT-<slug> to KEY-<slug> and retargets
# filenames that carry the parent key.
#
# Exit 1 when ERROR is set. Exit 2 on bad arguments.
# Rule: emporix-setup/references/runs-layout.md

set -eu

ROOT=
KEY=
BRANCH=
TITLE=
PR=
CREATE=0
ADOPT=0
RENAME_FROM=

while [ $# -gt 0 ]; do
  case "$1" in
    --root) ROOT=${2:-}; shift 2 ;;
    --key) KEY=${2:-}; shift 2 ;;
    --branch) BRANCH=${2:-}; shift 2 ;;
    --title) TITLE=${2:-}; shift 2 ;;
    --pr) PR=${2:-}; shift 2 ;;
    --create) CREATE=1; shift ;;
    --adopt) ADOPT=1; CREATE=1; shift ;;
    --rename-from) RENAME_FROM=${2:-}; shift 2 ;;
    -h|--help)
      echo "Usage: resolve-run-folder.sh --root <checkout> [--key KEY] [--branch NAME] [--title TEXT] [--pr N] [--create] [--adopt] [--rename-from PARENT]" >&2
      exit 0
      ;;
    *) echo "Unknown argument: $1" >&2; exit 2 ;;
  esac
done

die() { echo "$1" >&2; exit 2; }

[ -n "$ROOT" ] || die "Missing --root"
[ -d "$ROOT" ] || die "Not a directory: $ROOT"

valid_key() {
  printf '%s\n' "$1" | grep -Eq '^[A-Z][A-Z0-9_]+-[0-9]+$'
}

if [ -n "$KEY" ]; then
  valid_key "$KEY" || die "Invalid --key: $KEY"
fi
if [ -n "$RENAME_FROM" ]; then
  valid_key "$RENAME_FROM" || die "Invalid --rename-from: $RENAME_FROM"
  [ -n "$KEY" ] || die "--rename-from requires --key"
  [ "$RENAME_FROM" != "$KEY" ] || die "--rename-from is the same as --key"
fi
if [ -n "$PR" ]; then
  printf '%s\n' "$PR" | grep -Eq '^[0-9]+$' || die "Invalid --pr: $PR"
fi

RUNS="$ROOT/.ai/runs"
TASK_BRANCH=
AMBIGUOUS=0
PLAN_ELSEWHERE=0
LEGACY=0
ISSUE_PLAN=
LEDGER=
PR_PLAN=
DOCS_PLAN=
ERROR=
DEFERRED=0
NOTES=$(mktemp)
trap 'rm -f "$NOTES"' EXIT

file_mtime() {
  if stat -f %m "$1" >/dev/null 2>&1; then
    stat -f %m "$1"
  else
    stat -c %Y "$1"
  fi
}

relpath() {
  case "$1" in
    "$ROOT"/*) printf '%s\n' "${1#"$ROOT"/}" ;;
    *) printf '%s\n' "$1" ;;
  esac
}

is_base_name() {
  case "$1" in
    main|master|develop|development) return 0 ;;
    *) return 1 ;;
  esac
}

# Drop anything before the Jira key (feat/, fix/, …) and turn slashes into
# dashes. An existing branch keeps the case of its slug.
normalize_branch() {
  _raw=$1
  _key=$2
  case "$_raw" in
    refs/heads/*) _raw=${_raw#refs/heads/} ;;
  esac
  if [ -n "$_key" ]; then
    case "$_raw" in
      *"$_key"*)
        _rest=${_raw#*"$_key"}
        _raw="${_key}${_rest}"
        ;;
    esac
  fi
  _raw=$(printf '%s' "$_raw" | tr '/' '-')
  _raw=$(printf '%s' "$_raw" | sed -E 's/[^A-Za-z0-9._-]+/-/g; s/^-+//; s/-+$//')
  printf '%s\n' "$_raw"
}

branch_qualifies() {
  _name=$1
  [ -n "$_name" ] || return 1
  is_base_name "$_name" && return 1
  # A dot name would point the folder at .ai/runs itself or above it.
  case "$_name" in
    .*) return 1 ;;
  esac
  if [ -n "$KEY" ]; then
    case "$_name" in
      "$KEY"|"$KEY"-*) return 0 ;;
      *) return 1 ;;
    esac
  fi
  return 0
}

slug_from_title() {
  _slug=$(printf '%s' "$TITLE" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//; s/-+/-/g')
  _key_l=$(printf '%s' "$KEY" | tr '[:upper:]' '[:lower:]')
  case "$_slug" in
    "$_key_l"-*) _slug=${_slug#"$_key_l"-} ;;
    "$_key_l") _slug= ;;
  esac
  [ -n "$_slug" ] || _slug=work
  printf '%s-%s\n' "$KEY" "$_slug"
}

current_git_branch() {
  if git -C "$ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    git -C "$ROOT" branch --show-current 2>/dev/null || true
  fi
}

list_key_dirs() {
  # $1 key prefix. Echoes directory paths.
  [ -n "$1" ] || return 0
  [ -d "$RUNS" ] || return 0
  find "$RUNS" -mindepth 1 -maxdepth 1 -type d \( -name "$1" -o -name "$1-*" \) 2>/dev/null || true
}

next_key_name() {
  # $1 basename, $2 old key, $3 new key. Echoes the retargeted name, or nothing.
  case "$1" in
    "$2"-review-findings.md)
      printf '%s\n' "${3}-review-findings.md"
      ;;
    *-"$2"-*.md)
      printf '%s\n' "$1" | awk -v o="-$2-" -v n="-$3-" '{ gsub(o, n); print }'
      ;;
  esac
}

# True when a file in $1 would be renamed onto a name that already exists there.
dir_has_rename_conflict() {
  for _p in "$1"/*; do
    [ -f "$_p" ] || continue
    _pb=$(basename "$_p")
    _pn=$(next_key_name "$_pb" "$RENAME_FROM" "$KEY")
    [ -n "$_pn" ] && [ "$_pn" != "$_pb" ] || continue
    if [ -e "$1/$_pn" ]; then
      echo "RENAME_CONFLICT=$(relpath "$_p") -> $(relpath "$1/$_pn")"
      return 0
    fi
  done
  return 1
}

rename_file_key() {
  # $1 file, $2 old key, $3 new key. Rename in place when the name carries the old key.
  _file=$1
  _base=$(basename "$_file")
  _dir=$(dirname "$_file")
  _next=$(next_key_name "$_base" "$2" "$3")
  [ -n "$_next" ] && [ "$_next" != "$_base" ] || return 0
  if [ -e "$_dir/$_next" ]; then
    echo "RENAME_CONFLICT=$(relpath "$_file") -> $(relpath "$_dir/$_next")"
    echo conflict >>"$NOTES"
    return 0
  fi
  mv "$_file" "$_dir/$_next"
  echo "RENAMED=$(relpath "$_file") -> $(relpath "$_dir/$_next")"
}

rename_tree() {
  # Rename every file under $1 (one level) plus that caller's list.
  _dir=$1
  _files=$(find "$_dir" -mindepth 1 -maxdepth 1 -type f 2>/dev/null || true)
  [ -n "$_files" ] || return 0
  # Not a pipeline: a failing mv must stay in this shell, and NOTES is shared.
  _old_ifs=$IFS
  IFS='
'
  for _f in $_files; do
    [ -n "$_f" ] || continue
    rename_file_key "$_f" "$RENAME_FROM" "$KEY"
  done
  IFS=$_old_ifs
}

rename_from_parent() {
  [ -n "$RENAME_FROM" ] || return 0
  [ -d "$RUNS" ] || return 0
  # Flat files are retargeted below; check them all before anything moves.
  if dir_has_rename_conflict "$RUNS"; then
    ERROR=rename-conflict
    return 0
  fi
  _found=$(list_key_dirs "$RENAME_FROM")
  _count=0
  if [ -n "$_found" ]; then
    _count=$(printf '%s\n' "$_found" | wc -l | tr -d ' ')
  fi
  if [ "$_count" -gt 1 ]; then
    ERROR=ambiguous-rename
    printf '%s\n' "$_found" | while IFS= read -r _d; do
      [ -n "$_d" ] || continue
      echo "MATCH=$(relpath "$_d")"
    done
    return 0
  fi
  if [ "$_count" -eq 1 ]; then
    _only=$(printf '%s\n' "$_found" | head -n 1)
    _base=$(basename "$_only")
    if [ "$_base" = "$RENAME_FROM" ]; then
      _dest="$RUNS/$KEY"
    else
      _dest="$RUNS/${KEY}-${_base#"$RENAME_FROM"-}"
    fi
    if [ -e "$_dest" ]; then
      ERROR=rename-conflict
      echo "RENAME_CONFLICT=$(relpath "$_only") -> $(relpath "$_dest")"
      return 0
    fi
    # Any other child-key folder would make the result ambiguous; stop before moving.
    _child=$(list_key_dirs "$KEY")
    if [ -n "$_child" ]; then
      ERROR=rename-conflict
      printf '%s\n' "$_child" | while IFS= read -r _d; do
        [ -n "$_d" ] || continue
        echo "RENAME_CONFLICT=$(relpath "$_only") -> $(relpath "$_d")"
      done
      return 0
    fi
    if dir_has_rename_conflict "$_only"; then
      ERROR=rename-conflict
      return 0
    fi
    mv "$_only" "$_dest"
    echo "RENAMED=$(relpath "$_only") -> $(relpath "$_dest")"
    rename_tree "$_dest"
  fi
  _flat=$(find "$RUNS" -mindepth 1 -maxdepth 1 -type f 2>/dev/null || true)
  if [ -n "$_flat" ]; then
    _old_ifs=$IFS
    IFS='
'
    for _f in $_flat; do
      [ -n "$_f" ] || continue
      [ -f "$_f" ] || continue
      rename_file_key "$_f" "$RENAME_FROM" "$KEY"
    done
    IFS=$_old_ifs
  fi
  if grep -q '^conflict$' "$NOTES" 2>/dev/null; then
    ERROR=rename-conflict
  fi
}

decide_task_branch() {
  if [ -n "$BRANCH" ]; then
    _n=$(normalize_branch "$BRANCH" "$KEY")
    if branch_qualifies "$_n"; then
      TASK_BRANCH=$_n
      return 0
    fi
  fi
  _cur=$(current_git_branch || true)
  if [ -n "$_cur" ]; then
    _n=$(normalize_branch "$_cur" "$KEY")
    if branch_qualifies "$_n"; then
      TASK_BRANCH=$_n
      return 0
    fi
  fi
  if [ -z "$KEY" ]; then
    if [ -n "$TITLE" ]; then
      TASK_BRANCH=$(printf '%s' "$TITLE" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//; s/-+/-/g')
      [ -n "$TASK_BRANCH" ] || TASK_BRANCH=work
    fi
    return 0
  fi
  _dirs=$(list_key_dirs "$KEY")
  _count=0
  if [ -n "$_dirs" ]; then
    _count=$(printf '%s\n' "$_dirs" | wc -l | tr -d ' ')
  fi
  if [ "$_count" -eq 1 ]; then
    TASK_BRANCH=$(basename "$(printf '%s\n' "$_dirs" | head -n 1)")
    return 0
  fi
  if [ "$_count" -gt 1 ]; then
    AMBIGUOUS=1
    return 0
  fi
  if [ -n "$TITLE" ]; then
    TASK_BRANCH=$(slug_from_title)
  fi
}

files_named() {
  # $1 directory, $2 -name pattern.
  [ -d "$1" ] || return 0
  find "$1" -mindepth 1 -maxdepth 1 -type f -name "$2" 2>/dev/null || true
}

pick_newest() {
  _best=
  _best_m=-1
  _old_ifs=$IFS
  IFS='
'
  for _f in $1; do
    [ -n "$_f" ] && [ -f "$_f" ] || continue
    _m=$(file_mtime "$_f") || _m=0
    if [ "$_m" -gt "$_best_m" ]; then
      _best=$_f
      _best_m=$_m
    fi
  done
  IFS=$_old_ifs
  printf '%s\n' "$_best"
}

# Sets FOUND and WHERE=folder|flat|elsewhere|many|none for one filename pattern.
FOUND=
WHERE=none
pick_pattern() {
  _pat=$1
  FOUND=
  WHERE=none
  if [ -n "$TASK_BRANCH" ]; then
    _hits=$(files_named "$RUNS/$TASK_BRANCH" "$_pat")
    if [ -n "$_hits" ]; then
      FOUND=$(pick_newest "$_hits")
      WHERE=folder
      return 0
    fi
  fi
  _hits=$(files_named "$RUNS" "$_pat")
  if [ -n "$_hits" ]; then
    FOUND=$(pick_newest "$_hits")
    WHERE=flat
    return 0
  fi
  [ -n "$KEY" ] || return 0
  _else=
  _dirs=$(list_key_dirs "$KEY")
  if [ -n "$_dirs" ]; then
    _old_ifs=$IFS
    IFS='
'
    for _d in $_dirs; do
      [ -n "$_d" ] || continue
      [ "$(basename "$_d")" = "$TASK_BRANCH" ] && continue
      _one=$(files_named "$_d" "$_pat")
      if [ -n "$_one" ]; then
        _else="${_else}
${_one}"
      fi
    done
    IFS=$_old_ifs
  fi
  # Trim leading newline from the accumulator.
  _else=$(printf '%s\n' "$_else" | sed '/^$/d')
  [ -n "$_else" ] || return 0
  _parents=$(printf '%s\n' "$_else" | while IFS= read -r _f; do
    [ -n "$_f" ] || continue
    dirname "$_f"
  done | sort -u)
  _pc=$(printf '%s\n' "$_parents" | wc -l | tr -d ' ')
  if [ "$_pc" -eq 1 ]; then
    FOUND=$(pick_newest "$_else")
    WHERE=elsewhere
    return 0
  fi
  WHERE=many
  printf '%s\n' "$_else" | while IFS= read -r _f; do
    [ -n "$_f" ] || continue
    echo "PLAN_MATCH=$(relpath "$_f")"
  done
}

note_where() {
  case "$WHERE" in
    flat) LEGACY=1 ;;
    elsewhere) PLAN_ELSEWHERE=1 ;;
    many) AMBIGUOUS=1 ;;
  esac
}

pick_first_kind() {
  # Echoes nothing. Sets FOUND/WHERE. Args are -name patterns in priority order.
  FOUND=
  WHERE=none
  for _pat in "$@"; do
    pick_pattern "$_pat"
    [ "$WHERE" = none ] || return 0
  done
}

take_matches() {
  # $1 is issue|pr|docs. Reads FOUND/WHERE into the right variable.
  case "$1" in
    issue) ISSUE_PLAN=$FOUND ;;
    pr) PR_PLAN=$FOUND ;;
    docs) DOCS_PLAN=$FOUND ;;
  esac
  note_where
}

adopt_flat_files() {
  [ "$ADOPT" -eq 1 ] || return 0
  [ -n "$TASK_BRANCH" ] || return 0
  [ -d "$RUNS" ] || return 0
  _dest="$RUNS/$TASK_BRANCH"
  mkdir -p "$_dest"
  _list=$(find "$RUNS" -mindepth 1 -maxdepth 1 -type f 2>/dev/null || true)
  [ -n "$_list" ] || return 0
  _old_ifs=$IFS
  IFS='
'
  for _f in $_list; do
    [ -n "$_f" ] && [ -f "$_f" ] || continue
    _base=$(basename "$_f")
    _take=0
    if [ -n "$KEY" ]; then
      case "$_base" in
        *-"$KEY"-*.md|"$KEY"-review-findings.md)
          _take=1
          ;;
      esac
    fi
    if [ "$_take" -eq 0 ] && [ -n "$PR" ]; then
      case "$_base" in
        *-pr"$PR"-pr-plan.md) _take=1 ;;
      esac
    fi
    if [ "$_take" -eq 0 ] && [ -z "$KEY" ]; then
      case "$_base" in
        "$TASK_BRANCH"-review-findings.md|*-docs-update.md) _take=1 ;;
      esac
    fi
    [ "$_take" -eq 1 ] || continue
    if [ -e "$_dest/$_base" ]; then
      echo "ADOPT_SKIP=$(relpath "$_f")"
      continue
    fi
    mv "$_f" "$_dest/$_base"
    echo "ADOPT_MOVED=$(relpath "$_dest/$_base")"
  done
  IFS=$_old_ifs
}

# True when TASK_BRANCH has no folder yet and an issue plan for KEY sits in
# another {KEY}-* folder. Creating then would start a second ticket folder.
plan_in_other_folder() {
  [ -n "$KEY" ] || return 1
  [ ! -d "$RUNS/$TASK_BRANCH" ] || return 1
  # Folders only: a flat legacy copy must not hide a plan in another folder.
  _ods=$(list_key_dirs "$KEY")
  _old_ifs=$IFS
  IFS='
'
  for _od in $_ods; do
    [ "$(basename "$_od")" = "$TASK_BRANCH" ] && continue
    for _op in "*-${KEY}-issue-plan.md" "*-${KEY}-issue-prepare.md" "*-${KEY}-prepare-issue.md"; do
      if [ -n "$(files_named "$_od" "$_op")" ]; then
        IFS=$_old_ifs
        return 0
      fi
    done
  done
  IFS=$_old_ifs
  return 1
}

# --- run ---

rename_from_parent

if [ -z "$ERROR" ]; then
  decide_task_branch
fi

if [ -n "$ERROR" ]; then
  :
elif [ "$AMBIGUOUS" -eq 1 ] && [ -z "$TASK_BRANCH" ]; then
  [ "$CREATE" -eq 1 ] && ERROR=ambiguous
elif [ "$CREATE" -eq 1 ] && [ -z "$TASK_BRANCH" ]; then
  ERROR=no-task-branch
elif [ -n "$TASK_BRANCH" ] && [ "$CREATE" -eq 1 ]; then
  if plan_in_other_folder; then
    DEFERRED=1
  else
    mkdir -p "$RUNS/$TASK_BRANCH"
    adopt_flat_files
  fi
fi

if [ -n "$KEY" ]; then
  pick_first_kind "*-${KEY}-issue-plan.md" "*-${KEY}-issue-prepare.md" "*-${KEY}-prepare-issue.md"
  take_matches issue
  pick_pattern "*-${KEY}-pr-plan.md"
  take_matches pr
  pick_pattern "*-${KEY}-docs-update.md"
  take_matches docs
  if [ -n "$TASK_BRANCH" ] && [ -f "$RUNS/$TASK_BRANCH/${KEY}-review-findings.md" ]; then
    LEDGER="$RUNS/$TASK_BRANCH/${KEY}-review-findings.md"
  elif [ -f "$RUNS/${KEY}-review-findings.md" ]; then
    LEDGER="$RUNS/${KEY}-review-findings.md"
    LEGACY=1
  fi
else
  if [ -n "$PR" ]; then
    pick_pattern "*-pr${PR}-pr-plan.md"
    take_matches pr
  elif [ -n "$TASK_BRANCH" ]; then
    pick_pattern "*-pr-plan.md"
    take_matches pr
  fi
  pick_pattern "*-docs-update.md"
  take_matches docs
  if [ -n "$TASK_BRANCH" ] && [ -f "$RUNS/$TASK_BRANCH/${TASK_BRANCH}-review-findings.md" ]; then
    LEDGER="$RUNS/$TASK_BRANCH/${TASK_BRANCH}-review-findings.md"
  elif [ -n "$TASK_BRANCH" ] && [ -f "$RUNS/${TASK_BRANCH}-review-findings.md" ]; then
    LEDGER="$RUNS/${TASK_BRANCH}-review-findings.md"
    LEGACY=1
  fi
fi

if [ -n "$KEY" ] && [ -d "$RUNS" ]; then
  _dirs=$(list_key_dirs "$KEY")
  if [ -n "$_dirs" ]; then
    printf '%s\n' "$_dirs" | while IFS= read -r _d; do
      [ -n "$_d" ] || continue
      [ "$(basename "$_d")" = "$TASK_BRANCH" ] && continue
      if [ "$AMBIGUOUS" -eq 1 ] && [ -z "$TASK_BRANCH" ]; then
        echo "MATCH=$(relpath "$_d")"
      else
        echo "OTHER_FOLDER=$(relpath "$_d")"
      fi
    done
  fi
fi

# Two ticket folders and no branch to choose between them: do not hand back
# one plan. MATCH lists the folders; the caller asks.
if [ "$AMBIGUOUS" -eq 1 ] && [ -z "$TASK_BRANCH" ]; then
  ISSUE_PLAN=
  LEDGER=
  PR_PLAN=
  DOCS_PLAN=
  PLAN_ELSEWHERE=0
  LEGACY=0
fi

# Creation was skipped for a plan in another folder: say so even when a
# flat legacy copy was picked above.
[ "$DEFERRED" -eq 1 ] && PLAN_ELSEWHERE=1

RUN_FOLDER=
if [ -n "$TASK_BRANCH" ]; then
  RUN_FOLDER=".ai/runs/$TASK_BRANCH"
fi

[ -n "$ISSUE_PLAN" ] && ISSUE_PLAN=$(relpath "$ISSUE_PLAN")
[ -n "$LEDGER" ] && LEDGER=$(relpath "$LEDGER")
[ -n "$PR_PLAN" ] && PR_PLAN=$(relpath "$PR_PLAN")
[ -n "$DOCS_PLAN" ] && DOCS_PLAN=$(relpath "$DOCS_PLAN")

echo "KEY=${KEY}"
echo "TASK_BRANCH=${TASK_BRANCH}"
echo "RUN_FOLDER=${RUN_FOLDER}"
echo "AMBIGUOUS=${AMBIGUOUS}"
echo "PLAN_ELSEWHERE=${PLAN_ELSEWHERE}"
echo "LEGACY=${LEGACY}"
echo "ISSUE_PLAN=${ISSUE_PLAN}"
echo "LEDGER=${LEDGER}"
echo "PR_PLAN=${PR_PLAN}"
echo "DOCS_PLAN=${DOCS_PLAN}"
[ -n "$ERROR" ] && echo "ERROR=${ERROR}"

if [ -n "$ERROR" ]; then
  exit 1
fi
exit 0
