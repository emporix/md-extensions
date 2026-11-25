#!/usr/bin/env bash
# Behaviour tests for employee sign-in with email + password (POST auth-adapter/login) and for
# keychain: secret references: emporix-env.sh and tenants.sh (setup, set-secret, check, refresh).
# A local stub stands in for the Emporix API, a stub `security` for the macOS Keychain, and a
# `curl` shim records every curl command line, so the tests run on any OS and assert that no
# secret ever appears in a process argument.
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../../.." && pwd)
TENANTS="$ROOT/skills/emporix-setup/scripts/tenants.sh"
fail() { echo "FAIL: $1" >&2; exit 1; }

TMP=$(mktemp -d)
STUB_PID=""
trap '[ -z "$STUB_PID" ] || kill "$STUB_PID" 2>/dev/null; rm -rf "$TMP"' EXIT

PASSWORD='S3cret pw&"q"'
CLIENT_SECRET='client-secret-0123'

# --- stub API --------------------------------------------------------------------------------
# POST /auth-adapter/login: like the API gateway in front of it, 401 without the bearer of a token
# /oauth/token issued (an API-client token); then 200 {"jwtToken"} when email/password match
# $TMP/expected, else 401. POST /oauth/token: records the client_id and client_secret it received.
# GET (users/me/tenants, probes): [acme] only for a bearer the stub issued or the test registered in
# $TMP/accepted-tokens, else 401 — so a broken Authorization header cannot pass.
cat >"$TMP/api.py" <<'PY'
import base64, http.server, json, os, sys, time, urllib.parse
d = sys.argv[1]
def accept(token):
    open(os.path.join(d, "accepted-tokens"), "a").write(token + "\n")
def jwt():
    b = lambda o: base64.urlsafe_b64encode(json.dumps(o).encode()).decode().rstrip("=")
    token = b({"alg": "RS256"}) + "." + b({"sub": "qa", "exp": int(time.time()) + 3600, "n": time.time()}) + ".c2ln"
    accept(token)
    return token
def bump(name):
    p = os.path.join(d, name); n = int(open(p).read()) if os.path.exists(p) else 0
    open(p, "w").write(str(n + 1))
class H(http.server.BaseHTTPRequestHandler):
    def reply(self, status, obj):
        body = json.dumps(obj).encode()
        self.send_response(status); self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body))); self.end_headers(); self.wfile.write(body)
    def do_POST(self):
        form = urllib.parse.parse_qs(self.rfile.read(int(self.headers.get("Content-Length") or 0)).decode())
        if self.path == "/auth-adapter/login":
            if self.headers.get("Authorization") != "Bearer OpaqueMintedToken0123456789":
                bump("gateway-refusals")
                return self.reply(401, {"message": "gateway: no valid token"})
            bump("logins")
            email, pw = open(os.path.join(d, "expected")).read().split("\n", 1)
            if form.get("email") == [email] and form.get("password") == [pw]:
                return self.reply(200, {"jwtToken": jwt()})
            return self.reply(401, {"message": "invalid credentials"})
        if self.path == "/oauth/token":
            open(os.path.join(d, "minted-with"), "w").write((form.get("client_secret") or [""])[0])
            open(os.path.join(d, "minted-for"), "w").write((form.get("client_id") or [""])[0])
            accept("OpaqueMintedToken0123456789")
            return self.reply(200, {"access_token": "OpaqueMintedToken0123456789"})
        self.reply(404, {})
    def do_GET(self):
        p = os.path.join(d, "accepted-tokens")
        accepted = set(open(p).read().split()) if os.path.exists(p) else set()
        auth = self.headers.get("Authorization") or ""
        if not auth.startswith("Bearer ") or auth[7:] not in accepted:
            return self.reply(401, {"message": "unknown bearer"})
        self.reply(200, [{"tenant": "acme"}])
    def log_message(self, *a): pass
s = http.server.HTTPServer(("127.0.0.1", 0), H)
open(os.path.join(d, "api-port"), "w").write(str(s.server_port))
s.serve_forever()
PY
printf 'qa@example.com\n%s' "$PASSWORD" >"$TMP/expected"
STUB_PID=$( (python3 -I "$TMP/api.py" "$TMP" >/dev/null 2>&1 & echo $!) )
for _ in $(seq 1 50); do [ -s "$TMP/api-port" ] && break; sleep 0.1; done
[ -s "$TMP/api-port" ] || fail "stub API did not start"
API="http://127.0.0.1:$(cat "$TMP/api-port")"
count() { cat "$TMP/$1" 2>/dev/null || echo 0; }

# --- stub `security` -------------------------------------------------------------------------
# Items live in $TMP/keychain.json as {"service|account": {"value", "trusted"}}. Every argv is
# logged. STUB_SEC_DENY=1 refuses reads like a denied prompt; STUB_SEC_OPEN=1 reports a trusted
# application in dump-keychain (as after "Always Allow").
cat >"$TMP/security" <<'PY'
#!/usr/bin/env python3
import json, os, shlex, sys
d = os.environ["STUB_DIR"]; kc = os.path.join(d, "keychain.json")
open(os.path.join(d, "security-argv.log"), "a").write(" ".join(sys.argv[1:]) + "\n")
items = json.load(open(kc)) if os.path.exists(kc) else {}
def save(): json.dump(items, open(kc, "w"))
def opt(args, name):
    return args[args.index(name) + 1] if name in args else None
def run(args):
    cmd = args[0]
    if cmd == "find-generic-password":
        key = f'{opt(args, "-s")}|{opt(args, "-a")}'
        if key not in items:
            print("security: SecKeychainSearchCopyNext: The specified item could not be found in the keychain.", file=sys.stderr); return 44
        if "-w" in args:
            if os.environ.get("STUB_SEC_DENY"):
                print("security: SecKeychainItemCopyContent: User canceled the operation.", file=sys.stderr); return 128
            open(os.path.join(d, "keychain-reads"), "a").write(key + "\n")
            print(items[key]["value"])
        return 0
    if cmd == "delete-generic-password":
        items.pop(f'{opt(args, "-s")}|{opt(args, "-a")}', None); save(); return 0
    if cmd == "add-generic-password":
        items[f'{opt(args, "-s")}|{opt(args, "-a")}'] = {"value": bytes.fromhex(opt(args, "-X")).decode(), "trusted": opt(args, "-T")}
        save(); return 0
    if cmd == "dump-keychain":
        for key, it in items.items():
            s, a = key.split("|")
            apps = "applications (1):" if os.environ.get("STUB_SEC_OPEN") or it["trusted"] else "applications (0):"
            print(f'keychain: "login.keychain-db"\nattributes:\n    "acct"<blob>="{a}"\n    "svce"<blob>="{s}"\naccess: 5 entries\n    entry 1:\n        authorizations (6): decrypt derive export_clear export_wrapped mac sign\n        don\'t-require-password\n        description: {s}\n        {apps}')
        return 0
    return 1
if sys.argv[1:] == ["-i"]:
    for line in sys.stdin:
        if line.strip():
            run(shlex.split(line))
    sys.exit(0)
sys.exit(run(sys.argv[1:]))
PY
chmod +x "$TMP/security"

# --- curl shim: log the command line, then run the real curl ---------------------------------
REAL_CURL=$(command -v curl)
mkdir -p "$TMP/bin"
cat >"$TMP/bin/curl" <<SH
#!/usr/bin/env bash
printf '%s\n' "\$*" >>"$TMP/curl-argv.log"
exec "$REAL_CURL" "\$@"
SH
chmod +x "$TMP/bin/curl"
export PATH="$TMP/bin:$PATH" STUB_DIR="$TMP"
export EMPORIX_SECURITY_CMD="$TMP/security" EMPORIX_PLATFORM=Darwin

export EMPORIX_TENANTS_FILE="$TMP/home/tenants.json"
mkdir -p "$TMP/home"
printf '{"profiles":{"acme-api":{"tenant":"acme","apiUrl":"%s","clientId":"cid","clientSecret":"%s"}},"default":"acme-api"}\n' "$API" "$CLIENT_SECRET" >"$EMPORIX_TENANTS_FILE"
chmod 600 "$EMPORIX_TENANTS_FILE"
TOKEN_FILE="$TMP/home/tokens/acme-login"
no_secret_anywhere() {  # $1 = output to check, $2 = what for
  case "$1" in *"$PASSWORD"*|*S3cret*) fail "$2: the password was printed" ;; esac
  ! grep -q "S3cret" "$EMPORIX_TENANTS_FILE" || fail "$2: the password is in tenants.json"
  ! grep -q "S3cret" "$TMP/security-argv.log" 2>/dev/null || fail "$2: the password was a security argument"
  ! grep -q "S3cret" "$TMP/curl-argv.log" 2>/dev/null || fail "$2: the password was a curl argument"
}

# Scenario 21 — setup on macOS, email + password: kind 1, tenant, alias, sign-in 1, email,
# default? n, store in the Keychain (1), then the hidden password. The password goes to the Keychain
# with an empty trusted list, the profile holds only the reference, and one sign-in checks it — called
# with the token of the tenant's only API-client profile (acme-api), as the API gateway requires.
out=$(printf '1\nacme\nacme-login\n1\nqa@example.com\nn\n1\n%s\n' "$PASSWORD" \
  | bash "$TENANTS" setup --api-url "$API" --no-open 2>&1) || fail "setup with password: $out"
no_secret_anywhere "$out" "setup"
echo "$out" | grep -q "Stored password of 'acme-login' in the macOS Keychain (item emporix-tenants.acme-login.password)" || fail "keychain store line: $out"
echo "$out" | grep -q "auth=employee-token expires=" || fail "setup did not sign in: $out"
echo "$out" | grep -q "SECRET_password=keychain (asks on every read)" || fail "setup ACL line: $out"
python3 -I - "$EMPORIX_TENANTS_FILE" "$TMP/keychain.json" <<'PY' || fail "setup wrote the wrong profile or item: $(cat "$EMPORIX_TENANTS_FILE")"
import json, sys
p = json.load(open(sys.argv[1]))["profiles"]["acme-login"]
assert p["email"] == "qa@example.com" and p["password"] == "keychain:emporix-tenants.acme-login.password" and p["auth"] == "employee-token", p
it = json.load(open(sys.argv[2]))["emporix-tenants.acme-login.password|acme-login"]
assert it["trusted"] == "" and it["value"] == 'S3cret pw&"q"', it
PY
[ "$(count logins)" = 1 ] || fail "setup logins $(count logins)"
[ "$(count gateway-refusals)" = 0 ] || fail "the sign-in reached auth-adapter/login without an API-client token"
[ "$(cat "$TMP/minted-for")" = cid ] || fail "the sign-in token was not minted from acme-api"
m=$(stat -f '%Lp' "$TOKEN_FILE" 2>/dev/null || stat -c '%a' "$TOKEN_FILE"); [ "$m" = 600 ] || fail "token file mode $m"

# Scenario 18 — a fresh cached token is reused: no Keychain read, no sign-in.
reads=$(wc -l <"$TMP/keychain-reads")
out=$(bash "$TENANTS" check acme-login 2>&1) || fail "check with cached token: $out"
[ "$(count logins)" = 1 ] || fail "signed in although the token was fresh"
[ "$(wc -l <"$TMP/keychain-reads")" = "$reads" ] || fail "read the Keychain although the token was fresh"

# Scenario 18 — an expiring token: the password is read from the Keychain and a new token fetched.
python3 -I -c 'import base64,json,time;b=lambda o:base64.urlsafe_b64encode(json.dumps(o).encode()).decode().rstrip("=");print(b({"alg":"RS256"})+"."+b({"exp":int(time.time())+20})+".c2ln")' >"$TOKEN_FILE"
out=$(bash "$TENANTS" check acme-login 2>&1) || fail "check with expiring token: $out"
[ "$(count logins)" = 2 ] || fail "no sign-in for an expiring token"
[ "$(wc -l <"$TMP/keychain-reads")" -gt "$reads" ] || fail "no Keychain read for the sign-in"
no_secret_anywhere "$out" "re-login"

# refresh signs in again with the stored email and password, even with a fresh token.
out=$(bash "$TENANTS" refresh acme-login 2>&1) || fail "refresh: $out"
echo "$out" | grep -q "Signing in again as qa@example.com" || fail "refresh line: $out"
[ "$(count logins)" = 3 ] || fail "refresh did not sign in"

# copy-token puts the profile's token on the clipboard (stdin of the copy command), names the tenant,
# and never prints the token.
out=$(EMPORIX_COPY_CMD="cat > $TMP/clipboard" bash "$TENANTS" copy-token acme-login 2>&1) || fail "copy-token: $out"
[ "$(cat "$TMP/clipboard")" = "$(cat "$TOKEN_FILE")" ] || fail "copy-token did not copy the token"
echo "$out" | grep -q "Tenant = acme, Token = paste" || fail "copy-token gate hint: $out"
case "$out" in *"$(cat "$TOKEN_FILE")"*) fail "copy-token printed the token" ;; esac
out=$(EMPORIX_COPY_CMD="cat > $TMP/clipboard-cc" bash "$TENANTS" copy-token acme-api 2>&1) || fail "copy-token client-credentials: $out"
[ "$(cat "$TMP/clipboard-cc")" = OpaqueMintedToken0123456789 ] || fail "copy-token did not copy the minted token"

# "Always Allow" widened the trusted list: check warns and names the fix.
out=$(STUB_SEC_OPEN=1 bash "$TENANTS" check acme-login 2>&1) || fail "check with open ACL: $out"
echo "$out" | grep -q "SECRET_password=keychain-open" || fail "open ACL state: $out"
echo "$out" | grep -q 'no longer asks before a read' || fail "open ACL warning: $out"
echo "$out" | grep -q "set-secret acme-login password" || fail "open ACL fix: $out"

# Scenario 19 — wrong password: the sign-in fails with the profile and the status; no token is written.
printf 'qa@example.com\nanother-password' >"$TMP/expected"
rm -f "$TOKEN_FILE"
if out=$(bash "$TENANTS" check acme-login 2>&1); then fail "wrong password passed"; fi
echo "$out" | grep -q "Sign-in failed for profile 'acme-login' (qa@example.com): HTTP 401 from $API/auth-adapter/login" || fail "wrong password message: $out"
[ ! -e "$TOKEN_FILE" ] || fail "a token file was written after a failed sign-in"
no_secret_anywhere "$out" "wrong password"
printf 'qa@example.com\n%s' "$PASSWORD" >"$TMP/expected"

# Scenario 20 — the Keychain read is denied, or the item is missing: stop, say how to fix it, and
# offer the paste alternative.
if out=$(STUB_SEC_DENY=1 bash "$TENANTS" check acme-login 2>&1); then fail "denied Keychain read passed"; fi
echo "$out" | grep -q "cannot read password from the macOS Keychain: the read was denied" || fail "denied message: $out"
echo "$out" | grep -q "refresh acme-login --paste" || fail "denied paste alternative: $out"
"$TMP/security" delete-generic-password -s emporix-tenants.acme-login.password -a acme-login
if out=$(bash "$TENANTS" check acme-login 2>&1); then fail "missing Keychain item passed"; fi
echo "$out" | grep -q "there is no Keychain item 'emporix-tenants.acme-login.password' for account 'acme-login'" || fail "missing item message: $out"
echo "$out" | grep -q "set-secret acme-login password" || fail "missing item fix: $out"

# refresh --paste still takes a pasted token for a sign-in profile.
GOOD=$(python3 -I -c 'import base64,json,time;b=lambda o:base64.urlsafe_b64encode(json.dumps(o).encode()).decode().rstrip("=");print(b({"alg":"RS256"})+"."+b({"exp":int(time.time())+3600})+".c2ln")')
logins=$(count logins)
printf '%s\n' "$GOOD" >>"$TMP/accepted-tokens"
out=$(printf '%s\n' "$GOOD" | EMPORIX_CLIPBOARD_CMD=true bash "$TENANTS" refresh acme-login --paste --no-open 2>&1) || fail "refresh --paste: $out"
[ "$(cat "$TOKEN_FILE")" = "$GOOD" ] || fail "refresh --paste did not store the token"
[ "$(count logins)" = "$logins" ] || fail "refresh --paste signed in"

# Scenario 22 (changed 2026-11-23) — on macOS a plaintext password in the profile is the developer's
# choice: it signs in without a Keychain read, and check notes where it is and how to move it.
python3 -I - "$EMPORIX_TENANTS_FILE" "$PASSWORD" <<'PY'
import json, sys
c = json.load(open(sys.argv[1])); c["profiles"]["acme-plain"] = {"tenant": "acme", "apiUrl": c["profiles"]["acme-api"]["apiUrl"], "auth": "employee-token", "email": "qa@example.com", "password": sys.argv[2]}
json.dump(c, open(sys.argv[1], "w"))
PY
logins=$(count logins); reads=$(wc -l <"$TMP/keychain-reads")
out=$(bash "$TENANTS" check acme-plain 2>&1) || fail "plaintext password on macOS: $out"
[ "$(count logins)" = $((logins + 1)) ] || fail "no sign-in with the plaintext password on macOS"
[ "$(wc -l <"$TMP/keychain-reads")" = "$reads" ] || fail "read the Keychain although the password is in the profile"
echo "$out" | grep -q "SECRET_password=plaintext" || fail "macOS plaintext state: $out"
echo "$out" | grep -q "read without asking" || fail "macOS plaintext note: $out"
echo "$out" | grep -q "set-secret acme-plain password --store keychain" || fail "macOS plaintext move hint: $out"
case "$out" in *S3cret*) fail "plaintext check printed the password" ;; esac
rm -f "$TMP/home/tokens/acme-plain"

# Scenario 22 — without the macOS Keychain the plaintext password signs in, with a note.
logins=$(count logins)
out=$(EMPORIX_PLATFORM=Linux bash "$TENANTS" check acme-plain 2>&1) || fail "plaintext password on Linux: $out"
[ "$(count logins)" = $((logins + 1)) ] || fail "no sign-in with the plaintext password"
echo "$out" | grep -q "SECRET_password=plaintext" || fail "plaintext state: $out"
echo "$out" | grep -q "stored in plain text" || fail "plaintext note: $out"
case "$out" in *S3cret*) fail "plaintext check printed the password" ;; esac
! grep -q "S3cret" "$TMP/curl-argv.log" || fail "plaintext password was a curl argument"

# A keychain: reference on a system without the Keychain is a clear error once a sign-in is needed.
rm -f "$TOKEN_FILE"
if out=$(EMPORIX_PLATFORM=Linux bash "$TENANTS" check acme-login 2>&1); then fail "keychain reference passed on Linux"; fi
echo "$out" | grep -q "this system has no macOS Keychain" || fail "no-keychain message: $out"

# set-secret without the Keychain stores the value in the profile and says so.
out=$(printf 'n3w-plain\n' | EMPORIX_PLATFORM=Linux bash "$TENANTS" set-secret acme-plain password 2>&1) || fail "set-secret on Linux: $out"
echo "$out" | grep -q "in plain text in" || fail "set-secret plaintext note: $out"
grep -q '"password": "n3w-plain"' "$EMPORIX_TENANTS_FILE" || fail "set-secret did not write the plaintext value"

# Scenario 23 — an existing plaintext clientSecret still mints, unchanged.
out=$(bash "$TENANTS" check acme-api 2>&1) || fail "plaintext clientSecret: $out"
echo "$out" | grep -q "auth=client-credentials token=minted" || fail "plaintext mint line: $out"
[ "$(cat "$TMP/minted-with")" = "$CLIENT_SECRET" ] || fail "minted with the wrong secret"

# Scenario 24 — clientSecret as a keychain: reference mints with the resolved value.
out=$(printf '1\n%s\n' "$CLIENT_SECRET-kc" | bash "$TENANTS" set-secret acme-api 2>&1) || fail "set-secret clientSecret: $out"
grep -q '"clientSecret": "keychain:emporix-tenants.acme-api.clientSecret"' "$EMPORIX_TENANTS_FILE" || fail "clientSecret reference not written"
! grep -q "$CLIENT_SECRET-kc" "$EMPORIX_TENANTS_FILE" || fail "clientSecret value in tenants.json"
out=$(bash "$TENANTS" check acme-api 2>&1) || fail "keychain clientSecret: $out"
echo "$out" | grep -q "auth=client-credentials token=minted" || fail "keychain mint line: $out"
[ "$(cat "$TMP/minted-with")" = "$CLIENT_SECRET-kc" ] || fail "minted without the Keychain value"
case "$out" in *"$CLIENT_SECRET-kc"*) fail "check printed the client secret" ;; esac
! grep -q "$CLIENT_SECRET-kc" "$TMP/security-argv.log" || fail "client secret was a security argument"

# An email without a password: on macOS the password comes from the Keychain item
# emporix-tenants.<alias>.password; elsewhere the profile is reported incomplete, not guessed.
python3 -I - "$EMPORIX_TENANTS_FILE" <<'PY'
import json, sys
c = json.load(open(sys.argv[1])); c["profiles"]["acme-half"] = {"tenant": "acme", "apiUrl": c["profiles"]["acme-api"]["apiUrl"], "auth": "employee-token", "email": "qa@example.com"}
json.dump(c, open(sys.argv[1], "w"))
PY
if out=$(EMPORIX_PLATFORM=Linux bash "$TENANTS" check acme-half 2>&1); then fail "email without password passed on Linux"; fi
echo "$out" | grep -q "set the password of qa@example.com" || fail "half profile message: $out"
if out=$(bash "$TENANTS" check acme-half 2>&1); then fail "email without password and without a Keychain item passed"; fi
echo "$out" | grep -q "there is no Keychain item 'emporix-tenants.acme-half.password' for account 'acme-half'" || fail "Keychain fallback item: $out"
printf 'add-generic-password -s emporix-tenants.acme-half.password -a acme-half -T "" -X %s\n' "$(printf '%s' "$PASSWORD" | od -An -tx1 | tr -d ' \n')" \
  | "$TMP/security" -i
reads=$(wc -l <"$TMP/keychain-reads")
out=$(bash "$TENANTS" check acme-half 2>&1) || fail "Keychain fallback sign-in: $out"
[ "$(wc -l <"$TMP/keychain-reads")" -gt "$reads" ] || fail "the fallback did not read the Keychain"
echo "$out" | grep -q "SECRET_password=keychain (asks on every read)" || fail "fallback ACL line: $out"
! grep -q '"password"' <(python3 -I -c 'import json,sys;print(json.dumps(json.load(open(sys.argv[1]))["profiles"]["acme-half"]))' "$EMPORIX_TENANTS_FILE") || fail "the fallback wrote a password field"
no_secret_anywhere "$out" "Keychain fallback"

# set-secret on macOS can keep the password in the profile instead (--store file, or answer 2), and
# names the Keychain item that is no longer used.
out=$(printf '%s\n' "$PASSWORD" | bash "$TENANTS" set-secret acme-half password --store file 2>&1) || fail "set-secret --store file: $out"
echo "$out" | grep -q "in plain text in .* it is read without asking" || fail "set-secret file note: $out"
echo "$out" | grep -q "security delete-generic-password -s emporix-tenants.acme-half.password -a acme-half" || fail "unused Keychain item hint: $out"
python3 -I - "$EMPORIX_TENANTS_FILE" "$PASSWORD" <<'PY' || fail "set-secret --store file did not write the value"
import json, sys
assert json.load(open(sys.argv[1]))["profiles"]["acme-half"]["password"] == sys.argv[2]
PY
rm -f "$TMP/home/tokens/acme-half"
out=$(bash "$TENANTS" check acme-half 2>&1) || fail "plaintext after set-secret --store file: $out"
echo "$out" | grep -q "SECRET_password=plaintext" || fail "plaintext after --store file: $out"
out=$(printf '2\nanother\n' | bash "$TENANTS" set-secret acme-half password 2>&1) || fail "set-secret answer 2: $out"
grep -q '"password": "another"' "$EMPORIX_TENANTS_FILE" || fail "answer 2 did not keep the value in the file"
if out=$(printf 'x\n' | EMPORIX_PLATFORM=Linux bash "$TENANTS" set-secret acme-half password --store keychain 2>&1); then fail "--store keychain passed on Linux"; fi
echo "$out" | grep -q "no macOS Keychain" || fail "--store keychain on Linux: $out"
printf 'qa@example.com\n%s' "$PASSWORD" >"$TMP/expected"

# The sign-in needs an API client (the gateway refuses auth-adapter/login without a token):
# none for the tenant, or several without "loginClient", stops before any request; "loginClient"
# picks one; a wrong loginClient is named.
python3 -I - "$EMPORIX_TENANTS_FILE" "$PASSWORD" <<'PY'
import json, sys
c = json.load(open(sys.argv[1])); api = c["profiles"]["acme-api"]["apiUrl"]
c["profiles"]["beta-login"] = {"tenant": "beta", "apiUrl": api, "auth": "employee-token", "email": "qa@example.com", "password": sys.argv[2]}
c["profiles"]["acme-api2"] = {"tenant": "acme", "apiUrl": api, "clientId": "cid2", "clientSecret": "second-secret"}
c["profiles"]["acme-plain"]["password"] = sys.argv[2]
json.dump(c, open(sys.argv[1], "w"))
PY
logins=$(count logins); refusals=$(count gateway-refusals)
if out=$(bash "$TENANTS" check beta-login 2>&1); then fail "sign-in without an API client passed"; fi
echo "$out" | grep -q "no client-credentials profile for tenant beta" || fail "no API client message: $out"
echo "$out" | grep -q '"loginClient"' || fail "no API client fix: $out"
rm -f "$TMP/home/tokens/acme-plain"
if out=$(bash "$TENANTS" check acme-plain 2>&1); then fail "ambiguous API clients passed"; fi
echo "$out" | grep -q 'several client-credentials profiles fit (acme-api, acme-api2); name one as "loginClient"' || fail "ambiguous message: $out"
[ "$(count logins)" = "$logins" ] && [ "$(count gateway-refusals)" = "$refusals" ] || fail "a sign-in was sent without a chosen API client"
python3 -I - "$EMPORIX_TENANTS_FILE" <<'PY'
import json, sys
c = json.load(open(sys.argv[1])); c["profiles"]["acme-plain"]["loginClient"] = "acme-api2"; json.dump(c, open(sys.argv[1], "w"))
PY
out=$(bash "$TENANTS" check acme-plain 2>&1) || fail "sign-in with loginClient: $out"
[ "$(cat "$TMP/minted-for")" = cid2 ] && [ "$(cat "$TMP/minted-with")" = second-secret ] || fail "loginClient did not pick acme-api2"
[ "$(count logins)" = $((logins + 1)) ] || fail "no sign-in with loginClient"
python3 -I - "$EMPORIX_TENANTS_FILE" <<'PY'
import json, sys
c = json.load(open(sys.argv[1])); c["profiles"]["acme-plain"]["loginClient"] = "acme-login"; json.dump(c, open(sys.argv[1], "w"))
PY
rm -f "$TMP/home/tokens/acme-plain"
if out=$(bash "$TENANTS" check acme-plain 2>&1); then fail "an employee profile as loginClient passed"; fi
echo "$out" | grep -q 'its loginClient "acme-login" is not a complete client-credentials profile' || fail "bad loginClient message: $out"
! grep -q "second-secret" "$TMP/curl-argv.log" || fail "the login client's secret was a curl argument"
python3 -I - "$EMPORIX_TENANTS_FILE" <<'PY'
import json, sys
c = json.load(open(sys.argv[1])); del c["profiles"]["acme-api2"]; del c["profiles"]["acme-plain"]["loginClient"]; json.dump(c, open(sys.argv[1], "w"))
PY

# check --probe sends the profile's token (the stub refuses any other bearer) through a header file.
out=$(bash "$TENANTS" check acme-api --probe "$API/probe" 2>&1) || fail "probe: $out"
echo "$out" | grep -q "PROBE_HTTP=200" || fail "probe did not send the profile's token: $out"

# Requirement 35 — no token (signed-in JWT, pasted JWT, minted API-client token) was ever a curl argument.
[ -s "$TMP/accepted-tokens" ] || fail "the stub issued no token"
[ -s "$TMP/curl-argv.log" ] || fail "the curl shim logged nothing"
! grep -q "$CLIENT_SECRET" "$TMP/curl-argv.log" || fail "the client secret was a curl argument (visible in ps)"
if grep -F -f "$TMP/accepted-tokens" "$TMP/curl-argv.log" >/dev/null; then
  fail "a token was passed to curl as an argument (visible in ps)"
fi

echo "employee-login tests: ok"
