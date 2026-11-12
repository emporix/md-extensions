#!/usr/bin/env sh
# Turn QA PNGs into Jira-safe JPEGs (max 1280px, ~65% quality).
# Keeps the originals. Writes sibling .jpg files. Run from anywhere:
#   sh shrink-screenshots.sh /path/to/artifacts_DIR
set -eu

DIR="${1:?Usage: shrink-screenshots.sh <artifacts-dir>}"
[ -d "$DIR" ] || {
  echo "Not a directory: $DIR" >&2
  exit 1
}

shrink_one() {
  src="$1"
  base=$(basename "$src")
  stem=${base%.*}
  out="$DIR/${stem}.jpg"
  if command -v sips >/dev/null 2>&1; then
    sips -s format jpeg -s formatOptions 65 -Z 1280 "$src" --out "$out" >/dev/null
  elif command -v magick >/dev/null 2>&1; then
    magick "$src" -resize "1280x1280>" -quality 65 "$out"
  else
    echo "Need macOS sips or ImageMagick (magick) to shrink $src" >&2
    return 1
  fi
  echo "$out"
}

found=0
for src in "$DIR"/step-*.png "$DIR"/ask-*.png "$DIR"/step-*.jpg "$DIR"/ask-*.jpg; do
  [ -f "$src" ] || continue
  found=1
  shrink_one "$src"
done

if [ "$found" = 0 ]; then
  echo "No step-*.png / ask-*.png in $DIR" >&2
  exit 1
fi
