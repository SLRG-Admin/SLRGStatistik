// 🔹 SLRG Statistik – Service Worker für Offline-Funktionalität
const CACHE_NAME = "slrg-statistik-v1";
const OFFLINE_URL = "offline.html";

// Liste der Dateien, die direkt beim Installieren gecacht werden
const ASSETS_TO_CACHE = [
  "index.html",
  "manifest.json",
  "offline.html",
  "android-launchericon-96-96.png",
  "android-launchericon-144-144.png",
  "android-launchericon-192-192.png",
  "android-launchericon-512-512.png"
];

// 🧱 Installation – Cache vorbereiten
self.addEventListener("install", (event) => {
  console.log("🔧 Service Worker wird installiert...");
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log("📦 Dateien werden gecacht...");
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
  self.skipWaiting();
});

// 🧹 Alte Caches entfernen, wenn Version geändert wird
self.addEventListener("activate", (event) => {
  console.log("♻️ Alte Caches werden entfernt...");
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

// ⚡ Netzwerkanfragen abfangen
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Antwort erfolgreich → zwischenspeichern
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => {
        // Kein Netz → versuche Cache
        return caches.match(event.request)
          .then((cached) => cached || caches.match(OFFLINE_URL));
      })
  );
});
