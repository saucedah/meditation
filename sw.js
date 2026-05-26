const SHELL_CACHE = 'meditate-shell-v6';
const AUDIO_CACHE = 'meditate-audio-v2';
const SHELL_ASSETS = ['./', './index.html', './manifest.json', './icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL_CACHE).then(c => c.addAll(SHELL_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== SHELL_CACHE && k !== AUDIO_CACHE)
          .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Audio: serve from offline cache if present, else go to network (no auto-cache here — page handles that with progress)
  if (url.endsWith('.mp3')) {
    e.respondWith(
      caches.open(AUDIO_CACHE).then(c =>
        c.match(e.request).then(cached => cached || fetch(e.request))
      )
    );
    return;
  }

  // App shell: cache-first
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
