#!/usr/bin/env bash
# Deploy the meditation-audio R2 Worker (serves large audio with byte-range support).
set -euo pipefail
cd "$(dirname "$0")"
export CLOUDFLARE_API_TOKEN=$(cat ~/.cloudflare-token)
exec npx wrangler deploy
