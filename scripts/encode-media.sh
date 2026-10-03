#!/usr/bin/env bash
# Re-encodes the hero and product videos from design-source/ into public/media/ (PLAN.md "Media").
# Usage: bash scripts/encode-media.sh            (videos only)
#        HERO_POSTER_T=<seconds> bash scripts/encode-media.sh posters   (posters only)
set -euo pipefail
cd "$(dirname "$0")/.."

SRC=design-source/drive
OUT=public/media
mkdir -p "$OUT/skins"

TAGS=(-colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv)
COMMON=(-an -c:v libx264 -preset slow -pix_fmt yuv420p -movflags +faststart)
CM="in_color_matrix=bt709:out_color_matrix=bt709"
SP="setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709:range=tv"

encode_videos() {
  ffmpeg -y -v error -i "$SRC/headervideo/eXo_main_landscape_3mbps.mp4" "${COMMON[@]}" -crf 24 \
    -vf "scale=1920:-2:$CM:flags=lanczos,$SP" "${TAGS[@]}" "$OUT/hero-1920.mp4" &
  ffmpeg -y -v error -i "$SRC/headervideo/eXo_main_landscape_3mbps.mp4" "${COMMON[@]}" -crf 24 \
    -vf "scale=1280:-2:$CM:flags=lanczos,$SP" "${TAGS[@]}" "$OUT/hero-1280.mp4" &
  ffmpeg -y -v error -i "$SRC/Skins/0001.mp4" "${COMMON[@]}" -crf 26 \
    -vf "scale=1274:-2:$CM:flags=lanczos,$SP" "${TAGS[@]}" "$OUT/skins/0001.mp4" &
  ffmpeg -y -v error -i "$SRC/Skins/0002.mp4" "${COMMON[@]}" -crf 26 \
    -vf "scale=iw:ih:$CM,$SP" "${TAGS[@]}" "$OUT/skins/0002.mp4" &
  wait
}

poster() { # $1 input (encoded mp4), $2 time in s, $3 output jpg, $4 width or -1
  ffmpeg -y -v error -ss "$2" -i "$1" -frames:v 1 \
    -vf "scale=$4:-2:in_color_matrix=bt709:in_range=tv:flags=lanczos,format=rgb24,scale=out_color_matrix=bt601:out_range=pc,format=yuvj444p" \
    -q:v 2 "$3"
  # JPEG is decoded as BT.601 full range, so convert video BT.709 limited -> RGB -> BT.601 full.
}

encode_posters() {
  : "${HERO_POSTER_T:?set HERO_POSTER_T (seconds) for the hero poster}"
  : "${SKIN_POSTER_T:=0}"
  poster "$OUT/hero-1920.mp4" "$HERO_POSTER_T" "$OUT/hero-poster.jpg" 1920
  poster "$OUT/skins/0001.mp4" "$SKIN_POSTER_T" "$OUT/skins/0001-poster.jpg" -1
  poster "$OUT/skins/0002.mp4" "$SKIN_POSTER_T" "$OUT/skins/0002-poster.jpg" -1
}

case "${1:-videos}" in
  videos) encode_videos ;;
  posters) encode_posters ;;
  all) encode_videos; encode_posters ;;
  *) echo "usage: $0 [videos|posters|all]" >&2; exit 2 ;;
esac
