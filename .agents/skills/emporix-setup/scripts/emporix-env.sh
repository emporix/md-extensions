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
#       (GET auth-adapter/users/me/tenants). With "email" (and a password) in the profile, a missing
#       or expiring token is fetched by signing in (POST auth-adapter/login, the dashboard's own
#       login; dedicated test accounts without SSO or MFA). The API gateway lets that call through
#       only with an API-client token, minted from "loginClient" (a client-credentials alias), else
#       from the only client-credentials profile with the same tenant and apiUrl. Without an email,
#       refresh the file from a Management Dashboard sign-in (tenants.sh refresh <alias>).
# Secret fields (clientSecret, password, storefrontClientSecret) hold the value or, on macOS, a
# "keychain:<service>" reference: the item (that service, account = the profile alias) is read
# with `security`, and macOS asks for approval on every read when the item was stored with an
# empty trusted-application list (tenants.sh set-secret). On macOS a profile with an email and no
# password reads the item emporix-tenants.<alias>.password. Credentials are never taken from
# environment variables and never printed.

EMPORIX_TENANTS_FILE="${EMPORIX_TENANTS_FILE:-$HOME/.emporix/tenants.json}"
_emporix_scripts_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

_emporix_mint_token() {  # uses EMPORIX_CLIENT_ID / EMPORIX_CLIENT_SECRET / EMPORIX_SCOPES / EMPORIX_API_URL
  local scope="${EMPORIX_SCOPES:-}" body
  # The secret goes on stdin (printf is a builtin), never as a curl argument visible in ps.
  body=$(printf '%s' "$EMPORIX_CLIENT_SECRET" | curl -sS -X POST "$EMPORIX_API_URL/oauth/token" \
    -H 'Content-Type: application/x-www-form-urlencoded' \
    --data-urlencode 'grant_type=client_credentials' \
    --data-urlencode "client_id=$EMPORIX_CLIENT_ID" \
    --data-urlencode "client_secret@-" \
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
  if [ -n "${EMPORIX_EMAIL:-}" ]; then
    echo "Sign in again in your own terminal (not in the agent chat) with the profile's email and password:" >&2
    echo "  $(_emporix_tenants_cmd) refresh ${EMPORIX_PROFILE:-<alias>}" >&2
    echo "or paste a token from a dashboard sign-in instead:" >&2
    echo "  $(_emporix_tenants_cmd) refresh ${EMPORIX_PROFILE:-<alias>} --paste" >&2
    return 0
  fi
  echo "Refresh it in your own terminal (not in the agent chat); it opens the dashboard, tells you what to copy, and checks the result:" >&2
  echo "  $(_emporix_tenants_cmd) refresh ${EMPORIX_PROFILE:-<alias>}" >&2
}

# _emporix_is_macos — the macOS Keychain is available. EMPORIX_PLATFORM overrides `uname -s`
# (tests); EMPORIX_SECURITY_CMD overrides the `security` tool (tests).
_emporix_is_macos() { [ "${EMPORIX_PLATFORM:-$(uname -s 2>/dev/null)}" = Darwin ]; }
_emporix_security() { ${EMPORIX_SECURITY_CMD:-security} "$@"; }

# _emporix_resolve_secret FIELD VALUE — print (stdout, no newline) the secret a profile field holds.
# "keychain:<service>" reads the macOS Keychain item with that service and account = the profile
# alias; anything else is the value itself. Never prints the secret anywhere else.
_emporix_resolve_secret() {
  local field=$1 value=$2 service out errf err code
  case "$value" in
    keychain:*)
      service=${value#keychain:}
      if ! _emporix_is_macos; then
        echo "Profile '$EMPORIX_PROFILE': $field is a macOS Keychain reference ($value), but this system has no macOS Keychain. Store the value in the profile instead, in your own terminal:" >&2
        echo "  $(_emporix_tenants_cmd) set-secret $EMPORIX_PROFILE $field" >&2
        return 1
      fi
      errf=$(mktemp)
      if out=$(_emporix_security find-generic-password -s "$service" -a "$EMPORIX_PROFILE" -w 2>"$errf"); then
        rm -f "$errf"
        printf '%s' "$out"
        return 0
      fi
      code=$?; err=$(tr '\n' ' ' <"$errf"); rm -f "$errf"
      case "$err" in
        *"could not be found"*) err="there is no Keychain item '$service' for account '$EMPORIX_PROFILE'" ;;
        *) err="the read was denied or failed (${err:-exit $code})" ;;
      esac
      echo "Profile '$EMPORIX_PROFILE': cannot read $field from the macOS Keychain: $err." >&2
      echo "Store it again in your own terminal (not in the agent chat):" >&2
      echo "  $(_emporix_tenants_cmd) set-secret $EMPORIX_PROFILE $field" >&2
      if [ "$field" = password ]; then
        echo "or paste a token from a dashboard sign-in instead: $(_emporix_tenants_cmd) refresh $EMPORIX_PROFILE --paste" >&2
      fi
      return 1 ;;
    *) printf '%s' "$value" ;;
  esac
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

# _emporix_employee_token_fresh — quiet: the token file exists and holds a JWT for this tenant that
# does not expire within EMPORIX_TOKEN_MIN_TTL. Leaves EMPORIX_TOKEN empty.
_emporix_employee_token_fresh() {
  local code
  [ -f "$EMPORIX_TOKEN_FILE" ] && [ ! -L "$EMPORIX_TOKEN_FILE" ] || return 1
  EMPORIX_TOKEN=$(python3 -I -c 'import sys; sys.stdout.write(open(sys.argv[1]).read().strip())' "$EMPORIX_TOKEN_FILE" 2>/dev/null) || { EMPORIX_TOKEN=""; return 1; }
  _emporix_employee_token_claims >/dev/null 2>&1; code=$?
  EMPORIX_TOKEN=""
  return $code
}

# _emporix_login_client_header — print the path of a mode-600 header file holding the bearer of an
# API-client token minted from the profile's login client. auth-adapter/login sits behind the API
# gateway (sharedAuthWithIdp), which refuses a request without a valid token before the password
# is ever checked. Run it in a command substitution: the swapped profile, client, and token stay in
# that subshell.
_emporix_login_client_header() {
  if [ -z "$_emporix_login_client" ]; then
    echo "Profile '$EMPORIX_PROFILE' cannot sign in: $_emporix_login_client_error. auth-adapter/login is behind the API gateway and needs an API-client token first." >&2
    echo "Add a client-credentials profile for tenant $EMPORIX_TENANT on $EMPORIX_API_URL ($(_emporix_tenants_cmd) setup --kind client-credentials), or name one in this profile as \"loginClient\": \"<alias>\" ($(_emporix_tenants_cmd) open)." >&2
    return 1
  fi
  EMPORIX_PROFILE=$_emporix_login_client
  EMPORIX_CLIENT_ID=$_emporix_login_client_id
  EMPORIX_SCOPES=$_emporix_login_client_scopes
  EMPORIX_CLIENT_SECRET=$(_emporix_resolve_secret clientSecret "$_emporix_login_client_secret") || return 1
  _emporix_mint_token || return 1
  EMPORIX_CLIENT_SECRET=""
  _emporix_auth_header_file
}

# _emporix_employee_login — sign in with the profile's email and password through
# POST auth-adapter/login (form email + password, bearer of the login client's token; answers
# {"jwtToken": …}) and store the JWT in EMPORIX_TOKEN_FILE (mode 600). The password reaches curl on
# stdin and the bearer through a header file, never in its arguments.
_emporix_employee_login() {
  local pw tmp status dir hdr
  if [ -L "$EMPORIX_TOKEN_FILE" ]; then
    echo "Employee token $EMPORIX_TOKEN_FILE must be a regular file, not a symlink." >&2; return 1
  fi
  dir=$(dirname "$EMPORIX_TOKEN_FILE")
  mkdir -p "$dir" && chmod 700 "$dir" 2>/dev/null
  if git -C "$dir" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "Employee token $EMPORIX_TOKEN_FILE is inside a git repository ($(git -C "$dir" rev-parse --show-toplevel)). Keep it outside any repository, e.g. ~/.emporix/tokens/." >&2; return 1
  fi
  tmp=$(umask 077; mktemp) || return 1
  hdr=$(_emporix_login_client_header) || { rm -f "$tmp"; return 1; }
  pw=$(_emporix_resolve_secret password "$_emporix_password") || { rm -f "$hdr" "$tmp"; return 1; }
  status=$(printf '%s' "$pw" | curl -sS -o "$tmp" -w '%{http_code}' -X POST "$EMPORIX_API_URL/auth-adapter/login" \
    -H @"$hdr" -H 'Content-Type: application/x-www-form-urlencoded' -H 'Accept: application/json' \
    --data-urlencode "email=$EMPORIX_EMAIL" --data-urlencode "password@-" 2>/dev/null) || status=000
  pw=""
  rm -f "$hdr"
  if [ "$status" != 200 ]; then
    rm -f "$tmp"
    echo "Sign-in failed for profile '$EMPORIX_PROFILE' ($EMPORIX_EMAIL): HTTP $status from $EMPORIX_API_URL/auth-adapter/login (API client: $_emporix_login_client). Check the email and the password of this test account, then store the password again in your own terminal:" >&2
    echo "  $(_emporix_tenants_cmd) set-secret $EMPORIX_PROFILE password" >&2
    return 1
  fi
  if ! python3 -I - "$tmp" "$EMPORIX_TOKEN_FILE" <<'PY'
import json, os, sys, tempfile
src, dst = sys.argv[1], sys.argv[2]
try:
    tok = json.load(open(src)).get("jwtToken") or ""
except Exception:
    tok = ""
if not isinstance(tok, str) or tok.count(".") != 2:
    sys.exit(1)
fd, tmp = tempfile.mkstemp(dir=os.path.dirname(os.path.abspath(dst)), prefix=".login.")
with os.fdopen(fd, "w") as f:
    f.write(tok + "\n")
os.chmod(tmp, 0o600)
os.replace(tmp, dst)
PY
  then
    rm -f "$tmp"
    echo "Sign-in for profile '$EMPORIX_PROFILE' answered HTTP 200 without a jwtToken from $EMPORIX_API_URL/auth-adapter/login." >&2
    return 1
  fi
  rm -f "$tmp"
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

# _emporix_auth_header_file — print the path of a new mode-600 file holding
# "Authorization: Bearer $EMPORIX_TOKEN", for `curl -H @file`: the token never becomes a process
# argument (visible in ps). printf is a shell builtin. The caller removes the file.
_emporix_auth_header_file() {
  local f
  f=$(mktemp) || return 1
  chmod 600 "$f"
  printf 'Authorization: Bearer %s\n' "$EMPORIX_TOKEN" >"$f"
  printf '%s' "$f"
}

# _emporix_employee_tenant_check — the same call the Management Dashboard local-qa gate makes:
# GET auth-adapter/users/me/tenants must answer 200 and list $EMPORIX_TENANT.
_emporix_employee_tenant_check() {
  local tmp status out code hdr
  tmp=$(mktemp); chmod 600 "$tmp"
  hdr=$(_emporix_auth_header_file) || { rm -f "$tmp"; return 1; }
  status=$(curl -sS -o "$tmp" -w '%{http_code}' "$EMPORIX_API_URL/auth-adapter/users/me/tenants" \
    -H @"$hdr" -H 'Accept: application/json' \
    -H 'Accept-Language: *' -H 'Content-Language: *' 2>/dev/null) || status=000
  rm -f "$hdr"
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
  local requested=$1 out mac=0
  _emporix_is_macos && mac=1
  out=$(python3 - "$EMPORIX_TENANTS_FILE" "$requested" "$mac" <<'PY'
import json, os, sys
file, requested, mac = sys.argv[1], sys.argv[2], sys.argv[3] == "1"
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
password = p.get("password") or ""
def api_of(q):
    return (q.get("apiUrl") or "https://api.emporix.io").rstrip("/")
def is_client(q):
    return isinstance(q, dict) and (q.get("auth") or "client-credentials") == "client-credentials" and bool(q.get("clientId") and q.get("clientSecret"))
login = ["", "", "", "", ""]  # alias, clientId, clientSecret, scopes, why none
if auth == "client-credentials":
    if not (p.get("clientId") and p.get("clientSecret")):
        print(f'Profile "{alias}" is incomplete: set clientId + clientSecret (the token is minted from them).', file=sys.stderr); sys.exit(3)
elif auth == "employee-token":
    token_file = os.path.expanduser(p.get("tokenFile") or os.path.join(os.path.dirname(os.path.abspath(file)), "tokens", alias))
    if password and not p.get("email"):
        print(f'Profile "{alias}" is incomplete: a password needs the email of the test account (sign-in); without both the token is pasted.', file=sys.stderr); sys.exit(3)
    if p.get("email") and not password:
        if not mac:
            print(f'Profile "{alias}" is incomplete: set the password of {p["email"]} (tenants.sh set-secret {alias} password), or remove the email (pasted token).', file=sys.stderr); sys.exit(3)
        password = f"keychain:emporix-tenants.{alias}.password"  # no password in the file: the Keychain item
    if p.get("email"):
        want = p.get("loginClient")
        want = "" if want is None else want
        if not isinstance(want, str):
            login[4] = 'its loginClient must be the alias of a profile (a string)'
        elif want:
            q = profiles.get(want)
            if q is None:
                login[4] = f'its loginClient "{want}" is not a profile in {file}'
            elif not is_client(q):
                login[4] = f'its loginClient "{want}" is not a complete client-credentials profile (clientId + clientSecret)'
            elif api_of(q) != api_of(p):
                login[4] = f'its loginClient "{want}" uses {api_of(q)}, not {api_of(p)}'
        else:
            fits = [a for a, q in profiles.items() if a != alias and is_client(q) and q.get("tenant") == p["tenant"] and api_of(q) == api_of(p)]
            if len(fits) == 1:
                want = fits[0]
            elif fits:
                login[4] = "several client-credentials profiles fit (" + ", ".join(fits) + '); name one as "loginClient"'
            else:
                login[4] = f'no client-credentials profile for tenant {p["tenant"]} on {api_of(p)}'
        if not login[4]:
            q = profiles[want]
            login[:4] = [want, q["clientId"], q["clientSecret"], q.get("scopes") or ""]
else:
    print(f'Profile "{alias}" has unknown auth "{auth}" (use client-credentials or employee-token).', file=sys.stderr); sys.exit(3)
fields = [alias, p["tenant"], p.get("apiUrl") or "", p.get("clientId") or "", p.get("clientSecret") or "", p.get("scopes") or "", p.get("language") or "", auth, token_file,
          p.get("email") or "", password, p.get("storefrontClientId") or "", p.get("storefrontClientSecret") or ""] + login
if any("\x1f" in f or "\n" in f for f in fields):
    print(f'Profile "{alias}" has a value with a line break or control character.', file=sys.stderr); sys.exit(3)
# \x1f (unit separator): `read` would collapse consecutive tabs and shift empty fields.
print("\x1f".join(fields))
PY
  ) || return $?
  IFS=$'\x1f' read -r EMPORIX_PROFILE EMPORIX_TENANT _api _cid _csec _scopes _lang EMPORIX_AUTH_KIND EMPORIX_TOKEN_FILE \
    EMPORIX_EMAIL _emporix_password EMPORIX_STOREFRONT_CLIENT_ID _emporix_storefront_secret \
    _emporix_login_client _emporix_login_client_id _emporix_login_client_secret _emporix_login_client_scopes \
    _emporix_login_client_error <<< "$out"
  [ -n "$_api" ] && EMPORIX_API_URL=$_api
  # Secret fields stay unresolved here (a keychain: reference is read only when it is needed).
  EMPORIX_CLIENT_ID=$_cid; _emporix_client_secret=$_csec; EMPORIX_CLIENT_SECRET=""
  [ -n "$_scopes" ] && EMPORIX_SCOPES=$_scopes
  [ -n "$_lang" ] && EMPORIX_LANGUAGE=$_lang
  export EMPORIX_PROFILE EMPORIX_AUTH_KIND
}

# emporix_load_api_clients — for Postman/Newman environments: load the profile (EMPORIX_PROFILE, else
# the default) without minting, and set EMPORIX_TENANT, EMPORIX_API_URL, EMPORIX_CLIENT_ID,
# EMPORIX_CLIENT_SECRET, EMPORIX_STOREFRONT_CLIENT_ID, EMPORIX_STOREFRONT_CLIENT_SECRET (secrets
# resolved, keychain: references included). Nothing is exported or printed.
emporix_load_api_clients() {
  EMPORIX_API_URL=""; EMPORIX_CLIENT_SECRET=""; EMPORIX_STOREFRONT_CLIENT_SECRET=""
  [ -f "$EMPORIX_TENANTS_FILE" ] || { echo "No tenant profiles yet ($EMPORIX_TENANTS_FILE). Create one with: $(_emporix_tenants_cmd) setup" >&2; return 1; }
  _emporix_load_profile "${EMPORIX_PROFILE:-}" || return 1
  if [ "$EMPORIX_AUTH_KIND" != client-credentials ]; then
    echo "Profile '$EMPORIX_PROFILE' is an employee-token profile; API collections need a client-credentials profile (clientId + clientSecret)." >&2; return 1
  fi
  EMPORIX_API_URL="${EMPORIX_API_URL:-https://api.emporix.io}"; EMPORIX_API_URL="${EMPORIX_API_URL%/}"
  EMPORIX_CLIENT_SECRET=$(_emporix_resolve_secret clientSecret "$_emporix_client_secret") || return 1
  if [ -n "$_emporix_storefront_secret" ]; then
    EMPORIX_STOREFRONT_CLIENT_SECRET=$(_emporix_resolve_secret storefrontClientSecret "$_emporix_storefront_secret") || return 1
  fi
}

emporix_require_env() {
  EMPORIX_API_URL=""
  EMPORIX_TENANT=""; EMPORIX_TOKEN=""; EMPORIX_CLIENT_ID=""; EMPORIX_CLIENT_SECRET=""
  EMPORIX_AUTH_KIND=""; EMPORIX_TOKEN_FILE=""; EMPORIX_TOKEN_EXPIRES=""
  EMPORIX_EMAIL=""; _emporix_password=""; _emporix_client_secret=""
  EMPORIX_STOREFRONT_CLIENT_ID=""; _emporix_storefront_secret=""
  _emporix_login_client=""; _emporix_login_client_id=""; _emporix_login_client_secret=""
  _emporix_login_client_scopes=""; _emporix_login_client_error=""

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
    # Sign in only when the profile can (email + password) and the cached token is missing, expiring,
    # or a fresh one was asked for (tenants.sh refresh); a fresh cached token never reads the password.
    if [ -n "$EMPORIX_EMAIL" ] && { [ -n "${EMPORIX_FORCE_LOGIN:-}" ] || ! _emporix_employee_token_fresh; }; then
      _emporix_employee_login || return 1
    fi
    _emporix_read_employee_token || return 1
    _emporix_employee_tenant_check || return 1
  else
    EMPORIX_CLIENT_SECRET=$(_emporix_resolve_secret clientSecret "$_emporix_client_secret") || return 1
    _emporix_mint_token || { EMPORIX_CLIENT_SECRET=""; return 1; }
    EMPORIX_CLIENT_SECRET=""
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
  local tmp status hdr
  tmp=$(mktemp)
  hdr=$(_emporix_auth_header_file) || { rm -f "$tmp"; return 1; }
  status=$(curl -sS -o "$tmp" -w '%{http_code}' -X "$method" "$EMPORIX_API_URL$path" \
    -H @"$hdr" \
    -H 'Accept: */*' \
    "$@") || { rm -f "$tmp" "$hdr"; return 1; }
  rm -f "$hdr"
  cat "$tmp"
  rm -f "$tmp"
  if [ "$status" -ge 400 ]; then
    echo "" >&2
    echo "HTTP $status from $method $path" >&2
    return 1
  fi
}
