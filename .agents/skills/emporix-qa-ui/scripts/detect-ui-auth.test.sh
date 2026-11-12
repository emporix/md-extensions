#!/usr/bin/env sh
# Behaviour tests for detect-ui-auth.sh and the shared tenant-profile loader.
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../../.." && pwd)
DETECT="$ROOT/skills/emporix-qa-ui/scripts/detect-ui-auth.sh"
fail() { echo "FAIL: $1" >&2; exit 1; }

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

# Preserve configured local-qa args
mkdir -p "$TMP/md-args"
printf '%s\n' '{"name":"md","scripts":{"serve:local-qa":"vite --mode local-qa"}}' >"$TMP/md-args/package.json"
printf '%s\n' '{"app":{"auth":"md-token","start":"npm run serve:local-qa -- --port 4300","baseUrl":"http://localhost:4300"}}' >"$TMP/md-args/ai-setup.json"
out=$(sh "$DETECT" "$TMP/md-args")
echo "$out" | grep -Fq 'START=npm run serve:local-qa -- --port 4300' || fail "did not preserve local-qa args: $out"

# Reject MD without serve:local-qa
mkdir -p "$TMP/md-old"
printf '%s\n' '{"name":"management-dashboard","scripts":{"serve":"vite"}}' >"$TMP/md-old/package.json"
printf '%s\n' '{"app":{"auth":"md-token","start":"npm run serve"}}' >"$TMP/md-old/ai-setup.json"
if sh "$DETECT" "$TMP/md-old" >/dev/null 2>"$TMP/err"; then
  fail "expected MD without serve:local-qa to fail"
fi
grep -q 'serve:local-qa' "$TMP/err" || fail "missing error about serve:local-qa"

# Profile loader (emporix-setup/scripts/emporix-env.sh): default alias, explicit alias, minted token.
# The file holds no token; the minting call is stubbed so the test needs no network.
ENV_SH="$ROOT/skills/emporix-setup/scripts/emporix-env.sh"
cat >"$TMP/tenants.json" <<'JSON'
{"default":"acme","profiles":{"acme":{"tenant":"acme","apiUrl":"https://api-stage.emporix.io/","clientId":"id-a","clientSecret":"sec-a","scopes":"product.product_read","language":"de"},"other":{"tenant":"other-tenant","clientId":"id-b","clientSecret":"sec-b"},"broken":{"tenant":"broken","clientId":"id-c"}}}
JSON
STUB='_emporix_mint_token() { EMPORIX_TOKEN="minted:$EMPORIX_CLIENT_ID:$EMPORIX_CLIENT_SECRET:${EMPORIX_SCOPES:-}@$EMPORIX_API_URL"; }'
out=$(EMPORIX_TENANTS_FILE="$TMP/tenants.json" bash -c '. "$0"; eval "$1"; emporix_require_env && echo "$EMPORIX_PROFILE|$EMPORIX_TENANT|$EMPORIX_LANGUAGE|$EMPORIX_TOKEN"' "$ENV_SH" "$STUB")
[ "$out" = "acme|acme|de|minted:id-a:sec-a:product.product_read@https://api-stage.emporix.io" ] || fail "default profile not resolved / token not minted from the API client: $out"
out=$(EMPORIX_TENANTS_FILE="$TMP/tenants.json" EMPORIX_PROFILE=other bash -c '. "$0"; eval "$1"; emporix_require_env && echo "$EMPORIX_TENANT|$EMPORIX_API_URL|$EMPORIX_TOKEN"' "$ENV_SH" "$STUB")
[ "$out" = "other-tenant|https://api.emporix.io|minted:id-b:sec-b:@https://api.emporix.io" ] || fail "explicit profile not resolved: $out"
if EMPORIX_TENANTS_FILE="$TMP/tenants.json" EMPORIX_PROFILE=broken bash -c '. "$0"; eval "$1"; emporix_require_env' "$ENV_SH" "$STUB" 2>"$TMP/err"; then
  fail "profile without clientSecret accepted"
fi
grep -q 'clientId + clientSecret' "$TMP/err" || fail "missing incomplete-profile error: $(cat "$TMP/err")"
# A real JWT passes the sanity check; the stub token does not
out=$(EMPORIX_TOKEN='eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4In0.sig' bash -c '. "$0"; emporix_token_check' "$ENV_SH") || fail "valid JWT rejected: $out"
echo "$out" | grep -Fq 'TOKEN_PAYLOAD=valid_json' || fail "token check output: $out"
if EMPORIX_TOKEN='not-a-jwt' bash -c '. "$0"; emporix_token_check' "$ENV_SH" >/dev/null; then fail "non-JWT accepted"; fi
if EMPORIX_TENANTS_FILE="$TMP/tenants.json" EMPORIX_PROFILE=nope bash -c '. "$0"; emporix_require_env' "$ENV_SH" 2>"$TMP/err"; then
  fail "unknown profile accepted"
fi
grep -q 'Unknown profile' "$TMP/err" || fail "missing unknown-profile error: $(cat "$TMP/err")"
# Environment variables must not provide credentials
if EMPORIX_TENANTS_FILE="$TMP/none.json" EMPORIX_TENANT=env EMPORIX_TOKEN=env bash -c '. "$0"; _emporix_scripts_dir=/nonexistent; emporix_require_env' "$ENV_SH" >/dev/null 2>&1; then
  fail "env credentials were accepted without a profiles file"
fi

# Cockpit identity beats app.auth none
mkdir -p "$TMP/ct-none"
printf '%s\n' '{"name":"order-cockpit","scripts":{"serve":"vite"}}' >"$TMP/ct-none/package.json"
printf '%s\n' '{"app":{"auth":"none","start":"npm run serve"}}' >"$TMP/ct-none/ai-setup.json"
out=$(sh "$DETECT" "$TMP/ct-none")
echo "$out" | grep -Fq 'AUTH=cockpit-token' || fail "cockpit lost to app.auth none: $out"
echo "$out" | grep -Fq 'GATE=1' || fail "cockpit GATE not 1: $out"

echo "ok"
