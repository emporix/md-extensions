#!/usr/bin/env bash
# Behaviour tests for employee-token tenant profiles: tenants.sh (list, set-token, check),
# emporix-env.sh, and the emporix-qa-ui check-cockpit-token.sh / fill-cockpit-gate.sh scripts.
# A local stub stands in for GET auth-adapter/users/me/tenants; no real tenant is called.
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../../.." && pwd)
TENANTS="$ROOT/skills/emporix-setup/scripts/tenants.sh"
CHECK="$ROOT/skills/emporix-qa-ui/scripts/check-cockpit-token.sh"
FILL="$ROOT/skills/emporix-qa-ui/scripts/fill-cockpit-gate.sh"
fail() { echo "FAIL: $1" >&2; exit 1; }

TMP=$(mktemp -d)
STUB_PID=""
trap '[ -z "$STUB_PID" ] || kill "$STUB_PID" 2>/dev/null; rm -rf "$TMP"' EXIT

# Stub API: $TMP/stub-status holds the HTTP status, $TMP/stub-body the JSON body.
# It records whether the request carried the expected Bearer header.
cat >"$TMP/stub.py" <<'PY'
import http.server, os, sys
d = sys.argv[1]
class H(http.server.BaseHTTPRequestHandler):
    def do_POST(self):
        self.rfile.read(int(self.headers.get("Content-Length") or 0))
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(b'{"access_token":"OpaqueMintedToken0123456789"}')
    def do_GET(self):
        auth = self.headers.get("Authorization", "")
        open(os.path.join(d, "stub-seen"), "w").write(self.path + "\n" + auth)
        status = int(open(os.path.join(d, "stub-status")).read().strip())
        body = open(os.path.join(d, "stub-body"), "rb").read()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(body)
    def log_message(self, *a): pass
s = http.server.HTTPServer(("127.0.0.1", 0), H)
open(os.path.join(d, "stub-port"), "w").write(str(s.server_port))
s.serve_forever()
PY
echo 200 >"$TMP/stub-status"
echo '[{"tenant":"acme","applications":[]},{"tenant":"other","applications":[]}]' >"$TMP/stub-body"
# Started from a subshell so the shell does not report the job when the trap kills it.
STUB_PID=$( (python3 -I "$TMP/stub.py" "$TMP" >/dev/null 2>&1 & echo $!) )
for _ in $(seq 1 50); do [ -s "$TMP/stub-port" ] && break; sleep 0.1; done
[ -s "$TMP/stub-port" ] || fail "stub API did not start"
API="http://127.0.0.1:$(cat "$TMP/stub-port")"

# make_jwt EXP_OFFSET_SECONDS [EXTRA_CLAIMS_JSON]
make_jwt() {
  python3 -I - "$1" "${2:-}" <<'PY'
import base64, json, sys, time
b = lambda o: base64.urlsafe_b64encode(json.dumps(o).encode()).decode().rstrip("=")
claims = {"sub": "employee-1", "exp": int(time.time()) + int(sys.argv[1])}
claims.update(json.loads(sys.argv[2] or "{}"))
print(b({"alg": "RS256", "typ": "JWT"}) + "." + b(claims) + ".c2lnbmF0dXJl")
PY
}

export EMPORIX_TENANTS_FILE="$TMP/home/tenants.json"
mkdir -p "$TMP/home"
cat >"$EMPORIX_TENANTS_FILE" <<EOF
{
  "default": "acme-admin",
  "profiles": {
    "acme-admin": { "tenant": "acme", "apiUrl": "$API", "auth": "employee-token", "description": "dashboard employee" },
    "acme-api": { "tenant": "acme", "apiUrl": "$API", "clientId": "", "clientSecret": "" },
    "acme-cc": { "tenant": "acme", "apiUrl": "$API", "clientId": "id", "clientSecret": "secret" },
    "acme-odd": { "tenant": "acme", "apiUrl": "$API", "auth": "password" },
    "acme-repo": { "tenant": "acme", "apiUrl": "$API", "auth": "employee-token", "tokenFile": "$TMP/repo/token" }
  }
}
EOF
chmod 600 "$EMPORIX_TENANTS_FILE"
TOKEN_FILE="$TMP/home/tokens/acme-admin"

# list shows the auth kind, never a token, and points at set-token while no file exists.
out=$(bash "$TENANTS" list)
echo "$out" | grep -E '^acme-admin +acme +http://127.0.0.1:[0-9]+ +employee-token +\* +no token yet — tenants.sh refresh acme-admin$' >/dev/null || fail "list employee row: $out"
echo "$out" | grep -E '^acme-api .* INCOMPLETE' >/dev/null || fail "list client-credentials row: $out"
echo "$out" | grep -E '^acme-odd .* INCOMPLETE .*unknown auth password' >/dev/null || fail "list unknown auth: $out"

# A missing token file is a hard stop with the refresh instructions.
if out=$(bash "$CHECK" --tenant acme-admin 2>&1); then fail "missing token file passed: $out"; fi
echo "$out" | grep -q "No employee token for profile 'acme-admin' at $TOKEN_FILE" || fail "missing file message: $out"
echo "$out" | grep -qE 'bash ".*/tenants.sh" refresh acme-admin$' || fail "missing file refresh hint: $out"

# set-token refuses a terminal-less argument form and a client-credentials profile.
if bash "$TENANTS" set-token acme-api </dev/null >/dev/null 2>&1; then fail "set-token accepted a client-credentials profile"; fi

# set-token stores the token from stdin (strips whitespace and a Bearer prefix), mode 600, then checks it.
GOOD=$(make_jwt 3600 '{"tenant":"ACME"}')
out=$(printf 'Bearer %s\n\n' "$GOOD" | bash "$TENANTS" set-token acme-admin 2>&1) || fail "set-token: $out"
[ "$(cat "$TOKEN_FILE")" = "$GOOD" ] || fail "set-token did not store the raw token"
mode=$(stat -f '%Lp' "$TOKEN_FILE" 2>/dev/null || stat -c '%a' "$TOKEN_FILE")
[ "$mode" = 600 ] || fail "token file mode $mode"
echo "$out" | grep -q "auth=employee-token expires=" || fail "set-token check line: $out"
case "$out" in *"$GOOD"*) fail "set-token printed the token" ;; esac

# check-cockpit-token passes with a valid token, prints the kind and expiry, never the token,
# and calls the dashboard gate endpoint with the token.
out=$(bash "$CHECK" --tenant acme-admin 2>&1) || fail "valid employee token: $out"
echo "$out" | grep -q '^PROFILE=acme-admin TENANT=acme API_URL=.* AUTH=employee-token$' || fail "profile line: $out"
echo "$out" | grep -Eq '^TOKEN_EXPIRES=[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9:]{8}Z$' || fail "expiry line: $out"
echo "$out" | grep -q '^TOKEN_PAYLOAD=valid_json$' || fail "payload line: $out"
case "$out" in *"$GOOD"*) fail "check printed the token" ;; esac
[ "$(head -n 1 "$TMP/stub-seen")" = "/auth-adapter/users/me/tenants" ] || fail "gate endpoint not called: $(cat "$TMP/stub-seen")"
[ "$(tail -n 1 "$TMP/stub-seen")" = "Bearer $GOOD" ] || fail "gate endpoint got the wrong bearer"

# tenants.sh list now shows the description instead of the missing-file note; list never shows a token.
out=$(bash "$TENANTS" list)
echo "$out" | grep -E '^acme-admin .* employee-token +\* +dashboard employee$' >/dev/null || fail "list after set-token: $out"
case "$out" in *"$GOOD"*) fail "list printed the token" ;; esac

# Loose permissions are refused.
chmod 644 "$TOKEN_FILE"
if out=$(bash "$CHECK" --tenant acme-admin 2>&1); then fail "mode 644 passed"; fi
echo "$out" | grep -q "has mode 644" || fail "mode message: $out"
chmod 600 "$TOKEN_FILE"

# A symlink is refused.
mv "$TOKEN_FILE" "$TMP/real-token"
ln -s "$TMP/real-token" "$TOKEN_FILE"
if out=$(bash "$CHECK" --tenant acme-admin 2>&1); then fail "symlink passed"; fi
echo "$out" | grep -q "must be a regular file" || fail "symlink message: $out"
rm "$TOKEN_FILE"; mv "$TMP/real-token" "$TOKEN_FILE"

# An expired token (or one expiring within a minute) is a hard stop with the refresh hint.
make_jwt -120 >"$TOKEN_FILE"
if out=$(bash "$CHECK" --tenant acme-admin 2>&1); then fail "expired token passed"; fi
echo "$out" | grep -q "is not usable: expired at" || fail "expired message: $out"
echo "$out" | grep -q "refresh acme-admin" || fail "expired refresh hint: $out"
make_jwt 30 >"$TOKEN_FILE"
if out=$(bash "$CHECK" --tenant acme-admin 2>&1); then fail "token expiring in 30s passed"; fi
echo "$out" | grep -q "in under 60s" || fail "near-expiry message: $out"

# A token whose tenant claim names another tenant is refused before any API call.
rm -f "$TMP/stub-seen"
make_jwt 3600 '{"https://emporix.io/tenant":"globex"}' >"$TOKEN_FILE"
if out=$(bash "$CHECK" --tenant acme-admin 2>&1); then fail "foreign tenant claim passed"; fi
echo "$out" | grep -q "claim names another tenant (globex)" || fail "tenant claim message: $out"
[ ! -e "$TMP/stub-seen" ] || fail "API called despite a foreign tenant claim"

# An opaque (client-credentials-style) token or a JWT without exp is not an employee token.
printf 'abcdefghijklmnopqrstuvwxyz12\n' >"$TOKEN_FILE"
if out=$(bash "$CHECK" --tenant acme-admin 2>&1); then fail "opaque token passed"; fi
echo "$out" | grep -q "not a JWT" || fail "opaque message: $out"
python3 -I -c 'import base64,json;b=lambda o:base64.urlsafe_b64encode(json.dumps(o).encode()).decode().rstrip("=");print(b({"alg":"none"})+"."+b({"sub":"x"})+".sig")' >"$TOKEN_FILE"
if out=$(bash "$CHECK" --tenant acme-admin 2>&1); then fail "token without exp passed"; fi
echo "$out" | grep -q "no numeric exp claim" || fail "no-exp message: $out"

# The user must be a member of the profile's tenant.
make_jwt 3600 >"$TOKEN_FILE"
echo '[{"tenant":"globex","applications":[]}]' >"$TMP/stub-body"
if out=$(bash "$CHECK" --tenant acme-admin 2>&1); then fail "non-member passed"; fi
echo "$out" | grep -q "not a member of tenant acme (member of: globex)" || fail "membership message: $out"
echo '[{"tenant":"acme","applications":[]}]' >"$TMP/stub-body"

# A revoked or signed-out token (401 from the gate endpoint) is a hard stop with the refresh hint.
echo 401 >"$TMP/stub-status"
if out=$(bash "$CHECK" --tenant acme-admin 2>&1); then fail "401 passed"; fi
echo "$out" | grep -q "rejected the employee token of profile 'acme-admin' (HTTP 401" || fail "401 message: $out"
echo "$out" | grep -q "refresh acme-admin" || fail "401 refresh hint: $out"
echo 200 >"$TMP/stub-status"

# A token file inside a git repository is refused.
mkdir -p "$TMP/repo"
git -C "$TMP/repo" init -q
make_jwt 3600 >"$TMP/repo/token"; chmod 600 "$TMP/repo/token"
if out=$(bash "$CHECK" --tenant acme-repo 2>&1); then fail "token inside a git repo passed"; fi
echo "$out" | grep -q "is inside a git repository" || fail "git repo message: $out"

# fill-cockpit-gate.sh fills the employee token, never echoes it, and drops the browser's output
# for the token fill (a CLI that echoes the value must not reach the transcript).
GOOD=$(make_jwt 3600)
printf '%s\n' "$GOOD" >"$TOKEN_FILE"
cat >"$TMP/fake-browser" <<'SH'
#!/usr/bin/env sh
printf '%s\n' "$*" >>"$FAKE_LOG"
echo "{\"success\":true,\"echo\":\"$*\"}"
SH
chmod +x "$TMP/fake-browser"
export FAKE_LOG="$TMP/browser.log"
out=$(bash "$FILL" --browser "$TMP/fake-browser" --session s1 --tenant-ref @e1 --token-ref @e2 --save-ref @e3 --tenant acme-admin 2>&1) || fail "fill: $out"
case "$out" in *"$GOOD"*) fail "fill output contained the token" ;; esac
echo "$out" | grep -q "employee token, expires .*not logged" || fail "fill summary: $out"
grep -qx -- "--session s1 fill @e1 acme --json" "$FAKE_LOG" || fail "tenant fill: $(cat "$FAKE_LOG")"
grep -qx -- "--session s1 fill @e2 $GOOD --json" "$FAKE_LOG" || fail "token fill args"
grep -qx -- "--session s1 click @e3 --json" "$FAKE_LOG" || fail "save click: $(cat "$FAKE_LOG")"

# fill-cockpit-gate.sh refuses an expired employee token before touching the browser.
: >"$FAKE_LOG"
make_jwt -10 >"$TOKEN_FILE"
if out=$(bash "$FILL" --browser "$TMP/fake-browser" --session s1 --tenant-ref @e1 --token-ref @e2 --tenant acme-admin 2>&1); then fail "fill with expired token passed"; fi
[ ! -s "$FAKE_LOG" ] || fail "browser driven with an expired token"

# --gate md-token: a client-credentials profile stops before any token is minted and prints the
# employee-token profile to add; an employee-token profile passes; an unknown gate is a usage error.
make_jwt 3600 >"$TOKEN_FILE"
rm -f "$TMP/stub-seen"
if out=$(bash "$CHECK" --tenant acme-cc --gate md-token 2>&1); then fail "client-credentials profile passed the MD gate"; fi
echo "$out" | grep -q "Profile 'acme-cc' is a client-credentials profile; it cannot open the Management Dashboard local-qa gate." || fail "MD gate message: $out"
echo "$out" | grep -qE "^  bash \".*/tenants.sh\" setup --kind employee-token --api-url $API --tenant acme --alias acme-cc-admin$" || fail "MD gate setup command: $out"
echo "$out" | grep -q "Then use --tenant acme-cc-admin" || fail "MD gate next step: $out"
[ ! -e "$TMP/stub-seen" ] || fail "MD gate check called the API for a client-credentials profile"
out=$(bash "$CHECK" --tenant acme-admin --gate md-token 2>&1) || fail "employee-token profile refused by the MD gate: $out"
set +e; bash "$CHECK" --tenant acme-admin --gate bogus >/dev/null 2>&1; code=$?; set -e
[ "$code" = 2 ] || fail "unknown --gate exit $code"

# list (and init on an existing file) prints the employee-token profile to add when there is none,
# built from the first profile; nothing when one exists.
out=$(bash "$TENANTS" list)
case "$out" in *"No employee-token profile yet."*) fail "hint shown although an employee-token profile exists" ;; esac
NOEMP="$TMP/noemp/tenants.json"
mkdir -p "$TMP/noemp"
printf '{"profiles":{"globex":{"tenant":"globex","apiUrl":"https://api-stage.emporix.io","clientId":"a","clientSecret":"b"}}}' >"$NOEMP"
out=$(EMPORIX_TENANTS_FILE="$NOEMP" bash "$TENANTS" list)
echo "$out" | grep -q "^No employee-token profile yet.$" || fail "list hint missing: $out"
echo "$out" | grep -qE 'setup --kind employee-token --api-url https://api-stage.emporix.io --tenant globex --alias globex-admin$' || fail "list hint command: $out"
out=$(EMPORIX_TENANTS_FILE="$NOEMP" EMPORIX_EDITOR=true bash "$TENANTS" init)
echo "$out" | grep -q "^No employee-token profile yet.$" || fail "init hint missing on an existing file: $out"

# The retired ~/.emporix-qa.env is reported, never read.
mkdir -p "$TMP/oldhome"
printf 'EMPORIX_QA_TENANT=globex\nEMPORIX_QA_TOKEN=x\n' >"$TMP/oldhome/.emporix-qa.env"
out=$(HOME="$TMP/oldhome" bash "$CHECK" --tenant acme-admin 2>&1) || fail "legacy env file broke the check: $out"
echo "$out" | grep -q "\.emporix-qa.env is no longer read" || fail "legacy env note missing: $out"
echo "$out" | grep -q "TENANT=acme " || fail "legacy env file changed the tenant: $out"

# No profiles file: the scripts name the guided setup instead of opening an editor.
out=$(EMPORIX_TENANTS_FILE="$TMP/none/tenants.json" bash "$CHECK" 2>&1) && fail "check passed without a profiles file"
echo "$out" | grep -qE '^  bash ".*/tenants.sh" setup$' || fail "no-file setup hint: $out"
[ ! -e "$TMP/none/tenants.json" ] || fail "a profiles file was created without asking"

# setup, employee-token: answers come from stdin (kind, tenant, alias default, default? no, Enter
# after copying); the token is read from the clipboard. Profile and token file are mode 600; the
# token is never printed.
W="$TMP/wizard/tenants.json"
mkdir -p "$TMP/wizard"
printf '{"profiles":{"other":{"tenant":"other","clientId":"a","clientSecret":"b"}},"default":"other"}\n' >"$W"
chmod 600 "$W"
TOK=$(make_jwt 3600)
printf '%s\n' "$TOK" >"$TMP/clip"
out=$(printf '1\nacme\n\nn\n\n' | EMPORIX_TENANTS_FILE="$W" EMPORIX_CLIPBOARD_CMD="cat $TMP/clip" \
  bash "$TENANTS" setup --api-url "$API" --no-open 2>&1) || fail "employee setup: $out"
case "$out" in *"$TOK"*) fail "setup printed the token" ;; esac
echo "$out" | grep -q "Read the token from the clipboard." || fail "clipboard not used: $out"
echo "$out" | grep -q "copy(localStorage.accessToken)" || fail "setup did not explain what to copy: $out"
echo "$out" | grep -q "Done. Use it with --tenant acme-admin" || fail "setup done line: $out"
python3 -I - "$W" "$API" <<'PY' || fail "employee profile written: $(cat "$W")"
import json, sys
c = json.load(open(sys.argv[1]))
assert c["profiles"]["acme-admin"] == {"tenant": "acme", "apiUrl": sys.argv[2], "auth": "employee-token", "description": "employee sign-in for Management Dashboard local-qa"}, c
assert c["default"] == "other" and "other" in c["profiles"], c
PY
[ "$(cat "$TMP/wizard/tokens/acme-admin")" = "$TOK" ] || fail "setup did not store the token"
for f in "$W" "$TMP/wizard/tokens/acme-admin"; do
  m=$(stat -f '%Lp' "$f" 2>/dev/null || stat -c '%a' "$f"); [ "$m" = 600 ] || fail "$f mode $m"
done

# refresh: an empty clipboard falls back to a hidden paste prompt.
TOK2=$(make_jwt 7200)
out=$(printf '\n%s\n' "$TOK2" | EMPORIX_TENANTS_FILE="$W" EMPORIX_CLIPBOARD_CMD=true \
  bash "$TENANTS" refresh acme-admin --no-open 2>&1) || fail "refresh with paste: $out"
echo "$out" | grep -q "The clipboard does not hold a token." || fail "paste fallback not offered: $out"
case "$out" in *"$TOK2"*) fail "refresh printed the token" ;; esac
[ "$(cat "$TMP/wizard/tokens/acme-admin")" = "$TOK2" ] || fail "refresh did not store the pasted token"
out=$(EMPORIX_TENANTS_FILE="$W" bash "$TENANTS" refresh other --no-open </dev/null 2>&1) && fail "refresh accepted a client-credentials profile"
echo "$out" | grep -q "mints its own token" || fail "refresh client-credentials message: $out"

# refresh: a token pasted at the "press Enter" prompt is used (read hidden), before the clipboard.
TOK3=$(make_jwt 5400)
out=$(printf '%s\n' "$TOK3" | EMPORIX_TENANTS_FILE="$W" EMPORIX_CLIPBOARD_CMD="cat $TMP/clip" \
  bash "$TENANTS" refresh acme-admin --no-open 2>&1) || fail "refresh with token at the Enter prompt: $out"
echo "$out" | grep -q "Using the pasted token." || fail "pasted token not used: $out"
case "$out" in *"$TOK3"*) fail "refresh echoed the pasted token" ;; esac
[ "$(cat "$TMP/wizard/tokens/acme-admin")" = "$TOK3" ] || fail "pasted token not stored"

# refresh on a real terminal: a long token (5 000 characters, beyond the 1 024-byte canonical line
# limit of macOS terminals) pasted at the hidden "press Enter" prompt is read whole, stored, and
# never echoed.
LONG=$(python3 -I - <<'PY'
import base64, json, time
b = lambda o: base64.urlsafe_b64encode(json.dumps(o).encode()).decode().rstrip("=")
print(b({"alg": "RS256"}) + "." + b({"exp": int(time.time()) + 3600, "pad": "x" * 4000}) + ".c2ln")
PY
)
[ "${#LONG}" -gt 5000 ] || fail "long token too short: ${#LONG}"
out=$(LONG="$LONG" EMPORIX_TENANTS_FILE="$W" EMPORIX_CLIPBOARD_CMD=true python3 -I - "$TENANTS" <<'PY'
import os, pty, select, sys, time
pid, fd = pty.fork()
if pid == 0:
    os.execvp("bash", ["bash", sys.argv[1], "refresh", "acme-admin", "--no-open"])
out, sent, deadline = b"", False, time.time() + 20
while time.time() < deadline:
    r, _, _ = select.select([fd], [], [], 0.2)
    if r:
        try:
            chunk = os.read(fd, 65536)
        except OSError:
            break
        if not chunk:
            break
        out += chunk
    if not sent and b"token is copied:" in out:
        os.write(fd, os.environ["LONG"].encode() + b"\r"); sent = True
    if os.waitpid(pid, os.WNOHANG)[0]:
        break
else:
    os.kill(pid, 9); out += b"\nHANG"
sys.stdout.write(out.decode(errors="replace"))
PY
)
case "$out" in *HANG*) fail "refresh hung on a long pasted token: $out" ;; esac
case "$out" in *"$LONG"*|*xxxxxxxxxxxxxxxxxxxx*) fail "refresh echoed the pasted token on the terminal" ;; esac
echo "$out" | grep -q "Using the pasted token." || fail "long pasted token not used: $out"
[ "$(cat "$TMP/wizard/tokens/acme-admin")" = "$LONG" ] || fail "long token not stored whole"

# setup: a token pasted into the alias or tenant prompt is refused, never saved as a name.
out=$(printf '%s\n' "$TOK3" | EMPORIX_TENANTS_FILE="$W" bash "$TENANTS" setup --kind employee-token --api-url "$API" --tenant acme 2>&1) && fail "token accepted as alias"
echo "$out" | grep -q "That alias looks like a pasted token" || fail "alias token message: $out"
grep -qF "$TOK3" "$W" && fail "token saved in the profiles file"
out=$(printf '%s\n' "$TOK3" | EMPORIX_TENANTS_FILE="$W" bash "$TENANTS" setup --kind employee-token --api-url "$API" 2>&1) && fail "token accepted as tenant"
echo "$out" | grep -q "That tenant looks like a pasted token" || fail "tenant token message: $out"

# setup, client-credentials, all flags: asks client ID, secret (hidden), scopes, default; mints and checks.
out=$(printf 'my-client\nsuper-secret-value\n\ny\n' | EMPORIX_TENANTS_FILE="$W" \
  bash "$TENANTS" setup --kind client-credentials --api-url "$API" --tenant acme --alias acme-api 2>&1) || fail "cc setup: $out"
case "$out" in *super-secret-value*) fail "setup printed the client secret" ;; esac
echo "$out" | grep -q "auth=client-credentials token=minted" || fail "cc setup check: $out"
python3 -I - "$W" <<'PY' || fail "cc profile written: $(cat "$W")"
import json, sys
c = json.load(open(sys.argv[1]))
p = c["profiles"]["acme-api"]
assert p["clientId"] == "my-client" and p["clientSecret"] == "super-secret-value" and "scopes" not in p and "auth" not in p, p
assert c["default"] == "acme-api", c
PY

# setup refuses a bad tenant name and keeps an existing profile unless told to replace it.
out=$(printf '' | EMPORIX_TENANTS_FILE="$W" bash "$TENANTS" setup --kind employee-token --api-url "$API" --tenant "Acme Corp" 2>&1) && fail "bad tenant accepted"
echo "$out" | grep -q "is not a tenant name" || fail "bad tenant message: $out"
out=$(printf 'n\n' | EMPORIX_TENANTS_FILE="$W" bash "$TENANTS" setup --kind employee-token --api-url "$API" --tenant acme --alias acme-api 2>&1) && fail "replaced without consent"
echo "$out" | grep -q "Kept the existing profile 'acme-api'" || fail "keep message: $out"
grep -q '"clientSecret": "super-secret-value"' "$W" || fail "existing profile was changed"

echo "employee-token tests: ok"
