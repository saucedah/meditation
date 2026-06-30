const SHELL_CACHE = 'meditate-shell-1782785679';
const AUDIO_CACHE = 'meditate-audio-v2';        // explicit offline downloads (UI-tracked)
const STREAM_CACHE = 'meditate-audio-stream';   // transparent buffer for range playback
const SHELL_ASSETS = ['./', './index.html', './manifest.json', './icon.svg',
  './images/akashic-prayer-1.png', './images/akashic-prayer-2.png',
  './images/akashic-prayer-3.png', './images/akashic-prayer-4.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL_CACHE).then(c => c.addAll(SHELL_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== SHELL_CACHE && k !== AUDIO_CACHE && k !== STREAM_CACHE)
          .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  let path;
  try { path = new URL(req.url).pathname; } catch { path = req.url; }

  // Audio: Cloudflare Pages does NOT serve byte ranges (returns 200, not 206),
  // which makes iOS Safari hang on playback ("Cargando audio…" forever). Every
  // audio file is <=25 MiB (the Pages cap), so we fetch the whole file once,
  // cache it, and synthesize the 206 Partial Content responses iOS requires.
  if (req.method === 'GET' && path.endsWith('.mp3')) {
    e.respondWith(handleAudio(req));
    return;
  }

  // App shell: cache-first
  e.respondWith(caches.match(req).then(r => r || fetch(req)));
});

async function getStreamFull(key) {
  // Same-origin (Cloudflare Pages) only: buffer the whole file so we can slice it.
  const stream = await caches.open(STREAM_CACHE);
  let resp = await stream.match(key);
  if (resp) return resp;
  const net = await fetch(key); // no Range header
  if (net && net.ok) {
    try { await stream.put(key, net.clone()); } catch { /* storage full — serve anyway */ }
  }
  return net;
}

async function handleAudio(req) {
  const key = req.url;
  let sameOrigin = false;
  try { sameOrigin = new URL(key).origin === self.location.origin; } catch {}

  // 1. Explicitly downloaded for offline — stored as a full 200; synthesize the
  //    ranges iOS needs (covers both Pages- and R2-hosted files once cached).
  const offline = await caches.open(AUDIO_CACHE);
  const cached = await offline.match(key);
  if (cached) return rangeResponse(cached, req);

  // 2. Cross-origin (R2) and not cached → R2 serves byte ranges natively, so
  //    pass straight through. Never buffer the whole file (trampolin is ~84 MiB).
  if (!sameOrigin) return fetch(req);

  // 3. Same-origin (Pages) → Pages won't serve ranges, so buffer + synthesize.
  let full;
  try {
    full = await getStreamFull(key);
  } catch {
    return fetch(req);
  }
  if (!full || !full.ok) return full || fetch(req);
  return rangeResponse(full, req);
}

async function rangeResponse(full, req) {
  const range = req.headers.get('range');
  if (!range) return full; // no range asked — return the full 200 body

  const buf = await full.arrayBuffer();
  const size = buf.byteLength;
  const m = /bytes=(\d*)-(\d*)/.exec(range);
  let start = m && m[1] ? parseInt(m[1], 10) : 0;
  let end = m && m[2] ? parseInt(m[2], 10) : size - 1;
  if (isNaN(start)) start = 0;
  if (isNaN(end) || end >= size) end = size - 1;

  if (start > end || start >= size) {
    return new Response(null, {
      status: 416,
      headers: { 'Content-Range': `bytes */${size}`, 'Accept-Ranges': 'bytes' },
    });
  }

  const chunk = buf.slice(start, end + 1);
  return new Response(chunk, {
    status: 206,
    statusText: 'Partial Content',
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Range': `bytes ${start}-${end}/${size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': String(chunk.byteLength),
    },
  });
}
