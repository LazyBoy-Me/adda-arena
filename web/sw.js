/* Adda Arena — offline shell */
const CACHE = 'adda-arena-v1';
const FILES = [
  './', './index.html', './manifest.webmanifest',
  './css/app.css',
  './js/store.js', './js/data.js', './js/ui.js', './js/app.js',
  './js/games/spy.js', './js/games/snakes.js', './js/games/tictactoe.js',
  './js/games/wordchain.js', './js/games/quiz.js', './js/games/memory.js',
  './js/games/truthdare.js',
  './icons/icon-192.png', './icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
