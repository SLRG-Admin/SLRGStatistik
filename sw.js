// 🔹 SLRG Statistik – Kompatibel mit PWABuilder (Root + Subpath)
const CACHE_NAME = "slrg-statistik-v5";
const BASE_PATH = self.location.pathname.includes("/SLRGStatistik/") ? "/SLRGStatistik/" : "/";
const OFFLINE_URL = BASE_PATH + "offline.html";

const ASSETS_TO_CACHE = [
  BASE_PATH + "index.html",
  BASE_PATH + "manifest.json",
  BASE_PATH + "offline.html",
  BASE_PATH + "android-launchericon-96-96.png",
  BASE_PATH + "android-launchericon-144-144.png",
  BASE_PATH + "android-launchericon-192-192.png",
  BASE_PATH + "android-launchericon-512-512.png"
];

self.addEventListener("install", (event) => {
  console.log("📦 Installing SW for base path:", BASE_PATH);
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("♻️ Activating new SW...");
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => key !== CACHE_NAME && caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
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
