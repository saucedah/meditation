# Meditation — info

Single-file PWA (solfeggio + chakra healing + Wim Hof breathing), iPhone-targeted, real MP3 audio.

**Live:** https://meditation-9fz.pages.dev (Cloudflare Pages project `meditation`).
**Deploy / redeploy:** `./deploy.sh` (builds a Pages-safe dist and uploads).

**Audio hosting — two tiers:**
- **Small tracks (≤25 MiB)** ship with the Pages site under `audio/`. `deploy.sh` bundles only the referenced files. Cloudflare Pages does NOT serve HTTP byte ranges (returns 200, never 206), and iOS Safari needs 206 to play — so `sw.js` (the service worker) **synthesizes 206 Partial Content** for these (fetch-whole-file-once, cache, slice).
- **Large tracks (>25 MiB)** live in the **R2 bucket `meditation-audio`**, served by a Worker at **https://meditation-audio.saucedah.workers.dev/** (`r2-worker/`, deploy with `r2-worker/deploy.sh`). The Worker supports native byte ranges (206) + CORS. These are kept at FULL source bitrate (no re-encoding). In `index.html` they use `R2_AUDIO + '<name>.mp3'`. The 7 R2 files: angels, oneness, positive-energy, ra-7-camara-corazon, sanacion-vidas-pasadas, third-eye, trampolin. (2026-06-07: moved off Pages to restore quality — trampolin went 16 kbps → 64 kbps.)
  - Re-upload an R2 file: `npx wrangler r2 object put meditation-audio/<name>.mp3 --file audio/<name>.mp3 --content-type audio/mpeg --remote` (the **`--remote`** flag is mandatory — without it wrangler writes to a LOCAL sim and the cloud bucket stays empty).
- `audio/` also holds large raw class recordings (1–2 GB `.mp4`) the app does NOT reference.

**Source quality note:** the source MP3s are themselves only 64 kbps — that's the ceiling; R2 restores them to that, can't exceed it.

**Cloudflare token:** `~/.cloudflare-token` (see credentials index). R2 enabled on the account 2026-06-07.
