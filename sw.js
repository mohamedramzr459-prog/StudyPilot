/* StudyPilot service worker */
const VERSION = 'sp-v2.0.0';
const BASE = self.registration.scope;
const CORE = ['./','./index.html','./style.css','./app.js','./manifest.json','./icon.svg','./icon-192.png','./icon-512.png'];
const OFFLINE = './index.html';

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    await Promise.all(CORE.map(u => c.add(new Request(new URL(u, BASE), {cache:'reload'})).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.protocol !== 'https:' && url.origin !== location.origin) return;

  // navigation -> network first, cached shell fallback
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const c = await caches.open(VERSION);
        c.put(new URL(OFFLINE, BASE), fresh.clone()).catch(() => {});
        return fresh;
      } catch {
        const c = await caches.open(VERSION);
        return (await c.match(new URL(OFFLINE, BASE))) || (await c.match(new URL('./', BASE))) || Response.error();
      }
    })());
    return;
  }

  const sameOrigin = url.origin === location.origin;

  // audio / remote json -> network first, then cache
  if (!sameOrigin) {
    const cacheable = /\.(mp3|json)$/i.test(url.pathname) || /alquran\.cloud|islamic\.network|wikipedia\.org/.test(url.host);
    if (!cacheable) return;
    e.respondWith((async () => {
      const c = await caches.open(VERSION);
      try {
        const fresh = await fetch(req);
        if (fresh.ok && fresh.type !== 'opaque') c.put(req, fresh.clone()).catch(() => {});
        return fresh;
      } catch {
        return (await c.match(req)) || Response.error();
      }
    })());
    return;
  }

  // same-origin static -> cache first, refresh in background
  e.respondWith((async () => {
    const c = await caches.open(VERSION);
    const hit = await c.match(req);
    if (hit) {
      fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); }).catch(() => {});
      return hit;
    }
    try {
      const fresh = await fetch(req);
      if (fresh.ok) c.put(req, fresh.clone()).catch(() => {});
      return fresh;
    } catch {
      return Response.error();
    }
  })());
});
