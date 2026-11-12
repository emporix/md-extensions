#!/usr/bin/env sh
# Copy a Postman environment template and fill tenant / API URL / client credentials.
# Never prints secret values. Never overwrites the template.
#
# Usage:
#   prepare-env.sh --template <env.json> --out <generated.json>
#
# Required env (first wins):
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
    -h|--help)
      echo "Usage: prepare-env.sh --template <env.json> --out <generated.json>" >&2
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

"$PY" - "$TEMPLATE" "$OUT" <<'PY'
import json
import os
import sys

template_path, out_path = sys.argv[1], sys.argv[2]


def first_of(*names):
    for name in names:
        value = os.environ.get(name)
        if value:
            return value
    return ""


mapping = {
    "api-url": first_of("EMPORIX_QA_API_URL", "API_URL"),
    "tenant": first_of("EMPORIX_QA_TENANT", "TENANT"),
    "client_id": first_of("EMPORIX_QA_CLIENT_ID", "CLIENT_ID"),
    "client_secret": first_of("EMPORIX_QA_CLIENT_SECRET", "CLIENT_SECRET"),
    "client_id_storefront": first_of(
        "EMPORIX_QA_CLIENT_ID_STOREFRONT", "CLIENT_ID_STOREFRONT"
    ),
    "client_secret_storefront": first_of(
        "EMPORIX_QA_CLIENT_SECRET_STOREFRONT",
        "CLIENT_SECRET_STOREFRONT",
        "CLIENT_ID_SECRET",
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
