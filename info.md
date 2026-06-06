# Meditation — info

Single-file PWA (solfeggio + chakra healing + Wim Hof breathing), iPhone-targeted, real MP3 audio.

**Live:** https://meditation-9fz.pages.dev (Cloudflare Pages project `meditation`).
**Deploy / redeploy:** `./deploy.sh` (builds a Pages-safe dist and uploads).

**Audio note:** `audio/` also holds large raw class recordings (1–2 GB each) the app does NOT reference. The app uses ~26 MP3s (~455 MB raw). Cloudflare Pages caps files at **25 MiB**, so `deploy.sh` includes only the referenced files and re-encodes the 7 that exceed the cap (originals untouched). A few long ambient tracks land at lower bitrate (e.g. the ~3 h `trampolin.mp3` → 22 kHz/16 kbps mono). For full quality on those, move them to Cloudflare R2 later and point the app's audio URLs there.

**Cloudflare token:** `~/.cloudflare-token` (see credentials index).
