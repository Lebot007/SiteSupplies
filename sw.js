// Simple, safe Service Worker for caching static assets.
// Strategy: cache-first for images/CSS/JS, network-first for HTML to ensure freshness.
const CACHE_NAME = 'supplies-static-v1';
const IMAGE_CACHE = 'supplies-images-v1';
const OFFLINE_URL = '/index.html';

const ASSETS_TO_PRECACHE = [
  '/',
  '/index.html',
  '/dist/styles.css',
  '/favicon-s.svg',
  '/favicon.svg'
  // Observação: não pré-cacheamos .webp aqui para evitar falha de instalação caso os arquivos .webp
  // ainda não existam no servidor. Quando os .webp forem gerados e subidos ao servidor, você pode
  // adicionar os caminhos correspondentes a ASSETS_TO_PRECACHE para precaching.
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter(k => k !== CACHE_NAME && k !== IMAGE_CACHE).map(k => caches.delete(k)));
      self.clients.claim();
    })()
  );
});

function isImageRequest(request) {
  // Considera solicitações que o browser marca como image, ou urls com extensões comuns.
  try{
    return request.destination === 'image' || /\.(?:png|jpg|jpeg|gif|webp|svg)(?:\?|$)/i.test(request.url);
  }catch(e){
    return false;
  }
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // Only handle GET
  if (req.method !== 'GET') return;

  // HTML: network-first
  if (req.headers.get('accept') && req.headers.get('accept').includes('text/html')) {
    event.respondWith((async () => {
      try {
        const response = await fetch(req);
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, response.clone());
        return response;
      } catch (err) {
        const cached = await caches.match(req);
        return cached || caches.match(OFFLINE_URL);
      }
    })());
    return;
  }

  // Images and CSS/JS: cache-first
  if (isImageRequest(req) || req.destination === 'style' || req.destination === 'script') {
    event.respondWith((async () => {
      const cache = await caches.open(IMAGE_CACHE);
      const cached = await cache.match(req);
      if (cached) return cached;
      try {
        const response = await fetch(req);
        cache.put(req, response.clone());
        return response;
      } catch (err) {
        return cached || Response.error();
      }
    })());
    return;
  }

  // Default: network fallback to cache
  event.respondWith(fetch(req).catch(() => caches.match(req)));
});
