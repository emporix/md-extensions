#!/usr/bin/env bash
# Behaviour tests for prepare-env.sh: values from a tenant profile (--tenant, keychain: references
# resolved through a stub `security`), explicit env winning per key, and the env-only path.
set -eu
HERE=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PREPARE="$HERE/prepare-env.sh"
fail() { echo "FAIL: $1" >&2; exit 1; }
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

cat >"$TMP/template.json" <<'JSON'
{"name": "cart", "values": [
  {"key": "api-url", "value": ""}, {"key": "tenant", "value": ""},
  {"key": "client_id", "value": ""}, {"key": "client_secret", "value": ""},
  {"key": "client_id_storefront", "value": ""}, {"key": "client_secret_storefront", "value": ""}
]}
JSON
# Stub security: the Keychain holds one item for the storefront secret.
cat >"$TMP/security" <<'SH'
#!/usr/bin/env sh
echo "$*" >>"$STUB_LOG"
case "$*" in
  "find-generic-password -s emporix-tenants.acme-api.storefrontClientSecret -a acme-api -w") echo "sf-secret-from-keychain" ;;
  *) echo "security: The specified item could not be found in the keychain." >&2; exit 44 ;;
esac
SH
chmod +x "$TMP/security"
export STUB_LOG="$TMP/security.log" EMPORIX_SECURITY_CMD="$TMP/security" EMPORIX_PLATFORM=Darwin
export EMPORIX_TENANTS_FILE="$TMP/tenants.json"
cat >"$EMPORIX_TENANTS_FILE" <<'JSON'
{"default": "acme-api", "profiles": {
  "acme-api": {"tenant": "acme", "apiUrl": "https://api-develop.emporix.io", "clientId": "cid", "clientSecret": "plain-secret",
               "storefrontClientId": "sf-cid", "storefrontClientSecret": "keychain:emporix-tenants.acme-api.storefrontClientSecret"},
  "acme-admin": {"tenant": "acme", "auth": "employee-token"}
}}
JSON
chmod 600 "$EMPORIX_TENANTS_FILE"
unset EMPORIX_QA_API_URL API_URL EMPORIX_QA_TENANT TENANT EMPORIX_QA_CLIENT_ID CLIENT_ID EMPORIX_QA_CLIENT_SECRET CLIENT_SECRET \
  EMPORIX_QA_CLIENT_ID_STOREFRONT CLIENT_ID_STOREFRONT EMPORIX_QA_CLIENT_SECRET_STOREFRONT CLIENT_SECRET_STOREFRONT CLIENT_ID_SECRET 2>/dev/null || true
value() { python3 -I -c 'import json,sys; print({v["key"]: v["value"] for v in json.load(open(sys.argv[1]))["values"]}[sys.argv[2]])' "$1" "$2"; }

# Scenario 27 — --tenant fills every key from the profile, the storefront secret from the Keychain;
# an API_URL set by the run step (the local origin) wins for api-url; no secret is printed.
out=$(API_URL=http://localhost:8081 sh "$PREPARE" --template "$TMP/template.json" --out "$TMP/out.json" --tenant acme-api 2>&1) || fail "--tenant: $out"
case "$out" in *plain-secret*|*sf-secret*) fail "prepare-env printed a secret: $out" ;; esac
[ "$(value "$TMP/out.json" tenant)" = acme ] || fail "tenant"
[ "$(value "$TMP/out.json" api-url)" = http://localhost:8081 ] || fail "api-url: $(value "$TMP/out.json" api-url)"
[ "$(value "$TMP/out.json" client_id)" = cid ] || fail "client_id"
[ "$(value "$TMP/out.json" client_secret)" = plain-secret ] || fail "client_secret"
[ "$(value "$TMP/out.json" client_id_storefront)" = sf-cid ] || fail "client_id_storefront"
[ "$(value "$TMP/out.json" client_secret_storefront)" = sf-secret-from-keychain ] || fail "client_secret_storefront"
! grep -q "sf-secret-from-keychain" "$STUB_LOG" || fail "the secret was a security argument"

# Without API_URL the profile's apiUrl is used.
sh "$PREPARE" --template "$TMP/template.json" --out "$TMP/out2.json" --tenant acme-api >/dev/null 2>&1 || fail "--tenant without API_URL"
[ "$(value "$TMP/out2.json" api-url)" = https://api-develop.emporix.io ] || fail "profile api-url"

# Scenario 27 — an explicit value (a CLI flag exported by the skill) wins over the profile.
EMPORIX_QA_CLIENT_ID=flag-cid sh "$PREPARE" --template "$TMP/template.json" --out "$TMP/out3.json" --tenant acme-api >/dev/null 2>&1 || fail "override"
[ "$(value "$TMP/out3.json" client_id)" = flag-cid ] || fail "CLI value did not win"
[ "$(value "$TMP/out3.json" client_secret)" = plain-secret ] || fail "override changed another key"

# An employee-token profile cannot fill an API collection.
if out=$(sh "$PREPARE" --template "$TMP/template.json" --out "$TMP/out4.json" --tenant acme-admin 2>&1); then fail "employee profile accepted"; fi
echo "$out" | grep -q "need a client-credentials profile" || fail "employee profile message: $out"

# Scenario 27 — no profile named: EMPORIX_QA_* still work; stray PROFILE_* values are ignored.
out=$(EMPORIX_QA_API_URL=https://x EMPORIX_QA_TENANT=t EMPORIX_QA_CLIENT_ID=i EMPORIX_QA_CLIENT_SECRET=s \
  EMPORIX_QA_CLIENT_ID_STOREFRONT=si EMPORIX_QA_CLIENT_SECRET_STOREFRONT=ss PROFILE_TENANT=stray \
  sh "$PREPARE" --template "$TMP/template.json" --out "$TMP/out5.json" 2>&1) || fail "env only: $out"
[ "$(value "$TMP/out5.json" tenant)" = t ] || fail "env-only tenant"
if out=$(PROFILE_TENANT=stray PROFILE_API_URL=x PROFILE_CLIENT_ID=y PROFILE_CLIENT_SECRET=z \
  sh "$PREPARE" --template "$TMP/template.json" --out "$TMP/out6.json" 2>&1); then fail "stray PROFILE_* values were used"; fi

echo "prepare-env tests: ok"
