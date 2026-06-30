#!/usr/bin/env bash
# Build a Cloudflare Pages dist and deploy the Meditation PWA.
#
# Why this exists: the repo's audio/ folder also holds multi-GB raw class
# recordings the app does NOT use. Cloudflare Pages caps files at 25 MiB, so we
# (a) include ONLY the audio referenced by index.html, and (b) re-encode any
# referenced file over 25 MiB to fit. Originals are never modified.
set -euo pipefail
cd "$(dirname "$0")"
DIST="${DIST:-/tmp/meditation-dist}"
LIMIT=26214400   # 25 MiB

# Bust the PWA cache: stamp the shell cache name with the current epoch so the
# browser detects a new service worker, re-installs, and re-fetches index.html.
# Without this, sw.js never changes and the old cached page is served forever.
STAMP=$(date +%s)
sed -i -E "s/(SHELL_CACHE = 'meditate-shell-)[^']*/\1${STAMP}/" sw.js
echo "shell cache version -> meditate-shell-${STAMP}"

rm -rf "$DIST"; mkdir -p "$DIST/audio"
cp index.html manifest.json sw.js icon.svg oracion-registros-akashicos.pdf "$DIST/"
# Security headers (CSP scoped to fonts + R2 audio worker) + defensive assets ignore.
cp _headers .assetsignore "$DIST/"
# Document/screenshot images referenced by gallery cards.
[ -d images ] && cp -r images "$DIST/"

grep -oE 'audio/[^"'"'"' )]+\.mp3' index.html | sort -u | while read -r f; do
  base=$(basename "$f"); [ -f "$f" ] || { echo "MISSING $f"; continue; }
  sz=$(stat -c%s "$f")
  if [ "$sz" -le "$LIMIT" ]; then cp "$f" "$DIST/audio/$base"; continue; fi
  dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f" | cut -d. -f1); [ -z "$dur" ] && dur=1800
  kbps=$(( 22*1024*8 / (dur>0?dur:1800) )); [ "$kbps" -gt 128 ] && kbps=128
  if [ "$kbps" -ge 32 ]; then           # MP3 @ 44.1kHz can't go below 32k; keep stereo
    ffmpeg -y -i "$f" -b:a ${kbps}k -map_metadata -1 "$DIST/audio/$base" </dev/null >/dev/null 2>&1
  else                                   # very long file: mono + lower sample rate to allow a low bitrate
    [ "$kbps" -lt 16 ] && kbps=16
    ffmpeg -y -i "$f" -ar 22050 -ac 1 -b:a ${kbps}k -map_metadata -1 "$DIST/audio/$base" </dev/null >/dev/null 2>&1
  fi
  printf "re-encoded %-32s @ %sk -> %.1f MiB\n" "$base" "$kbps" "$(stat -c%s "$DIST/audio/$base"|awk '{print $1/1048576}')"
done

big=$(find "$DIST/audio" -type f -size +${LIMIT}c || true)
[ -n "$big" ] && { echo "ERROR: still over 25 MiB:"; echo "$big"; exit 1; }

export CLOUDFLARE_API_TOKEN=$(cat ~/.cloudflare-token)
npx wrangler pages deploy "$DIST" --project-name meditation --branch main --commit-dirty=true
