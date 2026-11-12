#!/bin/sh
# Resolve the product area of a Figma file from its link or file key.
# Usage: resolve-area.sh <figma-url-or-file-key> [local-registry.json]
# Prints key=value lines: area, name, role, rules (path), hash. Matches on a
# truncated sha256 of the file key, so no key or link is stored anywhere.
# Exit 0 when matched, 3 when the area is unknown, 2 on bad input.
set -eu

INPUT=${1:-}
[ -n "$INPUT" ] || { echo "usage: resolve-area.sh <figma-url-or-file-key> [local-registry.json]" >&2; exit 2; }
LOCAL=${2:-}
HERE=$(cd "$(dirname "$0")" && pwd)
SHARED="$HERE/../references/areas/registry.json"
command -v jq >/dev/null 2>&1 || { echo "jq is required" >&2; exit 2; }

# Branch links carry the branch key, which is the file to use.
KEY=$(printf '%s' "$INPUT" | sed -E \
  -e 's#^https?://[^/]+/(design|board|slides|make)/[^/]+/branch/([^/?]+).*#\2#' \
  -e 's#^https?://[^/]+/(design|board|slides|make)/([^/?]+).*#\2#')
case "$KEY" in *[!A-Za-z0-9]*|"") echo "could not read a file key from the input" >&2; exit 2 ;; esac

if command -v shasum >/dev/null 2>&1; then
  HASH=$(printf '%s' "$KEY" | shasum -a 256 | cut -c1-16)
else
  HASH=$(printf '%s' "$KEY" | sha256sum | cut -c1-16)
fi

for REG in "$LOCAL" "$SHARED"; do
  [ -n "$REG" ] && [ -f "$REG" ] || continue
  HIT=$(jq -r --arg h "$HASH" '
    .areas[] as $a | $a.files[]? | select(.hash == $h)
    | [$a.id, $a.name, .role, $a.ruleFile] | @tsv' "$REG" | head -n 1)
  if [ -n "$HIT" ]; then
    ID=$(printf '%s' "$HIT" | cut -f1); NAME=$(printf '%s' "$HIT" | cut -f2)
    ROLE=$(printf '%s' "$HIT" | cut -f3); RULES=$(printf '%s' "$HIT" | cut -f4)
    echo "area=$ID"; echo "name=$NAME"; echo "role=$ROLE"
    echo "rules=$(dirname "$REG")/$RULES"; echo "hash=$HASH"
    exit 0
  fi
done

echo "area=unknown"; echo "hash=$HASH"
exit 3
