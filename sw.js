// SLRG Statistik - Offline Service Worker
const CACHE = "slrg-statistik-cache-v1";
const offlineFallbackPage = "offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => {
      return cache.addAll([
        offlineFallbackPage,
        "index.html",
        "manifest.json",
        "android-launchericon-96-96.png",
        "android-launchericon-144-144.png",
        "android-launchericon-192-192.png",
        "android-launchericon-512-512.png",
      ]);
    })
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.open(CACHE).then((cache) => cache.match(offlineFallbackPage));
      })
    );
  }
});
