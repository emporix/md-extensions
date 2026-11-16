#!/usr/bin/env bash
# Resolve the tenant profile, get its token, and sanity-check the token without printing it.
# Does not "fix" JWT characters. Unusable token → exit 1.
#
#   check-cockpit-token.sh [--tenant <alias>] [--gate md-token|cockpit-token] [--probe URL]
#
# --gate: the AUTH value from detect-ui-auth.sh. md-token (Management Dashboard local-qa) requires
# an employee-token profile; a client-credentials profile stops before any token is minted, with
# the profile to add.
#
# Credentials come only from ~/.emporix/tenants.json (emporix-setup/scripts/emporix-env.sh).
# client-credentials profiles: the token is minted per run from clientId/clientSecret.
# employee-token profiles (Management Dashboard local-qa): the token is read from the profile's
# token file and must be an unexpired JWT of an employee of the profile's tenant (checked with
# GET auth-adapter/users/me/tenants); a stale token is a hard stop — refresh it from a dashboard
# sign-in (tenants.sh set-token <alias>). No environment variables, no .env files.
#
# Prints (never the token):
#   PROFILE=acme  TENANT=acme  API_URL=https://api.emporix.io  AUTH=client-credentials|employee-token
#   TOKEN_EXPIRES=2026-11-16T15:04:05Z   (employee-token only)
#   TOKEN_LEN=3488
#   TOKEN_PAYLOAD=valid_json|opaque|invalid_json|not_jwt   (valid_json passes; opaque only for client-credentials)
#   CONTROL_CHARS=0|1
#   PROBE_HTTP=200|401|…   (only with --probe; 401/403 → exit 1)

set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd)
ENV_SH="${EMPORIX_SKILLS_ROOT:-$here/../..}/emporix-setup/scripts/emporix-env.sh"
[ -f "$ENV_SH" ] || { echo "Missing $ENV_SH — install or update the emporix-setup skill." >&2; exit 1; }
# shellcheck disable=SC1090
. "$ENV_SH"

PROBE="" GATE=""
while [ $# -gt 0 ]; do
  case "$1" in
    --tenant) EMPORIX_PROFILE="${2:-}"; shift 2 ;;
    --probe) PROBE="${2:-}"; shift 2 ;;
    --gate) GATE="${2:-}"; shift 2 ;;
    -h|--help) sed -n '2,24p' "$0"; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; exit 2 ;;
  esac
done

case "$GATE" in
  ""|cockpit-token|none) ;;
  md-token)
    # Check the kind before minting: MD local-qa cannot open with an API-client token.
    if [ -f "$EMPORIX_TENANTS_FILE" ] && _emporix_load_profile "${EMPORIX_PROFILE:-}" 2>/dev/null \
       && [ "$EMPORIX_AUTH_KIND" != "employee-token" ]; then
      echo "Profile '$EMPORIX_PROFILE' is a $EMPORIX_AUTH_KIND profile; it cannot open the Management Dashboard local-qa gate." >&2
      emporix_employee_profile_hint "$EMPORIX_PROFILE-admin" "$EMPORIX_TENANT" "${EMPORIX_API_URL:-}" >&2
      echo "(Or name an existing employee-token alias from tenants.sh list.)" >&2
      exit 1
    fi ;;
  *) echo "Unknown --gate $GATE (md-token, cockpit-token)." >&2; exit 2 ;;
esac

emporix_require_env || {
  echo "Could not resolve tenant credentials. Run: tenants.sh list — then pass --tenant <alias>, or fix the profile (tenants.sh open)." >&2
  exit 1
}
echo "PROFILE=$EMPORIX_PROFILE TENANT=$EMPORIX_TENANT API_URL=$EMPORIX_API_URL AUTH=$EMPORIX_AUTH_KIND"
[ -z "${EMPORIX_TOKEN_EXPIRES:-}" ] || echo "TOKEN_EXPIRES=$EMPORIX_TOKEN_EXPIRES"

emporix_token_check || {
  if [ "$EMPORIX_AUTH_KIND" = "employee-token" ]; then
    echo "The employee token of profile '$EMPORIX_PROFILE' is not a usable JWT (invalid payload JSON or control characters). Refresh it from a dashboard sign-in: pbpaste | tenants.sh set-token $EMPORIX_PROFILE. Do not edit the token." >&2
  else
    echo "The minted token is not a usable access token (a JWT with invalid payload JSON, control characters, or neither a JWT nor an opaque token)." >&2
    echo "Check apiUrl / clientId / clientSecret of profile '$EMPORIX_PROFILE' (tenants.sh open). Do not edit the token." >&2
  fi
  exit 1
}

if [ -n "$PROBE" ]; then
  status=$(curl -sS -o /dev/null -w '%{http_code}' "$PROBE" \
    -H "Authorization: Bearer $EMPORIX_TOKEN" -H "X-Tenant: $EMPORIX_TENANT" -H 'Accept: */*' || echo 000)
  echo "PROBE_HTTP=$status"
  case "$status" in
    401|403)
      if [ "$EMPORIX_AUTH_KIND" = "employee-token" ]; then
        echo "Probe $status. Do not drive the UI with this token. The employee lacks the permissions for that endpoint in tenant $EMPORIX_TENANT — extend the employee's roles (or use a profile whose employee has them)." >&2
      else
        echo "Probe $status. Do not drive the UI with this token. It carries only the scopes of the profile's API client — grant the missing scopes to that API client (or use a profile whose client has them)." >&2
      fi
      exit 1 ;;
  esac
fi
