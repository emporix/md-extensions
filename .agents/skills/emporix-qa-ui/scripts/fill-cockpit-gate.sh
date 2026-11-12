#!/usr/bin/env bash
# Fill Tenant / Token / Language on the cockpit or Management Dashboard local-qa gate from a
# tenant profile. The JWT never appears on the agent's command line — this script resolves it.
#
#   fill-cockpit-gate.sh --browser BIN --session ID \
#     --tenant-ref REF --token-ref REF [--language-ref REF] [--save-ref REF] \
#     [--tenant <alias>] [--language en]
#
# Credentials come only from ~/.emporix/tenants.json (emporix-setup/scripts/emporix-env.sh);
# --tenant picks the profile alias (else the file's default / only profile). The file holds no
# token: it is minted per run from the profile's clientId/clientSecret. Language: --language,
# else the profile's `language`, else en. Never adds Bearer (the client already prefixes it).
# Never prints the token.

set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd)
ENV_SH="${EMPORIX_SKILLS_ROOT:-$here/../..}/emporix-setup/scripts/emporix-env.sh"
[ -f "$ENV_SH" ] || { echo "Missing $ENV_SH — install or update the emporix-setup skill." >&2; exit 1; }
# shellcheck disable=SC1090
. "$ENV_SH"

BROWSER="" SESSION="" TENANT_REF="" TOKEN_REF="" LANG_REF="" SAVE_REF="" LANGUAGE=""
while [ $# -gt 0 ]; do
  case "$1" in
    --browser) BROWSER="${2:-}"; shift 2 ;;
    --session) SESSION="${2:-}"; shift 2 ;;
    --tenant-ref) TENANT_REF="${2:-}"; shift 2 ;;
    --token-ref) TOKEN_REF="${2:-}"; shift 2 ;;
    --language-ref) LANG_REF="${2:-}"; shift 2 ;;
    --save-ref) SAVE_REF="${2:-}"; shift 2 ;;
    --tenant) EMPORIX_PROFILE="${2:-}"; shift 2 ;;
    --language) LANGUAGE="${2:-}"; shift 2 ;;
    -h|--help) sed -n '2,13p' "$0"; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; exit 2 ;;
  esac
done

die() { echo "$1" >&2; exit 1; }
[ -n "$BROWSER" ] || die "Missing --browser"
[ -n "$SESSION" ] || die "Missing --session"
[ -n "$TENANT_REF" ] || die "Missing --tenant-ref"
[ -n "$TOKEN_REF" ] || die "Missing --token-ref"

emporix_require_env || die "Could not resolve tenant credentials. Run tenants.sh list and pass --tenant <alias>, or fix the profile."
[ -n "$LANGUAGE" ] || LANGUAGE="${EMPORIX_LANGUAGE:-en}"

# Refuse a malformed token; never rewrite it.
emporix_token_check >/dev/null || die "The token minted for profile '$EMPORIX_PROFILE' is not a usable JWT — check apiUrl / clientId / clientSecret."

"$BROWSER" --session "$SESSION" fill "$TENANT_REF" "$EMPORIX_TENANT" --json
"$BROWSER" --session "$SESSION" fill "$TOKEN_REF" "$EMPORIX_TOKEN" --json
if [ -n "$LANG_REF" ]; then
  "$BROWSER" --session "$SESSION" fill "$LANG_REF" "$LANGUAGE" --json
fi
if [ -n "$SAVE_REF" ]; then
  "$BROWSER" --session "$SESSION" click "$SAVE_REF" --json
fi

echo "filled tenant + token refs from profile $EMPORIX_PROFILE (token minted, not logged)"
