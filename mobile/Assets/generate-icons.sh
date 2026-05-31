#!/bin/bash
# Generates AppIcon.png at all required iOS sizes from AppIcon.svg
# Requires: brew install librsvg

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SVG="$SCRIPT_DIR/AppIcon.svg"
OUT="$SCRIPT_DIR/../OffersPlus/Assets.xcassets/AppIcon.appiconset"

if ! command -v rsvg-convert &>/dev/null; then
  echo "rsvg-convert not found. Install with: brew install librsvg"
  exit 1
fi

sizes=(20 29 40 58 60 76 80 87 120 152 167 180 1024)

for size in "${sizes[@]}"; do
  rsvg-convert -w "$size" -h "$size" "$SVG" -o "$OUT/AppIcon-${size}.png"
  echo "  ✓ ${size}x${size}"
done

echo "Done. Icons written to $OUT"
