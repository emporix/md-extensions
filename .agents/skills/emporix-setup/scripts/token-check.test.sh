#!/usr/bin/env bash
# Behaviour tests for emporix_token_check (emporix-env.sh): JWTs and opaque client-credentials
# tokens pass; malformed values, whitespace and control characters fail. The value is checked
# exactly as given — it is never trimmed, because the scripts send it on unchanged.
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../../.." && pwd)
# shellcheck disable=SC1091
. "$ROOT/skills/emporix-setup/scripts/emporix-env.sh"
fail() { echo "FAIL: $1" >&2; exit 1; }
field() { printf '%s\n' "$1" | sed -n "s/^$2=//p" | head -n 1; }

# expect PASS|FAIL PAYLOAD TOKEN
expect() {
  local want=$1 payload=$2 out code
  EMPORIX_TOKEN=$3
  if out=$(emporix_token_check); then code=PASS; else code=FAIL; fi
  [ "$code" = "$want" ] || fail "expected $want for $(printf '%q' "$3"): $out"
  [ "$(field "$out" TOKEN_PAYLOAD)" = "$payload" ] || fail "payload for $(printf '%q' "$3"): $out"
}

JWT="eyJhbGciOiJSUzI1NiJ9.$(printf '{"sub":"x"}' | base64 | tr -d '=\n' | tr '/+' '_-').c2ln"
OPAQUE="AbCdEfGhIjKlMnOpQrStUvWxYz12"
NL='
'
expect PASS valid_json "$JWT"
expect PASS opaque "$OPAQUE"
expect FAIL invalid_json "abc.bm90LWpzb24.sig"
expect FAIL not_jwt ""
expect FAIL not_jwt "short"
expect FAIL not_jwt '{"error":"invalid_client"}'
expect FAIL not_jwt "<html>Bad Gateway</html>"

# Whitespace is never trimmed away: the token passed onward must be exactly the one checked.
expect FAIL not_jwt " $OPAQUE "
expect FAIL not_jwt "$OPAQUE$NL"
expect FAIL not_jwt "Bearer $OPAQUE"
expect FAIL not_jwt " $JWT"
expect FAIL not_jwt "$JWT$NL"
out=$(EMPORIX_TOKEN="$OPAQUE$NL"; emporix_token_check || true)
[ "$(field "$out" CONTROL_CHARS)" = 1 ] || fail "trailing newline not reported as a control character: $out"
[ "$(field "$out" TOKEN_LEN)" = 29 ] || fail "length must count the untrimmed value: $out"

echo "token-check tests: ok"
