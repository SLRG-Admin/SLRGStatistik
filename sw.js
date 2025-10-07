// 🔹 SLRG Statistik – Optimierte Version für GitHub Pages & PWABuilder
const CACHE_NAME = "slrg-statistik-v6";
const BASE_PATH = "/SLRGStatistik/"; // feste Basis für GitHub Pages
const OFFLINE_URL = BASE_PATH + "offline.html";

// Dateien, die beim Installieren direkt gecacht werden
const ASSETS_TO_CACHE = [
  BASE_PATH + "index.html",
  BASE_PATH + "manifest.json",
  BASE_PATH + "offline.html",
  BASE_PATH + "android-launchericon-96-96.png",
  BASE_PATH + "android-launchericon-144-144.png",
  BASE_PATH + "android-launchericon-192-192.png",
  BASE_PATH + "android-launchericon-512-512.png"
];

// 🧱 Installation – Cache vorbereiten
self.addEventListener("install", (event) => {
  console.log("📦 Installing Service Worker…");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

// ♻️ Aktivieren & alte Caches löschen
self.addEventListener("activate", (event) => {
  console.log("♻️ Activating new Service Worker…");
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => key !== CACHE_NAME && caches.delete(key)))
    )
  );
  self.clients.claim();
});

// ⚡ Fetch-Event mit Offline-Fallback
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const requestURL = new URL(event.request.url);

  // Nur Anfragen im SLRGStatistik-Pfad behandeln
  if (!requestURL.pathname.startsWith(BASE_PATH)) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(event.request);
        return cachedResponse || cache.match(OFFLINE_URL);
      })
  );
});
