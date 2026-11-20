/* The game has moved to https://awright22.github.io/mars/. This worker replaces the old one at this address: it
 * clears the old game's offline copy and retires itself, so that the address serves only the page that points to
 * the new one. (The new game's own offline copy, named mg-, is left alone.) */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k.startsWith('stranded')).map((k) => caches.delete(k))))
    .then(() => self.registration.unregister())
    .then(() => self.clients.matchAll({ type: 'window' }))
    .then((clients) => clients.forEach((c) => c.navigate(c.url))));
});
