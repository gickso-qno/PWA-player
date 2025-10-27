const CACHE = "app-shell-v1";
const ASSETS = ["/", "/index.html", "/app.js", "/idb.js", "/manifest.webmanifest"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
});
self.addEventListener("fetch", (e) => {
  const { request } = e;
  // Только оболочку; сами аудио-файлы храним в IndexedDB, не в CacheStorage
  if (request.method === "GET" && ASSETS.some(p => new URL(request.url).pathname === p)) {
    e.respondWith(caches.match(request).then(r => r || fetch(request)));
  }
});