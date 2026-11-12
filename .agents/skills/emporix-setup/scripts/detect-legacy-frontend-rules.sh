#!/usr/bin/env sh
# List what a frontend-ai-rules install left in a product repo. Prints nothing
# when there is no old install. Used by emporix-setup (references/frontend-rules.md).
#   REMOVE <path>     identical to a frontend-ai-rules release; safe to delete
#   KEEP <path>       at an old install path but changed; never delete
#   PKG dependency    package.json lists frontend-ai-rules
#   PKG postinstall   package.json postinstall runs the old sync
#
#   sh detect-legacy-frontend-rules.sh [repo-dir]
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
MANIFEST="${EMPORIX_LEGACY_MANIFEST:-$ROOT/references/legacy-frontend-ai-rules.sha256}"
REPO="${1:-.}"
[ -f "$MANIFEST" ] || { echo "detect-legacy-frontend-rules.sh: missing $MANIFEST" >&2; exit 1; }

sha() { if command -v sha256sum >/dev/null 2>&1; then sha256sum "$1"; else shasum -a 256 "$1"; fi | cut -d' ' -f1; }

awk '{ print $2 }' "$MANIFEST" | LC_ALL=C sort -u | while read -r p; do
  [ -f "$REPO/$p" ] || continue
  h=$(sha "$REPO/$p")
  if awk -v h="$h" -v p="$p" '$1 == h && $2 == p { f = 1 } END { exit !f }' "$MANIFEST"; then
    echo "REMOVE $p"
  else
    echo "KEEP $p"
  fi
done

PKG="$REPO/package.json"
if [ -f "$PKG" ]; then
  if grep -Eq '"frontend-ai-rules"[[:space:]]*:' "$PKG"; then echo "PKG dependency"; fi
  if grep -Eq '"postinstall"[[:space:]]*:[[:space:]]*"([^"\\]|\\.)*frontend-ai-rules' "$PKG"; then echo "PKG postinstall"; fi
fi
exit 0
