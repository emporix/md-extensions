#!/usr/bin/env sh
# Copy a Postman environment template and fill tenant / API URL / client credentials.
# Never prints secret values. Never overwrites the template.
#
# Usage:
#   prepare-env.sh --template <env.json> --out <generated.json> [--tenant <alias>]
#
# --tenant <alias>: take tenant, api-url, client_id, client_secret and the storefront pair from that
# profile in ~/.emporix/tenants.json (emporix-setup; keychain: references are resolved, so macOS may
# ask to allow the read). An env variable below that is set still wins for its key (the skill's CLI
# flags arrive that way); unset leftovers before calling.
#
# Without --tenant, required env (first wins):
#   EMPORIX_QA_API_URL | API_URL
#   EMPORIX_QA_TENANT | TENANT
#   EMPORIX_QA_CLIENT_ID | CLIENT_ID
#   EMPORIX_QA_CLIENT_SECRET | CLIENT_SECRET
# Optional storefront (required when the template already has those keys):
#   EMPORIX_QA_CLIENT_ID_STOREFRONT | CLIENT_ID_STOREFRONT
#   EMPORIX_QA_CLIENT_SECRET_STOREFRONT | CLIENT_SECRET_STOREFRONT | CLIENT_ID_SECRET

set -eu

TEMPLATE=""
OUT=""
PROFILE=""

while [ $# -gt 0 ]; do
  case "$1" in
    --template)
      TEMPLATE="${2:-}"
      shift 2
      ;;
    --out)
      OUT="${2:-}"
      shift 2
      ;;
    --tenant)
      PROFILE="${2:-}"
      shift 2
      ;;
    -h|--help)
      echo "Usage: prepare-env.sh --template <env.json> --out <generated.json> [--tenant <alias>]" >&2
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 2
      ;;
  esac
done

die() {
  echo "$1" >&2
  exit 1
}

[ -n "$TEMPLATE" ] || die "Missing --template"
[ -n "$OUT" ] || die "Missing --out"
[ -f "$TEMPLATE" ] || die "Template not found: $TEMPLATE"
[ "$TEMPLATE" != "$OUT" ] || die "Refusing to overwrite the template; pass a different --out"

if command -v python3 >/dev/null 2>&1; then
  PY=python3
elif command -v python >/dev/null 2>&1; then
  PY=python
else
  die "python3 is required to write the environment file"
fi

OUT_DIR=$(dirname "$OUT")
mkdir -p "$OUT_DIR"

if [ -n "$PROFILE" ]; then
  here=$(cd "$(dirname "$0")" && pwd)
  ENV_SH="${EMPORIX_SKILLS_ROOT:-$here/../..}/emporix-setup/scripts/emporix-env.sh"
  [ -f "$ENV_SH" ] || die "emporix-setup is not installed next to this skill ($ENV_SH); it reads the tenant profiles."
  # The profile values reach Python through its environment, never through arguments.
  exec env EMPORIX_PROFILE="$PROFILE" ENV_SH="$ENV_SH" PY="$PY" bash -c '
    . "$ENV_SH" || exit 1
    emporix_load_api_clients || exit 1
    PROFILE_TENANT=$EMPORIX_TENANT PROFILE_API_URL=$EMPORIX_API_URL \
    PROFILE_CLIENT_ID=$EMPORIX_CLIENT_ID PROFILE_CLIENT_SECRET=$EMPORIX_CLIENT_SECRET \
    PROFILE_CLIENT_ID_STOREFRONT=$EMPORIX_STOREFRONT_CLIENT_ID \
    PROFILE_CLIENT_SECRET_STOREFRONT=$EMPORIX_STOREFRONT_CLIENT_SECRET \
    PREPARE_ENV_REENTRY=1 exec sh "$0" "$@"' "$0" --template "$TEMPLATE" --out "$OUT"
fi

"$PY" - "$TEMPLATE" "$OUT" <<'PY'
import json
import os
import sys

template_path, out_path = sys.argv[1], sys.argv[2]


def first_of(*names):
    for name in names:
        if name.startswith("PROFILE_") and os.environ.get("PREPARE_ENV_REENTRY") != "1":
            continue
        value = os.environ.get(name)
        if value:
            return value
    return ""


# Explicit env (the skill's CLI flags, or the legacy EMPORIX_QA_* / plain names) wins; a --tenant
# profile fills whatever is left (PROFILE_* set by the --tenant re-entry above).
mapping = {
    "api-url": first_of("EMPORIX_QA_API_URL", "API_URL", "PROFILE_API_URL"),
    "tenant": first_of("EMPORIX_QA_TENANT", "TENANT", "PROFILE_TENANT"),
    "client_id": first_of("EMPORIX_QA_CLIENT_ID", "CLIENT_ID", "PROFILE_CLIENT_ID"),
    "client_secret": first_of("EMPORIX_QA_CLIENT_SECRET", "CLIENT_SECRET", "PROFILE_CLIENT_SECRET"),
    "client_id_storefront": first_of(
        "EMPORIX_QA_CLIENT_ID_STOREFRONT", "CLIENT_ID_STOREFRONT", "PROFILE_CLIENT_ID_STOREFRONT"
    ),
    "client_secret_storefront": first_of(
        "EMPORIX_QA_CLIENT_SECRET_STOREFRONT",
        "CLIENT_SECRET_STOREFRONT",
        "CLIENT_ID_SECRET",
        "PROFILE_CLIENT_SECRET_STOREFRONT",
    ),
}

required = ("api-url", "tenant", "client_id", "client_secret")
missing = [key for key in required if not mapping[key]]
if missing:
    sys.stderr.write("Missing required env: " + ", ".join(missing) + "\n")
    sys.exit(1)

with open(template_path, encoding="utf-8") as fh:
    data = json.load(fh)

values = data.get("values")
if not isinstance(values, list):
    sys.stderr.write("Template has no values[] array\n")
    sys.exit(1)

keys_in_template = {
    item.get("key") for item in values if isinstance(item, dict)
}
storefront_keys = [
    key
    for key in ("client_id_storefront", "client_secret_storefront")
    if key in keys_in_template
]
missing_storefront = [key for key in storefront_keys if not mapping.get(key)]
if missing_storefront:
    sys.stderr.write(
        "Template requires storefront credentials but they are empty: "
        + ", ".join(missing_storefront)
        + "\n"
    )
    sys.exit(1)

set_keys = []
for item in values:
    if not isinstance(item, dict):
        continue
    key = item.get("key")
    if key in mapping and mapping[key]:
        item["value"] = mapping[key]
        item["enabled"] = True
        set_keys.append(key)

defaults = {"grant_type": "client_credentials", "oauth": "oauth"}
existing = {item.get("key") for item in values if isinstance(item, dict)}
for key, value in defaults.items():
    if key not in existing:
        values.append({"key": key, "value": value, "enabled": True})
        set_keys.append(key)

data["values"] = values
name = data.get("name") or "generated"
if not str(name).endswith("(local)"):
    data["name"] = f"{name} (local)"

with open(out_path, "w", encoding="utf-8") as fh:
    json.dump(data, fh, indent=4)
    fh.write("\n")

print("ENV_FILE=" + os.path.abspath(out_path))
print("ENV_KEYS_SET=" + ",".join(set_keys))
PY
