#!/usr/bin/env bash
# Manage Emporix tenant profiles in ~/.emporix/tenants.json (override with EMPORIX_TENANTS_FILE).
# Shared by the emporix-* skills (QA UI, demo recording, MD extensions).
#
#   tenants.sh init                        # create the file from a template if missing (chmod 600) and open it in the editor
#   tenants.sh open                        # open the file in the editor
#   tenants.sh list                        # table of profiles — never prints secrets
#   tenants.sh check <alias> [--probe URL] # mint a token from the profile's API client and validate it; optional GET probe
#   tenants.sh path                        # print the file path
#
# Editor: $EMPORIX_EDITOR, else cursor, code, open (macOS), xdg-open.
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd)
# shellcheck disable=SC1091
. "$here/emporix-env.sh"

file=$EMPORIX_TENANTS_FILE
cmd=${1:-}; shift || true

open_in_editor() {
  local f=$1
  if [ -n "${EMPORIX_EDITOR:-}" ]; then "$EMPORIX_EDITOR" "$f" && return 0; fi
  for ed in cursor code; do
    if command -v "$ed" >/dev/null 2>&1; then "$ed" "$f" && return 0; fi
  done
  if command -v open >/dev/null 2>&1; then open "$f" && return 0; fi
  if command -v xdg-open >/dev/null 2>&1; then xdg-open "$f" >/dev/null 2>&1 && return 0; fi
  echo "No editor found; open $f manually." >&2
  return 1
}

write_template() {
  mkdir -p "$(dirname "$file")"
  umask 077
  cat > "$file" <<'EOF'
{
  "$comment": [
    "Emporix tenant profiles used by the emporix-* agent skills. Keep this file private (chmod 600). It never stores a token: tokens are minted per run from the API client.",
    "Each key under 'profiles' is an alias you will use in conversation (e.g. 'acme', 'acme-stage').",
    "tenant       : Emporix tenant name (required).",
    "apiUrl       : https://api.emporix.io (prod, default) | https://api-stage.emporix.io | https://api-develop.emporix.io",
    "clientId / clientSecret : API client credentials (required). An access token is minted per run via POST /oauth/token.",
    "scopes       : optional space-separated scopes to request; leave empty to receive all scopes of the API client.",
    "language     : optional UI language for QA / demo runs (default en).",
    "description  : free text shown in listings.",
    "default      : alias used when no tenant is named."
  ],
  "default": "my-tenant",
  "profiles": {
    "my-tenant": {
      "tenant": "my-tenant",
      "apiUrl": "https://api.emporix.io",
      "clientId": "",
      "clientSecret": "",
      "scopes": "",
      "description": ""
    },
    "my-tenant-stage": {
      "tenant": "my-tenant",
      "apiUrl": "https://api-stage.emporix.io",
      "clientId": "",
      "clientSecret": "",
      "description": "same tenant on stage"
    }
  }
}
EOF
  chmod 600 "$file"
}

case "$cmd" in
  path) echo "$file" ;;

  init)
    if [ -f "$file" ]; then
      echo "Profiles file already exists: $file"
    else
      write_template
      echo "Created tenant profiles template: $file"
      echo "Fill in tenant, apiUrl, clientId and clientSecret for each profile you need, then save."
    fi
    open_in_editor "$file" || true ;;

  open)
    [ -f "$file" ] || { echo "No profiles file at $file — run: tenants.sh init" >&2; exit 1; }
    open_in_editor "$file" ;;

  list)
    [ -f "$file" ] || { echo "No profiles file at $file — run: tenants.sh init" >&2; exit 1; }
    python3 - "$file" <<'PY'
import json, sys
file = sys.argv[1]
try:
    cfg = json.load(open(file))
except Exception as e:
    print(f"Invalid JSON in {file}: {e}", file=sys.stderr); sys.exit(1)
profiles = cfg.get("profiles") or {}
if not profiles:
    print("No profiles defined.", file=sys.stderr); sys.exit(1)
rows = []
for a, p in profiles.items():
    p = p or {}
    cc = p.get("clientId") and p.get("clientSecret")
    auth = "client-credentials" if cc else "INCOMPLETE"
    note = "missing tenant" if not p.get("tenant") else (p.get("description") or "")
    rows.append([a, p.get("tenant") or "-", p.get("apiUrl") or "https://api.emporix.io", auth, "*" if cfg.get("default") == a else "", note])
head = ["ALIAS", "TENANT", "API URL", "AUTH", "DEFAULT", "NOTE"]
w = [max(len(head[i]), *(len(str(r[i])) for r in rows)) for i in range(len(head))]
fmt = lambda r: "  ".join(str(c).ljust(w[i]) for i, c in enumerate(r)).rstrip()
print(fmt(head))
for r in rows: print(fmt(r))
PY
    ;;

  check)
    alias=${1:-}; shift || true
    [ -n "$alias" ] || { echo "Usage: tenants.sh check <alias> [--probe URL]" >&2; exit 2; }
    probe=""
    while [ $# -gt 0 ]; do
      case "$1" in
        --probe) probe=${2:-}; shift 2 ;;
        *) echo "Unknown argument: $1" >&2; exit 2 ;;
      esac
    done
    EMPORIX_PROFILE=$alias
    emporix_require_env
    echo "Profile '$alias': tenant=$EMPORIX_TENANT api=$EMPORIX_API_URL token=minted"
    emporix_token_check || { echo "The token minted for profile '$alias' is not a usable JWT — check apiUrl, clientId and clientSecret." >&2; exit 1; }
    if [ -n "$probe" ]; then
      status=$(curl -sS -o /dev/null -w '%{http_code}' "$probe" -H "Authorization: Bearer $EMPORIX_TOKEN" -H "X-Tenant: $EMPORIX_TENANT" -H 'Accept: */*' || echo 000)
      echo "PROBE_HTTP=$status"
      case "$status" in
        401|403) echo "Probe returned HTTP $status — the API client of profile '$alias' lacks the scopes for that endpoint, or the tenant is wrong. Fix the API client, not the token." >&2; exit 1 ;;
      esac
    fi ;;

  *) sed -n '2,11p' "$0"; exit 2 ;;
esac
