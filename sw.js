/**
 * Service Worker - SuiviPatrimoine (PWA Offline First)
 */
const CACHE_NAME = 'patrimoine-v1.0.0';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Installation : Mise en cache des assets statiques essentiels
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activation : Nettoyage des anciens caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interception des requêtes réseau
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 1. Ignorer les requêtes vers les APIs externes dynamiques (Google Sheets, Open ER API)
  if (url.hostname.includes('script.google.com') || 
      url.hostname.includes('open.er-api.com') ||
      event.request.method !== 'GET') {
    return; // Passer directement au réseau sans mise en cache
  }

  // 2. Pour les polices Google Fonts : Stratégie Stale-While-Revalidate
  if (url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com') {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return cache.match(event.request).then(cachedResponse => {
          const fetchPromise = fetch(event.request).then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => cachedResponse);
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // 3. Pour les fichiers de l'application locale : Stratégie Cache-First avec Network Fallback
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        // En arrière-plan, tenter de mettre à jour le cache (Stale-While-Revalidate)
        fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(event.request).then(networkResponse => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      });
    }).catch(() => {
      // Si hors-ligne et pas en cache, renvoyer l'index
      return caches.match('./index.html');
    })
  );
});
