// 🔹 SLRG Statistik – PWA Builder kompatibler Service Worker mit Offline-Unterstützung
const CACHE_NAME = "slrg-statistik-v3";
const OFFLINE_URL = "offline.html";

// Dateien, die beim Installieren gecacht werden
const ASSETS_TO_CACHE = [
  "index.html",
  "manifest.json",
  "offline.html",
  "android-launchericon-96-96.png",
  "android-launchericon-144-144.png",
  "android-launchericon-192-192.png",
  "android-launchericon-512-512.png"
];

// 🧱 Installation
self.addEventListener("install", (event) => {
  console.log("📦 Installing Service Worker...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

// ♻️ Aktivieren und alte Caches löschen
self.addEventListener("activate", (event) => {
  console.log("♻️ Aktivieren & alte Caches entfernen...");
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => key !== CACHE_NAME && caches.delete(key)))
    )
  );
  self.clients.claim();
});

// ⚡ Fetch-Event – Offline-Fallback
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Im Cache speichern
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(async () => {
        // Versuche Cache oder offline.html
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        } else {
          console.warn("⚠️ Offline – zeige Offline-Seite");
          return cache.match(OFFLINE_URL);
        }
      })
  );
});
