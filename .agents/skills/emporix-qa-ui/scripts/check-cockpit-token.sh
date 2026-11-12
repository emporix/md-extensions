#!/usr/bin/env bash
# Resolve the tenant profile, mint an API token from its API client, and sanity-check the token
# without printing it.
# Does not "fix" JWT characters. Unusable token → exit 1.
#
#   check-cockpit-token.sh [--tenant <alias>] [--probe URL]
#
# Credentials come only from ~/.emporix/tenants.json (emporix-setup/scripts/emporix-env.sh).
# The file holds no token: each profile has tenant, apiUrl, clientId, clientSecret, and the
# token is minted per run via POST /oauth/token. No environment variables, no .env files.
#
# Prints (never the token):
#   PROFILE=acme  TENANT=acme  API_URL=https://api.emporix.io
#   TOKEN_LEN=3488
#   TOKEN_PAYLOAD=valid_json|invalid_json|not_jwt
#   CONTROL_CHARS=0|1
#   PROBE_HTTP=200|401|…   (only with --probe; 401/403 → exit 1)

set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd)
ENV_SH="${EMPORIX_SKILLS_ROOT:-$here/../..}/emporix-setup/scripts/emporix-env.sh"
[ -f "$ENV_SH" ] || { echo "Missing $ENV_SH — install or update the emporix-setup skill." >&2; exit 1; }
# shellcheck disable=SC1090
. "$ENV_SH"

PROBE=""
while [ $# -gt 0 ]; do
  case "$1" in
    --tenant) EMPORIX_PROFILE="${2:-}"; shift 2 ;;
    --probe) PROBE="${2:-}"; shift 2 ;;
    -h|--help) sed -n '2,18p' "$0"; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; exit 2 ;;
  esac
done

emporix_require_env || {
  echo "Could not resolve tenant credentials. Run: tenants.sh list — then pass --tenant <alias>, or fix the profile (tenants.sh open)." >&2
  exit 1
}
echo "PROFILE=$EMPORIX_PROFILE TENANT=$EMPORIX_TENANT API_URL=$EMPORIX_API_URL"

emporix_token_check || {
  echo "The minted token is not a usable API JWT (invalid payload JSON, control characters, or not three segments)." >&2
  echo "Check apiUrl / clientId / clientSecret of profile '$EMPORIX_PROFILE' (tenants.sh open). Do not edit the token." >&2
  exit 1
}

if [ -n "$PROBE" ]; then
  status=$(curl -sS -o /dev/null -w '%{http_code}' "$PROBE" \
    -H "Authorization: Bearer $EMPORIX_TOKEN" -H "X-Tenant: $EMPORIX_TENANT" -H 'Accept: */*' || echo 000)
  echo "PROBE_HTTP=$status"
  case "$status" in
    401|403)
      echo "Probe $status. Do not drive the UI with this token. It carries only the scopes of the profile's API client — grant the missing scopes to that API client (or use a profile whose client has them)." >&2
      exit 1 ;;
  esac
fi
