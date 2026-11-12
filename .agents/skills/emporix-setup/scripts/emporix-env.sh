#!/usr/bin/env bash
# Resolve Emporix tenant credentials from the developer's profiles file. Source it; never run it.
#
#   . "$(skill_script emporix-setup emporix-env.sh)"
#   EMPORIX_PROFILE=<alias>      # optional: scripts set it from --tenant
#   emporix_require_env          # exports EMPORIX_PROFILE EMPORIX_TENANT EMPORIX_TOKEN EMPORIX_API_URL
#
# Profiles live in ~/.emporix/tenants.json (override the path with EMPORIX_TENANTS_FILE;
# manage with tenants.sh). The alias comes from EMPORIX_PROFILE, else the file's "default",
# else the only profile. The file never holds a token: each profile carries tenant, apiUrl,
# clientId, clientSecret (and optional scopes), and a fresh access token is minted per call
# via POST /oauth/token (client_credentials). Credentials are never taken from environment
# variables and never printed.
#
# Copied from the emporix-md-extension skill (scripts/emporix-env.sh) and reduced to the
# profile path so the QA skills share one credentials store with it.

EMPORIX_TENANTS_FILE="${EMPORIX_TENANTS_FILE:-$HOME/.emporix/tenants.json}"
_emporix_scripts_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

_emporix_mint_token() {  # uses EMPORIX_CLIENT_ID / EMPORIX_CLIENT_SECRET / EMPORIX_SCOPES / EMPORIX_API_URL
  local scope="${EMPORIX_SCOPES:-}" body
  body=$(curl -sS -X POST "$EMPORIX_API_URL/oauth/token" \
    -H 'Content-Type: application/x-www-form-urlencoded' \
    --data-urlencode 'grant_type=client_credentials' \
    --data-urlencode "client_id=$EMPORIX_CLIENT_ID" \
    --data-urlencode "client_secret=$EMPORIX_CLIENT_SECRET" \
    ${scope:+--data-urlencode "scope=$scope"}) || true
  EMPORIX_TOKEN=$(printf '%s' "$body" | python3 -c '
import json, sys
try:
    sys.stdout.write(json.load(sys.stdin).get("access_token") or "")
except Exception:
    pass')
  if [ -z "$EMPORIX_TOKEN" ]; then
    echo "Could not obtain a service token from $EMPORIX_API_URL/oauth/token for tenant ${EMPORIX_TENANT:-?} (check clientId/clientSecret in profile ${EMPORIX_PROFILE:-?})." >&2
    return 1
  fi
}

_emporix_load_profile() {  # $1 = requested alias or empty
  local requested=$1 out
  out=$(python3 - "$EMPORIX_TENANTS_FILE" "$requested" <<'PY'
import json, sys
file, requested = sys.argv[1], sys.argv[2]
try:
    cfg = json.load(open(file))
except Exception as e:
    print(f"Invalid JSON in {file}: {e}", file=sys.stderr); sys.exit(2)
profiles = cfg.get("profiles") or {}
aliases = list(profiles)
alias = requested
if not alias:
    if cfg.get("default") in profiles:
        alias = cfg["default"]
    elif len(aliases) == 1:
        alias = aliases[0]
    else:
        msg = ("Several profiles and no default — pass --tenant <alias>. Available: " + ", ".join(aliases)) if aliases else f"No profiles defined in {file}"
        print(msg, file=sys.stderr); sys.exit(3)
p = profiles.get(alias)
if p is None:
    print(f'Unknown profile "{alias}". Available: ' + ", ".join(aliases), file=sys.stderr); sys.exit(3)
if not p.get("tenant"):
    print(f'Profile "{alias}" has no tenant.', file=sys.stderr); sys.exit(3)
if not (p.get("clientId") and p.get("clientSecret")):
    print(f'Profile "{alias}" is incomplete: set clientId + clientSecret (the token is minted from them).', file=sys.stderr); sys.exit(3)
# \x1f (unit separator): `read` would collapse consecutive tabs and shift empty fields.
print("\x1f".join([alias, p["tenant"], p.get("apiUrl") or "", p["clientId"], p["clientSecret"], p.get("scopes") or "", p.get("language") or ""]))
PY
  ) || return $?
  IFS=$'\x1f' read -r EMPORIX_PROFILE EMPORIX_TENANT _api _cid _csec _scopes _lang <<< "$out"
  [ -n "$_api" ] && EMPORIX_API_URL=$_api
  EMPORIX_CLIENT_ID=$_cid; EMPORIX_CLIENT_SECRET=$_csec
  [ -n "$_scopes" ] && EMPORIX_SCOPES=$_scopes
  [ -n "$_lang" ] && EMPORIX_LANGUAGE=$_lang
  export EMPORIX_PROFILE
}

emporix_require_env() {
  EMPORIX_API_URL=""
  EMPORIX_TENANT=""; EMPORIX_TOKEN=""; EMPORIX_CLIENT_ID=""; EMPORIX_CLIENT_SECRET=""

  if [ ! -f "$EMPORIX_TENANTS_FILE" ]; then
    echo "No tenant profiles at $EMPORIX_TENANTS_FILE." >&2
    echo "Creating a template and opening it — fill in tenant, apiUrl, clientId and clientSecret, then re-run." >&2
    "$_emporix_scripts_dir/tenants.sh" init >&2 || true
    return 1
  fi
  _emporix_load_profile "${EMPORIX_PROFILE:-}" || return 1

  EMPORIX_API_URL="${EMPORIX_API_URL:-https://api.emporix.io}"
  EMPORIX_API_URL="${EMPORIX_API_URL%/}"
  _emporix_mint_token || return 1
  export EMPORIX_TENANT EMPORIX_TOKEN EMPORIX_API_URL
}

# emporix_token_check  — sanity-check the minted $EMPORIX_TOKEN without printing it.
# Prints TOKEN_LEN / TOKEN_PAYLOAD=valid_json|invalid_json|not_jwt / CONTROL_CHARS; returns 1 when
# the token is not a usable JWT (a broken /oauth/token response, wrong apiUrl, …).
emporix_token_check() {
  local out code
  out=$(TOKEN="$EMPORIX_TOKEN" python3 - <<'PY'
import base64, json, os, sys
t = os.environ.get("TOKEN", "").strip()
control = 1 if any(ord(c) < 32 and c not in "\t" for c in t) else 0
parts = t.split("."); status = "not_jwt"
if len(parts) >= 2 and parts[1]:
    s = parts[1]; s += "=" * (-len(s) % 4); s = s.replace("-", "+").replace("_", "/")
    try:
        json.loads(base64.b64decode(s, validate=False).decode("utf-8")); status = "valid_json"
    except Exception:
        status = "invalid_json"
print(f"TOKEN_LEN={len(t)}\nTOKEN_PAYLOAD={status}\nCONTROL_CHARS={control}")
sys.exit(0 if (status == "valid_json" and not control) else 1)
PY
  ); code=$?
  echo "$out"
  return $code
}

# emporix_api METHOD PATH [curl args...]  — prints the body, exits 1 on HTTP >= 400.
emporix_api() {
  local method=$1 path=$2
  shift 2
  local tmp status
  tmp=$(mktemp)
  status=$(curl -sS -o "$tmp" -w '%{http_code}' -X "$method" "$EMPORIX_API_URL$path" \
    -H "Authorization: Bearer $EMPORIX_TOKEN" \
    -H 'Accept: */*' \
    "$@") || { rm -f "$tmp"; return 1; }
  cat "$tmp"
  rm -f "$tmp"
  if [ "$status" -ge 400 ]; then
    echo "" >&2
    echo "HTTP $status from $method $path" >&2
    return 1
  fi
}
