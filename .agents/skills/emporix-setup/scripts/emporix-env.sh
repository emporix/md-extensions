#!/usr/bin/env bash
# Resolve Emporix tenant credentials from the developer's profiles file. Source it; never run it.
#
#   . "$(skill_script emporix-setup emporix-env.sh)"
#   EMPORIX_PROFILE=<alias>      # optional: scripts set it from --tenant
#   emporix_require_env          # exports EMPORIX_PROFILE EMPORIX_TENANT EMPORIX_TOKEN EMPORIX_API_URL
#                                #         EMPORIX_AUTH_KIND (and EMPORIX_TOKEN_EXPIRES for employee tokens)
#
# Profiles live in ~/.emporix/tenants.json (override the path with EMPORIX_TENANTS_FILE;
# manage with tenants.sh). The alias comes from EMPORIX_PROFILE, else the file's "default",
# else the only profile. The file never holds a token. A profile's "auth" picks the kind:
#   client-credentials (default) — tenant, apiUrl, clientId, clientSecret (optional scopes);
#       a fresh access token is minted per call via POST /oauth/token.
#   employee-token — tenant, apiUrl; the token of a signed-in employee (Management Dashboard
#       sign-in) is read from tokenFile (default ~/.emporix/tokens/<alias>), which must be
#       mode 600 and outside any git repository. It must be a JWT that has not expired, whose
#       tenant claim (if any) is the profile's tenant, and whose user is a member of that tenant
#       (GET auth-adapter/users/me/tenants). It cannot be minted by a script: refresh the file
#       from a Management Dashboard sign-in (tenants.sh set-token <alias>).
# Credentials are never taken from environment variables and never printed.
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

# The path to tenants.sh, quoted, for commands the user copies into their own terminal.
_emporix_tenants_cmd() { printf 'bash "%s/tenants.sh"' "$_emporix_scripts_dir"; }

_emporix_refresh_hint() {
  echo "Refresh it in your own terminal (not in the agent chat); it opens the dashboard, tells you what to copy, and checks the result:" >&2
  echo "  $(_emporix_tenants_cmd) refresh ${EMPORIX_PROFILE:-<alias>}" >&2
}

# emporix_employee_profile_hint ALIAS TENANT API_URL — print (stdout) how to add and fill an
# employee-token profile. Used when a profile of the wrong kind meets the Management Dashboard
# local-qa gate, and by tenants.sh list / init when no employee-token profile exists yet.
emporix_employee_profile_hint() {
  local alias=$1 tenant=$2 api=${3:-https://api.emporix.io}
  cat <<HINT
Management Dashboard local-qa needs an employee-token profile (a signed-in employee; an
API-client token gets HTTP 400 from auth-adapter/users/me/tenants and the gate stays up).
Create it in your own terminal (not in the agent chat). It saves the profile, opens the
dashboard, tells you what to copy, and checks the token:
  $(_emporix_tenants_cmd) setup --kind employee-token --api-url $api --tenant $tenant --alias $alias
Then use --tenant $alias. When the token expires: $(_emporix_tenants_cmd) refresh $alias
HINT
}

# _emporix_employee_token_file_ok FILE — the file must be a regular file (not a symlink), readable
# only by its owner (mode 600 or 400), and outside any git work tree. Prints the reason on failure.
_emporix_employee_token_file_ok() {
  local f=$1 mode dir
  if [ ! -e "$f" ]; then
    echo "No employee token for profile '${EMPORIX_PROFILE:-?}' at $f." >&2; return 1
  fi
  if [ -L "$f" ] || [ ! -f "$f" ]; then
    echo "Employee token $f must be a regular file, not a symlink or directory." >&2; return 1
  fi
  mode=$(stat -f '%Lp' "$f" 2>/dev/null || stat -c '%a' "$f" 2>/dev/null || echo "")
  case "$mode" in
    600|400) ;;
    *) echo "Employee token $f has mode ${mode:-unknown}; it must be readable only by you: chmod 600 $f" >&2; return 1 ;;
  esac
  dir=$(cd "$(dirname "$f")" && pwd -P)
  if git -C "$dir" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "Employee token $f is inside a git repository ($(git -C "$dir" rev-parse --show-toplevel)). Keep it outside any repository, e.g. ~/.emporix/tokens/." >&2; return 1
  fi
}

# _emporix_employee_token_claims — validate $EMPORIX_TOKEN as an employee JWT for $EMPORIX_TENANT.
# Prints TOKEN_EXPIRES=<ISO-8601 UTC> on success; prints the reason to stderr and returns:
#   1 not a JWT / no exp, 2 expired (or expires within EMPORIX_TOKEN_MIN_TTL seconds, default 60),
#   3 tenant claim names another tenant.
_emporix_employee_token_claims() {
  TOKEN="$EMPORIX_TOKEN" TENANT="$EMPORIX_TENANT" MIN_TTL="${EMPORIX_TOKEN_MIN_TTL:-60}" python3 -I - <<'PY'
import base64, datetime, json, os, sys, time
t = os.environ["TOKEN"]; tenant = os.environ["TENANT"].lower(); min_ttl = int(os.environ["MIN_TTL"])
parts = t.split(".")
if len(parts) != 3 or not parts[1]:
    print("not a JWT (expected header.payload.signature) — copy localStorage.accessToken, not a cookie or an API-client token", file=sys.stderr); sys.exit(1)
s = parts[1] + "=" * (-len(parts[1]) % 4)
try:
    claims = json.loads(base64.urlsafe_b64decode(s).decode("utf-8"))
    assert isinstance(claims, dict)
except Exception:
    print("the JWT payload is not JSON", file=sys.stderr); sys.exit(1)
exp = claims.get("exp")
if not isinstance(exp, (int, float)) or isinstance(exp, bool):
    print("the JWT has no numeric exp claim", file=sys.stderr); sys.exit(1)
iso = datetime.datetime.fromtimestamp(exp, datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
if exp - time.time() < min_ttl:
    print(f"expired at {iso}" if exp <= time.time() else f"expires at {iso}, in under {min_ttl}s", file=sys.stderr); sys.exit(2)
for k, v in claims.items():
    if k.lower().rsplit("/", 1)[-1] in ("tenant", "tenantid", "tenant_id") and isinstance(v, str) and v and v.lower() != tenant:
        print(f"its {k} claim names another tenant ({v})", file=sys.stderr); sys.exit(3)
print(f"TOKEN_EXPIRES={iso}")
PY
}

_emporix_read_employee_token() {  # uses EMPORIX_TOKEN_FILE; sets EMPORIX_TOKEN, EMPORIX_TOKEN_EXPIRES
  local out code
  if ! _emporix_employee_token_file_ok "$EMPORIX_TOKEN_FILE"; then
    _emporix_refresh_hint; return 1
  fi
  # Surrounding whitespace (a trailing newline from pbpaste/echo) is dropped; nothing else is changed.
  EMPORIX_TOKEN=$(python3 -I -c 'import sys; sys.stdout.write(open(sys.argv[1]).read().strip())' "$EMPORIX_TOKEN_FILE") || return 1
  out=$(_emporix_employee_token_claims 2>&1); code=$?
  if [ $code -ne 0 ]; then
    EMPORIX_TOKEN=""
    echo "The employee token for profile '$EMPORIX_PROFILE' ($EMPORIX_TOKEN_FILE) is not usable: $out." >&2
    _emporix_refresh_hint; return 1
  fi
  EMPORIX_TOKEN_EXPIRES=${out#TOKEN_EXPIRES=}
}

# _emporix_employee_tenant_check — the same call the Management Dashboard local-qa gate makes:
# GET auth-adapter/users/me/tenants must answer 200 and list $EMPORIX_TENANT.
_emporix_employee_tenant_check() {
  local tmp status out code
  tmp=$(mktemp); chmod 600 "$tmp"
  status=$(curl -sS -o "$tmp" -w '%{http_code}' "$EMPORIX_API_URL/auth-adapter/users/me/tenants" \
    -H "Authorization: Bearer $EMPORIX_TOKEN" -H 'Accept: application/json' \
    -H 'Accept-Language: *' -H 'Content-Language: *' 2>/dev/null) || status=000
  if [ "$status" != 200 ]; then
    rm -f "$tmp"
    case "$status" in
      401|403) echo "$EMPORIX_API_URL rejected the employee token of profile '$EMPORIX_PROFILE' (HTTP $status on auth-adapter/users/me/tenants): it was revoked, signed out, or belongs to another environment than apiUrl." >&2
               _emporix_refresh_hint ;;
      *) echo "Could not verify the employee token of profile '$EMPORIX_PROFILE': HTTP $status from $EMPORIX_API_URL/auth-adapter/users/me/tenants." >&2 ;;
    esac
    return 1
  fi
  out=$(TENANT="$EMPORIX_TENANT" python3 -I - "$tmp" <<'PY'
import json, os, sys
tenant = os.environ["TENANT"].lower()
try:
    data = json.load(open(sys.argv[1]))
except Exception:
    print("the tenant list is not JSON"); sys.exit(1)
names = sorted({str(t.get("tenant", "")) for t in data if isinstance(t, dict)} if isinstance(data, list) else set())
if tenant not in {n.lower() for n in names}:
    print("its user is not a member of tenant " + os.environ["TENANT"] + (" (member of: " + ", ".join(names) + ")" if names else "")); sys.exit(1)
PY
  ); code=$?
  rm -f "$tmp"
  if [ $code -ne 0 ]; then
    echo "The employee token of profile '$EMPORIX_PROFILE' is not usable for tenant $EMPORIX_TENANT: $out." >&2
    _emporix_refresh_hint; return 1
  fi
}

_emporix_load_profile() {  # $1 = requested alias or empty
  local requested=$1 out
  out=$(python3 - "$EMPORIX_TENANTS_FILE" "$requested" <<'PY'
import json, os, sys
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
auth = p.get("auth") or "client-credentials"
token_file = ""
if auth == "client-credentials":
    if not (p.get("clientId") and p.get("clientSecret")):
        print(f'Profile "{alias}" is incomplete: set clientId + clientSecret (the token is minted from them).', file=sys.stderr); sys.exit(3)
elif auth == "employee-token":
    token_file = os.path.expanduser(p.get("tokenFile") or os.path.join(os.path.dirname(os.path.abspath(file)), "tokens", alias))
else:
    print(f'Profile "{alias}" has unknown auth "{auth}" (use client-credentials or employee-token).', file=sys.stderr); sys.exit(3)
# \x1f (unit separator): `read` would collapse consecutive tabs and shift empty fields.
print("\x1f".join([alias, p["tenant"], p.get("apiUrl") or "", p.get("clientId") or "", p.get("clientSecret") or "", p.get("scopes") or "", p.get("language") or "", auth, token_file]))
PY
  ) || return $?
  IFS=$'\x1f' read -r EMPORIX_PROFILE EMPORIX_TENANT _api _cid _csec _scopes _lang EMPORIX_AUTH_KIND EMPORIX_TOKEN_FILE <<< "$out"
  [ -n "$_api" ] && EMPORIX_API_URL=$_api
  EMPORIX_CLIENT_ID=$_cid; EMPORIX_CLIENT_SECRET=$_csec
  [ -n "$_scopes" ] && EMPORIX_SCOPES=$_scopes
  [ -n "$_lang" ] && EMPORIX_LANGUAGE=$_lang
  export EMPORIX_PROFILE EMPORIX_AUTH_KIND
}

emporix_require_env() {
  EMPORIX_API_URL=""
  EMPORIX_TENANT=""; EMPORIX_TOKEN=""; EMPORIX_CLIENT_ID=""; EMPORIX_CLIENT_SECRET=""
  EMPORIX_AUTH_KIND=""; EMPORIX_TOKEN_FILE=""; EMPORIX_TOKEN_EXPIRES=""

  if [ ! -f "$EMPORIX_TENANTS_FILE" ]; then
    echo "No tenant profiles yet ($EMPORIX_TENANTS_FILE)." >&2
    echo "Create one in your own terminal (not in the agent chat); it asks what you test, the environment and the tenant:" >&2
    echo "  $(_emporix_tenants_cmd) setup" >&2
    return 1
  fi
  if [ -f "$HOME/.emporix-qa.env" ]; then
    echo "Note: $HOME/.emporix-qa.env is no longer read (EMPORIX_QA_TENANT / EMPORIX_QA_TOKEN). Credentials come from $EMPORIX_TENANTS_FILE; for the dashboard create an employee-token profile with: $(_emporix_tenants_cmd) setup — then delete the old file." >&2
  fi
  _emporix_load_profile "${EMPORIX_PROFILE:-}" || return 1

  EMPORIX_API_URL="${EMPORIX_API_URL:-https://api.emporix.io}"
  EMPORIX_API_URL="${EMPORIX_API_URL%/}"
  if [ "$EMPORIX_AUTH_KIND" = "employee-token" ]; then
    _emporix_read_employee_token || return 1
    _emporix_employee_tenant_check || return 1
  else
    _emporix_mint_token || return 1
  fi
  export EMPORIX_TENANT EMPORIX_TOKEN EMPORIX_API_URL EMPORIX_AUTH_KIND EMPORIX_TOKEN_EXPIRES
}

# emporix_token_check  — sanity-check the minted $EMPORIX_TOKEN without printing it.
# Prints TOKEN_LEN / TOKEN_PAYLOAD=valid_json|opaque|invalid_json|not_jwt / CONTROL_CHARS; returns 1
# when the token is not usable (a broken /oauth/token response, wrong apiUrl, …).
#   valid_json   — a JWT whose payload decodes to JSON
#   opaque       — a single-segment bearer token (Emporix client-credentials tokens are opaque,
#                  not JWTs): at least 16 characters of [A-Za-z0-9_~+/=-]
#   invalid_json — JWT-shaped, but the payload is not JSON
#   not_jwt      — neither, or any whitespace anywhere, leading and trailing included (empty, too
#                  short, spaces, line breaks, quotes, an HTML or JSON error body, …)
# With EMPORIX_AUTH_KIND=employee-token only valid_json passes: employee tokens are JWTs.
# This only catches a malformed token; whether the API accepts it is the probe's job.
emporix_token_check() {
  local out code
  out=$(TOKEN="$EMPORIX_TOKEN" KIND="${EMPORIX_AUTH_KIND:-}" python3 -I - <<'PY'
import base64, json, os, re, sys
# Validate the exact value the scripts send on; never trim it.
t = os.environ.get("TOKEN", "")
control = 1 if any(ord(c) < 32 and c not in "\t" for c in t) else 0
parts = t.split("."); status = "not_jwt"
if any(c.isspace() for c in t):
    pass  # spaces, tabs or line breaks anywhere (also leading/trailing): not usable as a Bearer value
elif len(parts) >= 2 and parts[1]:
    s = parts[1]; s += "=" * (-len(s) % 4); s = s.replace("-", "+").replace("_", "/")
    try:
        json.loads(base64.b64decode(s, validate=False).decode("utf-8")); status = "valid_json"
    except Exception:
        status = "invalid_json"
elif len(parts) == 1 and re.fullmatch(r"[A-Za-z0-9_~+/=-]{16,}", t):
    status = "opaque"
print(f"TOKEN_LEN={len(t)}\nTOKEN_PAYLOAD={status}\nCONTROL_CHARS={control}")
ok = ("valid_json",) if os.environ.get("KIND") == "employee-token" else ("valid_json", "opaque")
sys.exit(0 if (status in ok and not control) else 1)
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
