// Serves the Meditation app's large audio files from the `meditation-audio` R2
// bucket with proper HTTP byte-range support (206) — which Cloudflare Pages does
// NOT provide, and which iOS Safari requires to play audio. Read-only, GET/HEAD.

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'range, content-type',
  'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges, ETag',
  'Access-Control-Max-Age': '86400',
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method Not Allowed', { status: 405, headers: CORS });
    }

    const url = new URL(request.url);
    const key = decodeURIComponent(url.pathname.replace(/^\/+/, ''));
    if (!key) return new Response('Not found', { status: 404, headers: CORS });

    const object = await env.BUCKET.get(key, {
      range: request.headers,
      onlyIf: request.headers,
    });
    if (!object) return new Response('Not found', { status: 404, headers: CORS });

    const headers = new Headers(CORS);
    object.writeHttpMetadata(headers);
    headers.set('ETag', object.httpEtag);
    headers.set('Accept-Ranges', 'bytes');
    if (!headers.has('Content-Type')) headers.set('Content-Type', 'audio/mpeg');
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');

    const hasRange = request.headers.get('range') !== null;

    if (object.range && hasRange) {
      const offset = object.range.offset ?? 0;
      const length = object.range.length ?? object.size - offset;
      const end = offset + length - 1;
      headers.set('Content-Range', `bytes ${offset}-${end}/${object.size}`);
      headers.set('Content-Length', String(length));
      const body = request.method === 'HEAD' ? null : object.body;
      return new Response(body, { status: 206, headers });
    }

    // No range (or conditional miss) → full object.
    if (!object.body) return new Response(null, { status: 304, headers });
    headers.set('Content-Length', String(object.size));
    const body = request.method === 'HEAD' ? null : object.body;
    return new Response(body, { status: 200, headers });
  },
};
