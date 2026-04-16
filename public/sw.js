const CACHE_NAME = 'nomad-v7';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Nunito:wght@400;500;600;700;800&display=swap'
];

// Never cache Supabase API responses — always let the app handle offline fallback
const isApiRequest = url => url.includes('supabase.co');

// Install — cache core assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch strategy:
// - Supabase API: always bypass SW (let app's try/catch handle offline)
// - App assets: cache-first, update in background; cache miss → network → cache it
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (isApiRequest(e.request.url)) return; // let Supabase calls go straight to network

  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fetchPromise = fetch(e.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
          }
          return response;
        })
        .catch(() => cached); // offline: serve from cache

      return cached || fetchPromise;
    })
  );
});
