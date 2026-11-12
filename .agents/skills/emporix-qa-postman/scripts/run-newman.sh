#!/usr/bin/env sh
# Run one Postman collection with Newman against a generated environment file.
#
# Usage:
#   run-newman.sh --root <postman-collections> --collection <file> --env <file> \
#     [--folder <name>] [--report <html>]
#
# Must run from a context that can reach api-url (host network).

set -eu

ROOT=""
COLLECTION=""
ENV_FILE=""
FOLDER=""
REPORT=""

while [ $# -gt 0 ]; do
  case "$1" in
    --root)
      ROOT="${2:-}"
      shift 2
      ;;
    --collection)
      COLLECTION="${2:-}"
      shift 2
      ;;
    --env)
      ENV_FILE="${2:-}"
      shift 2
      ;;
    --folder)
      FOLDER="${2:-}"
      shift 2
      ;;
    --report)
      REPORT="${2:-}"
      shift 2
      ;;
    -h|--help)
      echo "Usage: run-newman.sh --root <dir> --collection <file> --env <file> [--folder <name>] [--report <html>]" >&2
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

[ -n "$ROOT" ] || die "Missing --root"
[ -d "$ROOT" ] || die "Postman checkout not found: $ROOT"
case "$ROOT" in
  /*) ;;
  *) ROOT="$(cd "$ROOT" && pwd)" ;;
esac
[ -n "$COLLECTION" ] || die "Missing --collection"
[ -f "$COLLECTION" ] || die "Collection not found: $COLLECTION"
[ -n "$ENV_FILE" ] || die "Missing --env"
[ -f "$ENV_FILE" ] || die "Environment file not found: $ENV_FILE"
[ -f "$ROOT/package.json" ] || die "Not a postman-collections root (no package.json): $ROOT"

NEWMAN="$ROOT/node_modules/newman/bin/newman.js"
if [ ! -f "$NEWMAN" ]; then
  echo "Newman missing in checkout — running npm install" >&2
  (cd "$ROOT" && npm install --omit=dev)
  [ -f "$NEWMAN" ] || die "newman still missing after npm install"
fi

if [ -n "$REPORT" ]; then
  mkdir -p "$(dirname "$REPORT")"
fi

# Absolute paths so cwd can be the Postman root (relative file uploads).
case "$COLLECTION" in
  /*) COLLECTION_ABS="$COLLECTION" ;;
  *) COLLECTION_ABS="$(pwd)/$COLLECTION" ;;
esac
case "$ENV_FILE" in
  /*) ENV_ABS="$ENV_FILE" ;;
  *) ENV_ABS="$(pwd)/$ENV_FILE" ;;
esac
if [ -n "$REPORT" ]; then
  case "$REPORT" in
    /*) REPORT_ABS="$REPORT" ;;
    *) REPORT_ABS="$(pwd)/$REPORT" ;;
  esac
fi

set -- "$NEWMAN" run "$COLLECTION_ABS" -e "$ENV_ABS" --disable-unicode -r cli,htmlextra
if [ -n "$REPORT" ]; then
  set -- "$@" --reporter-htmlextra-export "$REPORT_ABS"
fi
if [ -n "$FOLDER" ]; then
  set -- "$@" --folder "$FOLDER"
fi

echo "NEWMAN_COLLECTION=$COLLECTION_ABS"
echo "NEWMAN_ENV=$ENV_ABS"
if [ -n "$FOLDER" ]; then
  echo "NEWMAN_FOLDER=$FOLDER"
fi
if [ -n "$REPORT" ]; then
  echo "NEWMAN_REPORT=$REPORT_ABS"
fi

cd "$ROOT"
exec node "$@"
