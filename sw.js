// 🔹 SLRG Statistik – Service Worker mit Offline-Unterstützung
const CACHE_NAME = "slrg-statistik-v2";
const OFFLINE_URL = "offline.html";

// Dateien, die direkt gecacht werden sollen
const ASSETS_TO_CACHE = [
  "index.html",
  "manifest.json",
  "offline.html",
  "android-launchericon-96-96.png",
  "android-launchericon-144-144.png",
  "android-launchericon-192-192.png",
  "android-launchericon-512-512.png"
];

// 🧱 Installation – Cache aufbauen
self.addEventListener("install", (event) => {
  console.log("📦 Installiere Service Worker und cache Dateien...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// ♻️ Alte Caches löschen
self.addEventListener("activate", (event) => {
  console.log("♻️ Aktiviert und alte Caches entfernt...");
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// ⚡ Fetch-Handler mit Offline-Fallback
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Antwort im Cache speichern
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        return response;
      })
      .catch(() => {
        // Wenn offline → versuche Cache → sonst offline.html
        return caches.match(event.request).then((cached) => {
          return cached || caches.match(OFFLINE_URL);
        });
      })
  );
});
