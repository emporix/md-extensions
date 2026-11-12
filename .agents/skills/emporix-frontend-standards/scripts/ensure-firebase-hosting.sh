#!/usr/bin/env sh
# Check (and on request create) the Firebase Hosting sites a remote deploys to,
# and the GitHub secrets its deploy workflows read. Run from the repository root
# before the first push / PR of a new remote: the PR preview workflow fails when
# the site or the service-account secret does not exist yet.
#
#   sh ensure-firebase-hosting.sh [--remote <folder>]... [--changed [--base <ref>]] [--create] [--no-secrets]
#
# Scope: hosting entries in firebase.json whose "public" lives in a --remote
# folder, or in a top-level folder changed against --base (default origin/HEAD),
# or every entry when neither is given or when --changed finds a change to
# firebase.json, .firebaserc, or .github/workflows/. Each entry's "target" is resolved to
# (project, site) through .firebaserc "targets"; a target with no site in any
# project is an error. Secrets are the `secrets.X` names (except GITHUB_TOKEN)
# of every workflow in .github/workflows that names one of those targets.
#
# Output, one line per item:
#   SITE <project> <site> ok|missing|created
#   SECRET <name> ok|missing
#   UNMAPPED <target>
# Exit: 0 all present (or created), 3 something missing, 2 usage / CLI / auth
# error (including secrets that cannot be listed; pass --no-secrets to skip them).
# Creating a site is a write in a shared Firebase project: callers ask the user
# before passing --create. Prints no credentials.
set -eu

die() { echo "ensure-firebase-hosting: $1" >&2; exit 2; }

REMOTES=""
CHANGED=0
BASE=""
CREATE=0
SECRETS=1
while [ $# -gt 0 ]; do
  case "$1" in
    --remote) [ $# -ge 2 ] || die "--remote needs a folder"; REMOTES="$REMOTES ${2%/}"; shift 2 ;;
    --changed) CHANGED=1; shift ;;
    --base) [ $# -ge 2 ] || die "--base needs a ref"; BASE=$2; shift 2 ;;
    --create) CREATE=1; shift ;;
    --no-secrets) SECRETS=0; shift ;;
    -h|--help) sed -n '2,24p' "$0"; exit 0 ;;
    *) die "unknown argument: $1" ;;
  esac
done

[ -f firebase.json ] || { echo "No firebase.json — nothing to check."; exit 0; }
[ -f .firebaserc ] || die "firebase.json without .firebaserc"
command -v python3 >/dev/null 2>&1 || die "python3 is required"

if [ "$CHANGED" = 1 ]; then
  [ -n "$BASE" ] || BASE=$(git rev-parse --abbrev-ref origin/HEAD 2>/dev/null) || die "cannot resolve origin/HEAD; pass --base"
  # Each git call is checked on its own: a pipeline's status is only its last command's.
  committed=$(git diff --name-only "$BASE"...HEAD 2>/dev/null) || die "cannot diff against $BASE"
  worktree=$(git diff --name-only HEAD 2>/dev/null) || die "cannot diff the working tree"
  untracked=$(git ls-files --others --exclude-standard 2>/dev/null) || die "cannot list untracked files"
  paths=$(printf '%s\n%s\n%s\n' "$committed" "$worktree" "$untracked")
  # Hosting and deploy config can move any target or secret: check every entry.
  if printf '%s\n' "$paths" | grep -qE '^(firebase\.json|\.firebaserc|\.github/workflows/.+)$'; then
    REMOTES=""
  else
    changed=$(printf '%s\n' "$paths" | awk -F/ 'NF > 1 { print $1 }' | LC_ALL=C sort -u)
    for d in $changed; do REMOTES="$REMOTES $d"; done
    [ -n "$REMOTES" ] || { echo "No changed folders — nothing to check."; exit 0; }
  fi
fi

# Lines: "SITE <project> <site>", "UNMAPPED <target>", "SECRET <name>".
plan=$(REMOTES="$REMOTES" CHANGED="$CHANGED" python3 -I - <<'PY'
import glob, json, os, re, sys
remotes = [r for r in os.environ.get("REMOTES", "").split() if r]
fb = json.load(open("firebase.json"))
rc = json.load(open(".firebaserc"))
hosting = fb.get("hosting") or []
if isinstance(hosting, dict):
    hosting = [hosting]
def in_scope(entry):
    if not remotes:
        return True
    public = (entry.get("public") or "").strip("./")
    return any(public == r or public.startswith(r + "/") for r in remotes)
targets = sorted({e["target"] for e in hosting if e.get("target") and in_scope(e)})
mapped = (rc.get("targets") or {})
sites = []
for t in targets:
    found = False
    for project, kinds in mapped.items():
        for site in ((kinds or {}).get("hosting") or {}).get(t) or []:
            sites.append((project, site)); found = True
    if not found:
        print(f"UNMAPPED {t}")
for project, site in sorted(set(sites)):
    print(f"SITE {project} {site}")
names = set()
for wf in glob.glob(".github/workflows/*.y*ml"):
    text = open(wf).read()
    # "-" and "_" count as part of a target, so "alpha" does not match "alpha-stage".
    if any(re.search(rf"(?<![\w-]){re.escape(t)}(?![\w-])", text) for t in targets):
        names.update(re.findall(r"secrets\.([A-Za-z0-9_]+)", text))
for n in sorted(names - {"GITHUB_TOKEN"}):
    print(f"SECRET {n}")
PY
) || die "cannot read firebase.json / .firebaserc"

[ -n "$plan" ] || { echo "No Firebase Hosting targets in scope."; exit 0; }

if printf '%s\n' "$plan" | grep -q '^SITE '; then
  command -v firebase >/dev/null 2>&1 || die "firebase CLI not found (npm i -g firebase-tools)"
  firebase login:list 2>/dev/null | grep -qi 'logged in as' || die "firebase CLI is not logged in (run: firebase login)"
fi

# Repository secrets plus the organization secrets shared with this repository
# (deploy service accounts are usually organization secrets).
secret_names=""
if [ "$SECRETS" = 1 ] && printf '%s\n' "$plan" | grep -q '^SECRET '; then
  hint="pass --no-secrets to skip the secret check"
  command -v gh >/dev/null 2>&1 || die "gh CLI not found; $hint"
  repo=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null) || die "cannot resolve the GitHub repository (gh auth login?); $hint"
  own=$(gh api "repos/$repo/actions/secrets" --paginate -q '.secrets[].name' 2>/dev/null) || die "cannot list secrets of $repo; $hint"
  org=$(gh api "repos/$repo/actions/organization-secrets" --paginate -q '.secrets[].name' 2>/dev/null) || die "cannot list organization secrets of $repo; $hint"
  secret_names=$(printf '%s\n%s\n' "$own" "$org")
fi

missing=0
# A here-document keeps the loop in this shell, so `die` and `missing` work.
while read -r kind a b; do
  case "$kind" in
    UNMAPPED)
      echo "UNMAPPED $a"; missing=1 ;;
    SITE)
      if out=$(firebase hosting:sites:get "$b" --project "$a" 2>&1) && ! printf '%s' "$out" | grep -qiE 'could not find|not found'; then
        echo "SITE $a $b ok"
      elif printf '%s' "$out" | grep -qiE 'could not find|not found|404'; then
        if [ "$CREATE" = 1 ]; then
          firebase hosting:sites:create "$b" --project "$a" >/dev/null 2>&1 || die "could not create site $b in $a"
          echo "SITE $a $b created"
        else
          echo "SITE $a $b missing"; missing=1
        fi
      else
        die "cannot read site $b in $a (no access to the project?)"
      fi
      ;;
    SECRET)
      [ "$SECRETS" = 1 ] || continue
      if printf '%s\n' "$secret_names" | grep -qx "$a"; then
        echo "SECRET $a ok"
      else
        echo "SECRET $a missing"; missing=1
      fi
      ;;
  esac
done <<EOF
$plan
EOF

[ "$missing" = 0 ] || exit 3
