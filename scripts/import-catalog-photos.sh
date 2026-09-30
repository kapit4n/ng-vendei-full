#!/usr/bin/env bash
# Import real product photos for store profiles that ship photography instead of
# generated SVGs (see PHOTO_PROFILES in generate-catalog-images.js).
#
# Each photo is center-cropped to a square, capped at 512px, and re-encoded as
# JPEG, because the POS renders product cards at thumbnail size and the
# originals are multi-megabyte.
#
# Usage: scripts/import-catalog-photos.sh <profile-slug> <source-dir>
#        scripts/import-catalog-photos.sh chicken-store ~/Desktop/chicken
set -euo pipefail

PROFILE_SLUG="${1:?usage: import-catalog-photos.sh <profile-slug> <source-dir>}"
SOURCE_DIR="${2:?usage: import-catalog-photos.sh <profile-slug> <source-dir>}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEST_DIR="$SCRIPT_DIR/../src/assets/vendei/catalog/$PROFILE_SLUG"
MAX_EDGE=512
JPEG_Q=3 # ffmpeg mjpeg scale; ~3 is roughly ImageMagick's -quality 82

[ -d "$SOURCE_DIR" ] || { echo "source dir not found: $SOURCE_DIR" >&2; exit 1; }
command -v ffmpeg >/dev/null || { echo "ffmpeg is required" >&2; exit 1; }
mkdir -p "$DEST_DIR"

# product-slug:source-filename
PAIRS=(
  "whole-chicken:whole-chicken.jpg"
  "grilled-chicken:whole-grilled-chicken.jpg"
  "chicken-breast:chicken-breast.jpg"
  "chicken-wings:chicken-wings.jpg"
  "chicken-thigh:chicken-thighs.jpg"
  "chicken-fillet:chicken-fillet.jpeg"
  "chicken-combo:chichen-combo.png"
  "family-chicken-combo:family-chicken-combo.jpeg"
  "kids-combo:kids-combo.jpeg"
  "french-fries:French-Fries.jpg"
  "coleslaw:coleslaw.jpeg"
  "mashed-potatoes:mashed-potatoes.jpg"
  "spicy-sauce:spicy-sauce.jpeg"
  "bbq-sauce:bbq-sauce.jpg"
  "garlic-sauce:garlic-sauce.jpg"
)

total=0
for pair in "${PAIRS[@]}"; do
  slug="${pair%%:*}"
  file="${pair##*:}"
  src="$SOURCE_DIR/$file"
  dest="$DEST_DIR/$slug.jpg"

  if [ ! -f "$src" ]; then
    echo "  MISSING $slug (expected $file)" >&2
    continue
  fi

  # Center-crop to the largest square available, then cap the long edge so we
  # never upscale a small source into a blurry one.
  ffmpeg -y -hide_banner -loglevel error \
    -i "$src" \
    -vf "crop='min(iw,ih)':'min(iw,ih)',scale='min($MAX_EDGE,iw)':'min($MAX_EDGE,ih)':flags=lanczos" \
    -map_metadata -1 \
    -q:v "$JPEG_Q" \
    -frames:v 1 \
    "$dest"

  dims=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "$dest")
  printf '  %-24s %-28s -> %-12s %8s bytes\n' "$slug" "$file" "$dims" "$(stat -c%s "$dest")"
  total=$((total + $(stat -c%s "$dest")))
done

echo "$PROFILE_SLUG: ${#PAIRS[@]} photos, $(awk -v b="$total" 'BEGIN{printf "%.0f", b/1024}') KB total"
echo "Must be re-run and the DB re-seeded for new paths to take effect."
