// BENETEC Werkregistratie — Service Worker
// Zorgt voor offline werking en snelle laadtijd

const CACHE_NAAM = 'benetec-v1';
const BESTANDEN = [
  './',
  './index.html',
  'https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Barlow+Condensed:wght@300;600;800&display=swap'
];

// Installatie: cache alle bestanden
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAAM).then((cache) => {
      console.log('BENETEC SW: bestanden gecached');
      return cache.addAll(BESTANDEN);
    })
  );
  self.skipWaiting();
});

// Activatie: verwijder oude caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAAM).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch: serveer uit cache, val terug op netwerk
self.addEventListener('fetch', (event) => {
  // API calls (Google Sheets) altijd via netwerk
  if (event.request.url.includes('script.google.com') ||
      event.request.url.includes('nominatim.openstreetmap.org')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        // Cache nieuwe bestanden dynamisch
        if (response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_NAAM).then(cache => cache.put(event.request, copy));
        }
        return response;
      }).catch(() => {
        // Offline fallback
        return caches.match('./index.html');
      });
    })
  );
});
