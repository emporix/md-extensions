#!/usr/bin/env bash
# Off-camera helper: write MD + cockpit local-qa keys from a tenant profile
# (~/.emporix/tenants.json) via eval --stdin (JWT never on the agent command line).
#
# Keys: localStorage.accessToken (Management Dashboard), localStorage.token
# (cockpit templates), tenant, uiLanguage.
#
# Do **not** run this after `record start`. agent-browser 0.38.2 records the
# current tab; restore + reload was a v0.34 workaround that dropped the
# encoder. If the gate appears on camera, stop — the CLI pin is wrong.
#
#   restore-local-qa-session.sh --browser BIN --session ID [--tenant <alias>] [--language en]
#
# Never prints the token. Temp JS is chmod 600 and deleted.

set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd)
ENV_SH="${EMPORIX_SKILLS_ROOT:-$here/../..}/emporix-setup/scripts/emporix-env.sh"
[ -f "$ENV_SH" ] || { echo "Missing $ENV_SH — install or update the emporix-setup skill." >&2; exit 1; }
# shellcheck disable=SC1090
. "$ENV_SH"

BROWSER="" SESSION="" LANGUAGE=""
while [ $# -gt 0 ]; do
  case "$1" in
    --browser) BROWSER="${2:-}"; shift 2 ;;
    --session) SESSION="${2:-}"; shift 2 ;;
    --tenant) EMPORIX_PROFILE="${2:-}"; shift 2 ;;
    --language) LANGUAGE="${2:-}"; shift 2 ;;
    -h|--help) sed -n '2,13p' "$0"; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; exit 2 ;;
  esac
done

[ -n "$BROWSER" ] || { echo "Missing --browser" >&2; exit 1; }
[ -n "$SESSION" ] || { echo "Missing --session" >&2; exit 1; }

emporix_require_env || { echo "Could not resolve tenant credentials. Run tenants.sh list and pass --tenant <alias>." >&2; exit 1; }
emporix_token_check >/dev/null || { echo "The token minted for profile '$EMPORIX_PROFILE' is not a usable JWT — check apiUrl / clientId / clientSecret." >&2; exit 1; }
[ -n "$LANGUAGE" ] || LANGUAGE="${EMPORIX_LANGUAGE:-en}"

TMP=$(mktemp "${TMPDIR:-/tmp}/emporix-demo-restore.XXXXXX")
chmod 600 "$TMP"
cleanup() { rm -f "$TMP"; }
trap cleanup EXIT INT TERM

TENANT="$EMPORIX_TENANT" TOKEN="$EMPORIX_TOKEN" LANGUAGE="$LANGUAGE" TMP="$TMP" python3 - <<'PY'
import json, os, pathlib
token = os.environ["TOKEN"]
tenant = os.environ["TENANT"]
language = os.environ.get("LANGUAGE", "en").strip() or "en"
pathlib.Path(os.environ["TMP"]).write_text(
    "try {"
    f"localStorage.setItem('accessToken', {json.dumps(token)});"
    f"localStorage.setItem('token', {json.dumps(token)});"
    f"localStorage.setItem('tenant', {json.dumps(tenant)});"
    f"localStorage.setItem('uiLanguage', {json.dumps(language)});"
    "} catch (e) {}"
)
PY

"$BROWSER" --session "$SESSION" eval --stdin --json < "$TMP" >/dev/null
echo "restored localStorage session from profile $EMPORIX_PROFILE (token not logged)"
