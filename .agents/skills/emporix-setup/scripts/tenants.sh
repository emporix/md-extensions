#!/usr/bin/env bash
# Manage Emporix tenant profiles in ~/.emporix/tenants.json (override with EMPORIX_TENANTS_FILE).
# Shared by the emporix-* skills (QA UI, demo recording, MD extensions).
#
#   tenants.sh setup                       # guided: asks what you test, the environment and tenant, writes the profile, gets its token
#     [--kind employee-token|client-credentials] [--env dev|stage|prod | --api-url URL]
#     [--tenant T] [--alias A] [--login password|paste] [--email E] [--default] [--no-open]
#                                          # answers you already know; the rest is asked
#   tenants.sh refresh <alias> [--paste] [--no-open]
#                                          # employee-token: signs in again with the profile's email and password;
#                                          # without them (or with --paste) opens the dashboard, says what to copy, stores the token
#   tenants.sh set-secret <alias> [password|clientSecret|storefrontClientSecret] [--store keychain|file]
#                                          # store a secret read hidden from your terminal; on macOS you choose the
#                                          # Keychain (empty trusted-application list, so every read asks you) or
#                                          # this file; elsewhere always this file
#   tenants.sh init                        # create the file from a template if missing (chmod 600) and open it in the editor
#   tenants.sh open                        # open the file in the editor
#   tenants.sh list                        # table of profiles and their auth kind — never prints secrets
#   tenants.sh check <alias> [--probe URL] # get the profile's token (minted, read, or signed in) and validate it; optional GET probe
#   tenants.sh copy-token <alias>          # get the profile's token (signing in or minting as needed) and copy it to the
#                                          # clipboard for a Tenant/Token gate in your own browser; never prints it
#   tenants.sh set-token <alias>           # employee-token profiles: store the token read from stdin (mode 600), then check it
#                                          #   e.g. pbpaste | tenants.sh set-token acme-admin
#   tenants.sh path                        # print the file path
#
# Auth kinds ("auth" in a profile):
#   client-credentials (default) clientId + clientSecret; a token is minted per run via POST /oauth/token.
#   employee-token               the token of a signed-in employee, needed where an API-client token is
#                                refused (Management Dashboard local-qa: auth-adapter/users/me/tenants).
#                                Read from tokenFile (default ~/.emporix/tokens/<alias>, mode 600, outside
#                                any git repo). With email + password (a dedicated test account without SSO
#                                or MFA) a missing or expiring token is fetched via POST auth-adapter/login,
#                                called with the token of an API client: "loginClient" (a client-credentials
#                                alias), else the only client-credentials profile with the same tenant and apiUrl.
#                                Without them, tenants.sh refresh <alias> opens the dashboard and tells you to
#                                run copy(localStorage.accessToken). Manual: pbpaste | tenants.sh set-token <alias>.
# Secrets: on macOS password / clientSecret / storefrontClientSecret may be "keychain:<service>" (account =
# alias) or the value in this file (mode 600), as you choose in set-secret; a profile with an email and no
# password reads the Keychain item emporix-tenants.<alias>.password. Other systems keep them in this file.
#
# Editor: $EMPORIX_EDITOR, else cursor, code, open (macOS), xdg-open.
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd)
self="$here/$(basename "$0")"
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
    "Emporix tenant profiles used by the emporix-* agent skills. Keep this file private (chmod 600). It never stores a token.",
    "Each key under 'profiles' is an alias you will use in conversation (e.g. 'acme', 'acme-stage').",
    "tenant       : Emporix tenant name (required).",
    "apiUrl       : https://api.emporix.io (prod, default) | https://api-stage.emporix.io | https://api-develop.emporix.io",
    "auth         : client-credentials (default) | employee-token.",
    "clientId / clientSecret : client-credentials only (required). An access token is minted per run via POST /oauth/token.",
    "employee-token : for the Management Dashboard local-qa gate, which needs a signed-in employee. The token is read from tokenFile (default ~/.emporix/tokens/<alias>, mode 600). Store it with: pbpaste | tenants.sh set-token <alias> after copy(localStorage.accessToken) in a dashboard sign-in.",
    "email / password : employee-token only, optional: a dedicated test account (no SSO, no MFA); the token is then fetched via POST auth-adapter/login when missing or expiring. password is the value or, on macOS, keychain:<service> (tenants.sh set-secret <alias> password asks which); on macOS an email without a password reads the Keychain item emporix-tenants.<alias>.password.",
    "loginClient  : employee-token with email, optional: alias of a client-credentials profile whose token calls auth-adapter/login (the API gateway needs one). Default: the only client-credentials profile with the same tenant and apiUrl.",
    "storefrontClientId / storefrontClientSecret : optional storefront API client for Postman collections (cart, customer, checkout).",
    "Secret fields may be keychain:<service> on macOS (item account = alias); every read then shows the macOS prompt. Click Allow, never Always Allow.",
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
    },
    "my-tenant-admin": {
      "tenant": "my-tenant",
      "apiUrl": "https://api.emporix.io",
      "auth": "employee-token",
      "description": "employee sign-in for the Management Dashboard local-qa gate"
    }
  }
}
EOF
  chmod 600 "$file"
}

say() { printf '%s\n' "$*" >&2; }
die() { say "$*"; exit 1; }
# ask PROMPT DEFAULT — prompt on stderr, answer from stdin (a terminal, or piped answers in tests).
ask() {
  local prompt=$1 def=${2:-} ans=""
  if [ -n "$def" ]; then printf '%s [%s]: ' "$prompt" "$def" >&2; else printf '%s: ' "$prompt" >&2; fi
  IFS= read -r ans || true
  [ -t 0 ] || printf '\n' >&2
  printf '%s' "${ans:-$def}"
}
# ask_secret PROMPT — one line, hidden on a terminal and never echoed. A terminal in canonical
# mode caps a line at about 1024 bytes (macOS MAX_CANON), so a pasted dashboard token (~3.5 KB)
# would never complete with `read -s`; read it non-canonically instead. Typeahead is kept
# (TCSANOW). Off a terminal, read byte by byte so later answers stay on stdin.
ask_secret() {
  PROMPT="$1" python3 -I -c '
import os, sys, termios
fd = sys.stdin.fileno()
buf = bytearray()
def until_eol(read):
    while True:
        c = read()
        if not c:
            return
        for b in c:
            if b in (10, 13):
                return True
            buf.append(b)
if os.isatty(fd):
    old = termios.tcgetattr(fd)
    new = termios.tcgetattr(fd)
    new[3] &= ~(termios.ECHO | termios.ICANON)
    new[6][termios.VMIN], new[6][termios.VTIME] = 1, 0
    termios.tcsetattr(fd, termios.TCSANOW, new)
    # Prompt only once the terminal is non-canonical, so an immediate paste is not capped.
    sys.stderr.write(os.environ["PROMPT"] + ": "); sys.stderr.flush()
    try:
        until_eol(lambda: os.read(fd, 4096))
    finally:
        termios.tcsetattr(fd, termios.TCSANOW, old)
else:
    sys.stderr.write(os.environ["PROMPT"] + ": "); sys.stderr.flush()
    until_eol(lambda: os.read(fd, 1))
sys.stdout.write(buf.decode("utf-8", "replace"))
' || true
  printf '\n' >&2
}
dashboard_url() {
  case "${1%/}" in
    https://api-develop.emporix.io) echo https://dev-admin.emporix.io ;;
    https://api-stage.emporix.io) echo https://stage-admin.emporix.io ;;
    https://api.emporix.io) echo https://admin.emporix.io ;;
    *) echo "" ;;
  esac
}
devportal_url() {
  case "${1%/}" in
    https://api-develop.emporix.io) echo https://ory-app.emporix.io ;;
    https://api-stage.emporix.io) echo https://stage-app.emporix.io ;;
    *) echo https://app.emporix.io ;;
  esac
}
# clipboard_cmd — print a command that writes the clipboard to stdout (EMPORIX_CLIPBOARD_CMD wins).
clipboard_cmd() {
  if [ -n "${EMPORIX_CLIPBOARD_CMD:-}" ]; then echo "$EMPORIX_CLIPBOARD_CMD"; return 0; fi
  if command -v pbpaste >/dev/null 2>&1; then echo pbpaste; return 0; fi
  if [ -n "${WAYLAND_DISPLAY:-}" ] && command -v wl-paste >/dev/null 2>&1; then echo "wl-paste --no-newline"; return 0; fi
  if command -v xclip >/dev/null 2>&1; then echo "xclip -o -selection clipboard"; return 0; fi
  return 1
}
# copy_cmd — print a command that writes stdin to the clipboard (EMPORIX_COPY_CMD wins; run with sh -c).
copy_cmd() {
  if [ -n "${EMPORIX_COPY_CMD:-}" ]; then echo "$EMPORIX_COPY_CMD"; return 0; fi
  if command -v pbcopy >/dev/null 2>&1; then echo pbcopy; return 0; fi
  if [ -n "${WAYLAND_DISPLAY:-}" ] && command -v wl-copy >/dev/null 2>&1; then echo wl-copy; return 0; fi
  if command -v xclip >/dev/null 2>&1; then echo "xclip -selection clipboard -i"; return 0; fi
  if command -v clip.exe >/dev/null 2>&1; then echo clip.exe; return 0; fi
  return 1
}
# refuse_token_as_name WHAT VALUE — stop when a name answer looks like a pasted token.
refuse_token_as_name() {
  case "$2" in
    *.*.*|????????????????????????????????????????????????????????????????*)
      die "That $1 looks like a pasted token, not a name. Nothing was saved. Clear the terminal (Cmd+K, or run clear) so the token does not stay in the scrollback, then run setup again and paste the token only when asked for it." ;;
  esac
}
profile_exists() {
  python3 - "$file" "$1" <<'PY' 2>/dev/null
import json, sys
sys.exit(0 if sys.argv[2] in (json.load(open(sys.argv[1])).get("profiles") or {}) else 1)
PY
}
# upsert_profile ALIAS — write one profile from the PROFILE_* variables (secrets via the
# environment, never argv). Creates the file (mode 600) when missing and replaces it atomically.
upsert_profile() {
  mkdir -p "$(dirname "$file")"
  ( umask 077; python3 - "$file" "$1" <<'PY'
import json, os, sys, tempfile
file, alias = sys.argv[1], sys.argv[2]
cfg = json.load(open(file)) if os.path.exists(file) else {}
profiles = cfg.setdefault("profiles", {})
e = os.environ
p = {"tenant": e["PROFILE_TENANT"], "apiUrl": e["PROFILE_API"]}
if e["PROFILE_KIND"] == "employee-token":
    p["auth"] = "employee-token"
    if e.get("PROFILE_EMAIL"):
        p["email"] = e["PROFILE_EMAIL"]
    p["description"] = "employee sign-in for Management Dashboard local-qa"
else:
    p["clientId"] = e["PROFILE_CID"]
    p["clientSecret"] = e["PROFILE_CSEC"]
    if e.get("PROFILE_SCOPES"):
        p["scopes"] = e["PROFILE_SCOPES"]
profiles[alias] = p
if e.get("PROFILE_DEFAULT") or cfg.get("default") not in profiles:
    cfg["default"] = alias
fd, tmp = tempfile.mkstemp(dir=os.path.dirname(os.path.abspath(file)), prefix=".tenants.")
with os.fdopen(fd, "w") as f:
    json.dump(cfg, f, indent=2)
    f.write("\n")
os.chmod(tmp, 0o600)
os.replace(tmp, file)
PY
  )
}

# set_profile_field ALIAS FIELD — set one field of a profile from $PROFILE_FIELD_VALUE (never argv);
# atomic, mode 600.
set_profile_field() {
  ( umask 077; python3 - "$file" "$1" "$2" <<'PY'
import json, os, sys, tempfile
file, alias, field = sys.argv[1:4]
cfg = json.load(open(file))
cfg["profiles"][alias][field] = os.environ["PROFILE_FIELD_VALUE"]
fd, tmp = tempfile.mkstemp(dir=os.path.dirname(os.path.abspath(file)), prefix=".tenants.")
with os.fdopen(fd, "w") as f:
    json.dump(cfg, f, indent=2)
    f.write("\n")
os.chmod(tmp, 0o600)
os.replace(tmp, file)
PY
  )
}

# keychain_store SERVICE ACCOUNT — store $SECRET_VALUE as a generic password with an empty
# trusted-application list, so macOS asks on every read. An existing item is deleted first: that
# also resets a list widened by "Always Allow". The value travels hex-encoded on the stdin of
# `security -i`, never in a process argument.
keychain_store() {
  local service=$1 account=$2 hex errf
  _emporix_security delete-generic-password -s "$service" -a "$account" >/dev/null 2>&1 || true
  hex=$(printf '%s' "$SECRET_VALUE" | python3 -I -c 'import sys; sys.stdout.write(sys.stdin.buffer.read().hex())')
  errf=$(mktemp)
  printf 'add-generic-password -s "%s" -a "%s" -T "" -X "%s"\n' "$service" "$account" "$hex" \
    | _emporix_security -i >/dev/null 2>"$errf" || true
  hex=""
  # Reading the attributes (no -w) does not need the item's approval.
  if ! _emporix_security find-generic-password -s "$service" -a "$account" >/dev/null 2>&1; then
    say "Could not store the secret in the macOS Keychain: $(tr '\n' ' ' <"$errf" | sed 's/[0-9a-f]\{32,\}/<hex>/g')"
    rm -f "$errf"; return 1
  fi
  rm -f "$errf"
}

# keychain_acl SERVICE ACCOUNT — print the item's trusted applications for reading its value:
# "closed" (empty list: every read asks), "open" (an application was trusted, e.g. Always Allow, or
# any application may read), or "unknown". Never reads the value.
keychain_acl() {
  _emporix_security dump-keychain -a 2>/dev/null | python3 -I -c '
import re, sys
service, account = sys.argv[1], sys.argv[2]
state = "unknown"
for block in sys.stdin.read().split("keychain: "):
    if f"\"svce\"<blob>=\"{service}\"" not in block or f"\"acct\"<blob>=\"{account}\"" not in block:
        continue
    lines = [l.strip() for l in block.splitlines()]
    for i, l in enumerate(lines):
        if l.startswith("authorizations") and " decrypt" in l:
            for nxt in lines[i + 1:i + 6]:
                if nxt.startswith("applications"):
                    m = re.match(r"applications \((\d+)\)", nxt)
                    state = "closed" if m and m.group(1) == "0" else "open"
                    break
            break
print(state)' "$1" "$2"
}

# Print how to add an employee-token profile when the file has none (existing files never get
# the template's example).
employee_hint_if_missing() {
  local first a t api
  first=$(python3 - "$file" <<'PY' 2>/dev/null
import json, sys
profiles = (json.load(open(sys.argv[1])).get("profiles") or {})
if any((p or {}).get("auth") == "employee-token" for p in profiles.values()):
    sys.exit(1)
for a, p in profiles.items():
    p = p or {}
    if p.get("tenant"):
        print("\x1f".join([a, p["tenant"], p.get("apiUrl") or ""])); break
else:
    print("my-tenant\x1fmy-tenant\x1f")
PY
  ) || return 0
  IFS=$'\x1f' read -r a t api <<< "$first"
  echo
  echo "No employee-token profile yet."
  emporix_employee_profile_hint "$a-admin" "$t" "$api"
}

case "$cmd" in
  path) echo "$file" ;;

  init)
    if [ -f "$file" ]; then
      echo "Profiles file already exists: $file"
      employee_hint_if_missing
    else
      write_template
      echo "Created tenant profiles template: $file"
      echo "Fill in tenant, apiUrl, clientId and clientSecret for each profile you need (or auth: employee-token), then save."
      echo "Easier: close the editor and run: bash \"$self\" setup"
    fi
    open_in_editor "$file" || true ;;

  open)
    [ -f "$file" ] || { echo "No profiles file at $file. Create a profile, guided: bash \"$self\" setup" >&2; exit 1; }
    open_in_editor "$file" ;;

  list)
    [ -f "$file" ] || { echo "No profiles file at $file. Create a profile, guided: bash \"$self\" setup" >&2; exit 1; }
    python3 - "$file" <<'PY'
import json, os, sys
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
    kind = p.get("auth") or "client-credentials"
    note = p.get("description") or ""
    if kind == "client-credentials":
        auth = kind if (p.get("clientId") and p.get("clientSecret")) else "INCOMPLETE"
    elif kind == "employee-token":
        auth = kind
        tf = os.path.expanduser(p.get("tokenFile") or os.path.join(os.path.dirname(os.path.abspath(file)), "tokens", a))
        if not os.path.isfile(tf):
            note = ("signs in as " + p["email"]) if p.get("email") else "no token yet — tenants.sh refresh " + a
    else:
        auth = "INCOMPLETE"; note = f"unknown auth {kind}"
    if not p.get("tenant"):
        note = "missing tenant"
    rows.append([a, p.get("tenant") or "-", p.get("apiUrl") or "https://api.emporix.io", auth, "*" if cfg.get("default") == a else "", note])
head = ["ALIAS", "TENANT", "API URL", "AUTH", "DEFAULT", "NOTE"]
w = [max(len(head[i]), *(len(str(r[i])) for r in rows)) for i in range(len(head))]
fmt = lambda r: "  ".join(str(c).ljust(w[i]) for i, c in enumerate(r)).rstrip()
print(fmt(head))
for r in rows: print(fmt(r))
PY
    employee_hint_if_missing ;;

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
    if [ "$EMPORIX_AUTH_KIND" = "employee-token" ]; then
      echo "Profile '$alias': tenant=$EMPORIX_TENANT api=$EMPORIX_API_URL auth=employee-token expires=$EMPORIX_TOKEN_EXPIRES"
    else
      echo "Profile '$alias': tenant=$EMPORIX_TENANT api=$EMPORIX_API_URL auth=client-credentials token=minted"
    fi
    emporix_token_check || { echo "The token of profile '$alias' is not a usable access token — check the profile (tenants.sh open)." >&2; exit 1; }
    # Where secrets live: Keychain items must still ask on every read; plaintext is reported.
    for pair in "password:$_emporix_password" "clientSecret:$_emporix_client_secret" "storefrontClientSecret:$_emporix_storefront_secret"; do
      field=${pair%%:*}; value=${pair#*:}
      [ -n "$value" ] || continue
      case "$value" in
        keychain:*)
          _emporix_is_macos || continue
          case "$(keychain_acl "${value#keychain:}" "$alias")" in
            closed) echo "SECRET_$field=keychain (asks on every read)" ;;
            open) echo "SECRET_$field=keychain-open"
                  say "Warning: the Keychain item of $field (${value#keychain:}) no longer asks before a read — an application was trusted (\"Always Allow\"), so the agent could read it silently. Store it again to reset the list: bash \"$self\" set-secret $alias $field" ;;
            *) echo "SECRET_$field=keychain (trusted-application list not readable)" ;;
          esac ;;
        *)
          if [ "$field" = password ]; then
            echo "SECRET_$field=plaintext"
            if _emporix_is_macos; then
              say "Note: the password of '$alias' is stored in plain text in $file (mode 600) and is read without asking. Use it only for a dedicated test account; move it to the Keychain with: bash \"$self\" set-secret $alias password --store keychain"
            else
              say "Note: the password of '$alias' is stored in plain text in $file (no macOS Keychain on this system). Use it only for a dedicated test account."
            fi
          fi ;;
      esac
    done
    if [ -n "$probe" ]; then
      hdr=$(_emporix_auth_header_file) || die "Could not create a temporary file for the request header."
      status=$(curl -sS -o /dev/null -w '%{http_code}' "$probe" -H @"$hdr" -H "X-Tenant: $EMPORIX_TENANT" -H 'Accept: */*' || echo 000)
      rm -f "$hdr"
      echo "PROBE_HTTP=$status"
      case "$status" in
        401|403) echo "Probe returned HTTP $status — the token of profile '$alias' lacks the permissions for that endpoint, or the tenant is wrong. Fix the API client (or the employee's roles), not the token." >&2; exit 1 ;;
      esac
    fi ;;

  copy-token)
    alias=${1:-}
    [ -n "$alias" ] || die "Usage: tenants.sh copy-token <alias>"
    copy=$(copy_cmd) || die "No clipboard tool found (pbcopy, wl-copy, xclip, clip.exe)."
    EMPORIX_PROFILE=$alias
    emporix_require_env
    # printf is a shell builtin: the token reaches the clipboard tool on stdin, never in an argument.
    printf '%s' "$EMPORIX_TOKEN" | sh -c "$copy" || die "Could not write the clipboard ($copy)."
    say "Copied the token of '$alias' to the clipboard${EMPORIX_TOKEN_EXPIRES:+ (expires $EMPORIX_TOKEN_EXPIRES)}."
    say "In the Tenant/Token gate: Tenant = $EMPORIX_TENANT, Token = paste (Cmd+V / Ctrl+V), then Save." ;;

  set-token)
    alias=${1:-}
    [ -n "$alias" ] || { echo "Usage: <token on stdin> | tenants.sh set-token <alias>" >&2; exit 2; }
    [ -f "$file" ] || { echo "No profiles file at $file. Create a profile, guided: bash \"$self\" setup" >&2; exit 1; }
    [ ! -t 0 ] || { echo "Pipe the token on stdin, e.g.: pbpaste | tenants.sh set-token $alias (never pass it as an argument)." >&2; exit 2; }
    EMPORIX_PROFILE=$alias
    out=$(python3 - "$file" "$alias" <<'PY'
import json, os, sys
file, alias = sys.argv[1], sys.argv[2]
p = (json.load(open(file)).get("profiles") or {}).get(alias)
if p is None:
    print(f'Unknown profile "{alias}".', file=sys.stderr); sys.exit(1)
if (p.get("auth") or "client-credentials") != "employee-token":
    print(f'Profile "{alias}" is not an employee-token profile (set "auth": "employee-token").', file=sys.stderr); sys.exit(1)
print(os.path.expanduser(p.get("tokenFile") or os.path.join(os.path.dirname(os.path.abspath(file)), "tokens", alias)))
PY
    ) || exit 1
    target=$out
    mkdir -p "$(dirname "$target")"
    chmod 700 "$(dirname "$target")" 2>/dev/null || true
    tmp=$(umask 077; mktemp "$(dirname "$target")/.set-token.XXXXXX")
    trap 'rm -f "$tmp"' EXIT
    # Strip surrounding whitespace and an accidental "Bearer " prefix; never alter the token itself.
    python3 -I -c '
import sys
t = sys.stdin.read().strip()
if t[:7].lower() == "bearer ": t = t[7:].strip()
sys.stdout.write(t + "\n")' > "$tmp"
    chmod 600 "$tmp"
    mv -f "$tmp" "$target"
    trap - EXIT
    echo "Stored the employee token for '$alias' in $target (mode 600)."
    exec bash "$self" check "$alias" ;;

  set-secret)
    alias="" field="" store=""
    while [ $# -gt 0 ]; do
      case "$1" in
        --store) [ $# -ge 2 ] || die "--store needs keychain or file."; store=$2; shift 2 ;;
        -*) die "Unknown argument: $1" ;;
        *) if [ -z "$alias" ]; then alias=$1; elif [ -z "$field" ]; then field=$1; else die "Unexpected argument: $1"; fi; shift ;;
      esac
    done
    [ -n "$alias" ] || die "Usage: tenants.sh set-secret <alias> [password|clientSecret|storefrontClientSecret] [--store keychain|file]"
    case "$store" in ""|keychain|file) ;; *) die "--store must be keychain or file." ;; esac
    if [ "$store" = keychain ] && ! _emporix_is_macos; then die "This system has no macOS Keychain; use --store file."; fi
    [ -f "$file" ] || die "No profiles file at $file. Create a profile with: bash \"$self\" setup"
    info=$(python3 - "$file" "$alias" <<'PY'
import json, sys
p = (json.load(open(sys.argv[1])).get("profiles") or {}).get(sys.argv[2])
if p is None:
    print(f'Unknown profile "{sys.argv[2]}". Create it with: tenants.sh setup --alias {sys.argv[2]}', file=sys.stderr); sys.exit(1)
print("\x1f".join([p.get("auth") or "client-credentials", p.get("email") or ""]))
PY
    ) || exit 1
    IFS=$'\x1f' read -r pkind pemail <<< "$info"
    if [ -z "$field" ]; then
      if [ "$pkind" = employee-token ]; then field=password; else field=clientSecret; fi
    fi
    case "$pkind:$field" in
      employee-token:password|client-credentials:clientSecret|client-credentials:storefrontClientSecret) ;;
      *) die "Profile '$alias' ($pkind) has no secret '$field'. Use password for employee-token, clientSecret or storefrontClientSecret for client-credentials." ;;
    esac
    if [ "$field" = password ] && [ -z "$pemail" ]; then
      pemail=$(ask "Email of the test account (no SSO, no MFA)" "")
      refuse_token_as_name email "$pemail"
      case "$pemail" in *@*.*) ;; *) die "'$pemail' is not an email address." ;; esac
      PROFILE_FIELD_VALUE=$pemail set_profile_field "$alias" email
    fi
    service="emporix-tenants.$alias.$field"
    if [ -z "$store" ]; then
      if _emporix_is_macos; then
        say "Where should the $field of '$alias' be kept?"
        say "  1) macOS Keychain - macOS asks you before every read (recommended)"
        say "  2) $file - plain text (mode 600), read without asking"
        case "$(ask 'Choose 1 or 2' 1)" in 1) store=keychain ;; 2) store=file ;; *) die "Answer 1 or 2." ;; esac
      else
        store=file
      fi
    fi
    SECRET_VALUE=$(ask_secret "$field for '$alias' (hidden; copy it from 1Password)")
    [ -n "$SECRET_VALUE" ] || die "Nothing entered; '$alias' is unchanged."
    if [ "$store" = keychain ]; then
      keychain_store "$service" "$alias" || { SECRET_VALUE=""; exit 1; }
      SECRET_VALUE=""
      PROFILE_FIELD_VALUE="keychain:$service" set_profile_field "$alias" "$field"
      say "Stored $field of '$alias' in the macOS Keychain (item $service). macOS asks for approval on every read: click Allow, never Always Allow."
    else
      PROFILE_FIELD_VALUE=$SECRET_VALUE set_profile_field "$alias" "$field"
      SECRET_VALUE=""
      if _emporix_is_macos; then
        say "Stored $field of '$alias' in plain text in $file (mode 600); it is read without asking. Use it only for a dedicated test account."
        if _emporix_security find-generic-password -s "$service" -a "$alias" >/dev/null 2>&1; then
          say "The Keychain item $service is no longer used. Delete it with: security delete-generic-password -s $service -a $alias"
        fi
      else
        say "Stored $field of '$alias' in plain text in $file (mode 600): this system has no macOS Keychain. Use it only for a dedicated test account."
      fi
    fi ;;

  setup)
    kind="" env="" api="" tenant="" alias="" make_default="" no_open="" login="" email=""
    while [ $# -gt 0 ]; do
      case "$1" in
        --login) login=${2:-}; shift 2 ;;
        --email) email=${2:-}; shift 2 ;;
        --kind) kind=${2:-}; shift 2 ;;
        --env) env=${2:-}; shift 2 ;;
        --api-url) api=${2:-}; shift 2 ;;
        --tenant) tenant=${2:-}; shift 2 ;;
        --alias) alias=${2:-}; shift 2 ;;
        --default) make_default=1; shift ;;
        --no-open) no_open=1; shift ;;
        *) die "Unknown argument: $1 (see: tenants.sh help)" ;;
      esac
    done
    say "Emporix tenant profile setup"
    say "A profile is a named login that the QA and demo skills use. In chat you only name it"
    say "(--tenant <alias>); secrets and tokens stay on this machine."
    say ""
    if [ -z "$kind" ]; then
      say "What will you test with this profile?"
      say "  1) Management Dashboard (npm run serve:local-qa) - signs in as you, an employee"
      say "  2) Cockpit templates, md-extensions standalone shells, or API calls - uses an API client"
      case "$(ask 'Choose 1 or 2' 1)" in
        1) kind=employee-token ;;
        2) kind=client-credentials ;;
        *) die "Answer 1 or 2." ;;
      esac
    fi
    case "$kind" in employee-token|client-credentials) ;; *) die "--kind must be employee-token or client-credentials." ;; esac
    if [ -z "$api" ]; then
      if [ -z "$env" ]; then
        say ""
        say "Which environment?"
        say "  1) dev    (api-develop.emporix.io, dashboard dev-admin.emporix.io)"
        say "  2) stage  (api-stage.emporix.io, dashboard stage-admin.emporix.io)"
        say "  3) prod   (api.emporix.io, dashboard admin.emporix.io)"
        case "$(ask 'Choose 1, 2 or 3' 1)" in 1) env=dev ;; 2) env=stage ;; 3) env=prod ;; *) die "Answer 1, 2 or 3." ;; esac
      fi
      case "$env" in
        dev) api=https://api-develop.emporix.io ;;
        stage) api=https://api-stage.emporix.io ;;
        prod) api=https://api.emporix.io ;;
        *) die "--env must be dev, stage or prod." ;;
      esac
    fi
    api=${api%/}
    case "$api" in
      https://api-develop.emporix.io) env=dev ;;
      https://api-stage.emporix.io) env=stage ;;
      https://api.emporix.io) env=prod ;;
      *) env=custom ;;
    esac
    if [ -z "$tenant" ]; then
      say ""
      tenant=$(ask "Tenant name (lowercase, as in the dashboard's tenant switcher)" "")
    fi
    refuse_token_as_name tenant "$tenant"
    printf '%s' "$tenant" | grep -Eq '^[a-z0-9][a-z0-9_-]*$' || die "Tenant '$tenant' is not a tenant name (lowercase letters, digits, - and _)."
    if [ -z "$alias" ]; then
      suggested=$tenant
      case "$env" in stage|prod) suggested="$suggested-$env" ;; esac
      [ "$kind" = employee-token ] && suggested="$suggested-admin"
      alias=$(ask "Profile alias (what you will type after --tenant)" "$suggested")
    fi
    refuse_token_as_name alias "$alias"
    printf '%s' "$alias" | grep -Eq '^[A-Za-z0-9][A-Za-z0-9._-]*$' || die "Alias '$alias' may contain only letters, digits, '.', '-' and '_'."
    if [ -f "$file" ] && profile_exists "$alias"; then
      case "$(ask "Profile '$alias' already exists. Replace it? (y/N)" n)" in
        y|Y|yes) ;;
        *) die "Kept the existing profile '$alias'. Pick another alias with --alias." ;;
      esac
    fi
    if [ "$kind" = employee-token ]; then
      if [ -z "$login" ]; then
        say ""
        say "How will this profile sign in?"
        say "  1) Email + password of a dedicated test account (no SSO, no MFA; copy them from 1Password)."
        say "     The token is then fetched automatically whenever it is missing or expiring."
        say "  2) Paste a token from a dashboard sign-in (any account, SSO and MFA included; refresh by hand)."
        case "$(ask 'Choose 1 or 2' 1)" in 1) login=password ;; 2) login=paste ;; *) die "Answer 1 or 2." ;; esac
      fi
      case "$login" in password|paste) ;; *) die "--login must be password or paste." ;; esac
      if [ "$login" = password ] && [ -z "$email" ]; then
        email=$(ask "Email of the test account" "")
      fi
      if [ "$login" = password ]; then
        refuse_token_as_name email "$email"
        case "$email" in *@*.*) ;; *) die "'$email' is not an email address." ;; esac
      else
        email=""
      fi
    fi
    cid="" csec="" scopes=""
    if [ "$kind" = client-credentials ]; then
      say ""
      say "This profile mints a token from your tenant's API client. API keys are managed in the"
      say "Emporix Developer Portal ($(devportal_url "$api")); ask your tenant admin if you have none."
      cid=$(ask "Client ID" "")
      [ -n "$cid" ] || die "A client ID is required."
      csec=$(ask_secret "Client secret (hidden)")
      [ -n "$csec" ] || die "A client secret is required."
      scopes=$(ask "Scopes, space-separated (Enter = all scopes of the API client)" "")
    fi
    if [ -z "$make_default" ] && [ -f "$file" ]; then
      case "$(ask "Make '$alias' the default profile? (y/N)" n)" in y|Y|yes) make_default=1 ;; esac
    fi
    PROFILE_TENANT=$tenant PROFILE_API=$api PROFILE_KIND=$kind PROFILE_CID=$cid PROFILE_CSEC=$csec \
      PROFILE_SCOPES=$scopes PROFILE_DEFAULT=$make_default PROFILE_EMAIL=$email upsert_profile "$alias"
    say ""
    say "Saved profile '$alias' ($kind, tenant $tenant, $api) in $file."
    if [ "$kind" = employee-token ] && [ "$login" = password ]; then
      say ""
      say "Now the password of $email."
      bash "$self" set-secret "$alias" password || {
        say "The profile is saved without a password. Add it later with: bash \"$self\" set-secret $alias password"
        exit 1
      }
      say "Signing in once to check it, with the token of this tenant's API client profile (macOS asks to allow a Keychain read)."
      EMPORIX_FORCE_LOGIN=1 bash "$self" check "$alias" || {
        say "The profile is saved but the sign-in failed for the reason above. A missing API client profile: bash \"$self\" setup --kind client-credentials --tenant $tenant. A wrong password: bash \"$self\" set-secret $alias password"
        exit 1
      }
    elif [ "$kind" = employee-token ]; then
      say ""
      say "Now store your employee token for it."
      bash "$self" refresh "$alias" ${no_open:+--no-open} || {
        say "The profile is saved but has no valid token yet. When you are ready, run: bash \"$self\" refresh $alias"
        exit 1
      }
    else
      bash "$self" check "$alias" || {
        say "The profile is saved but its token check failed. Fix the client ID or secret with: bash \"$self\" setup --alias $alias"
        exit 1
      }
    fi
    say ""
    say "Done. Use it with --tenant $alias, for example: /emporix-qa-ui <ticket> --tenant $alias" ;;

  refresh)
    alias=${1:-}; shift || true
    no_open="" paste=""
    while [ $# -gt 0 ]; do
      case "$1" in --no-open) no_open=1; shift ;; --paste) paste=1; shift ;; *) die "Unknown argument: $1" ;; esac
    done
    [ -n "$alias" ] || die "Usage: tenants.sh refresh <alias> [--paste] [--no-open]"
    [ -f "$file" ] || die "No profiles file at $file. Create a profile with: bash \"$self\" setup"
    info=$(python3 - "$file" "$alias" <<'PY'
import json, sys
p = (json.load(open(sys.argv[1])).get("profiles") or {}).get(sys.argv[2])
if p is None:
    print(f'Unknown profile "{sys.argv[2]}". Create it with: tenants.sh setup --alias {sys.argv[2]}', file=sys.stderr); sys.exit(1)
if (p.get("auth") or "client-credentials") != "employee-token":
    print(f'Profile "{sys.argv[2]}" mints its own token (client-credentials); nothing to refresh. Check it with: tenants.sh check {sys.argv[2]}', file=sys.stderr); sys.exit(1)
print("\x1f".join([p.get("tenant") or "", (p.get("apiUrl") or "https://api.emporix.io").rstrip("/"), p.get("email") or ""]))
PY
    ) || exit 1
    IFS=$'\x1f' read -r tenant api pemail <<< "$info"
    if [ -n "$pemail" ] && [ -z "$paste" ]; then
      say "Signing in again as $pemail (tenant $tenant, $api)."
      EMPORIX_FORCE_LOGIN=1 exec bash "$self" check "$alias"
    fi
    url=$(dashboard_url "$api")
    say "Refresh the employee token of '$alias' (tenant $tenant, $api):"
    say "  1. Open ${url:-the Management Dashboard of $api} and sign in as an employee of $tenant."
    say "  2. Open the browser console: Cmd+Option+J (Mac) or Ctrl+Shift+J (Windows/Linux) in Chrome."
    say "  3. Type  copy(localStorage.accessToken)  and press Enter. Nothing is printed; the token is now copied."
    say "  4. Come back here and press Enter (or paste the token here; nothing you type is shown)."
    if [ -z "$no_open" ] && [ -n "$url" ]; then
      if command -v open >/dev/null 2>&1; then open "$url" >/dev/null 2>&1 || true
      elif command -v xdg-open >/dev/null 2>&1; then xdg-open "$url" >/dev/null 2>&1 || true
      fi
    fi
    tok=$(ask_secret "Press Enter when the token is copied")
    case "$tok" in
      *.*.*) say "Using the pasted token." ;;
      *) tok="" ;;
    esac
    if [ -z "$tok" ] && clip=$(clipboard_cmd); then
      tok=$($clip 2>/dev/null || true)
      case "$tok" in
        *.*.*) say "Read the token from the clipboard." ;;
        *) tok="" ;;
      esac
    fi
    if [ -z "$tok" ]; then
      say "The clipboard does not hold a token."
      tok=$(ask_secret "Paste the token here (hidden) and press Enter")
    fi
    [ -n "$tok" ] || die "No token entered."
    printf '%s' "$tok" | bash "$self" set-token "$alias" ;;

  help|-h|--help) sed -n '2,/^# Editor:/p' "$0" ;;

  *) sed -n '2,/^# Editor:/p' "$0"; exit 2 ;;
esac
