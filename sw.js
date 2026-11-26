
const CACHE_NAME = "cfmusic-v0.0.2";

const FILES = [
    "./",
    "./index.html",
    "./manifest.json"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(FILES))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys
                    .filter(key =>
                        key.startsWith("cfmusic-") &&
                        key !== CACHE_NAME
                    )
                    .map(key => caches.delete(key))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", event => {
    const request = event.request;

    if (request.method !== "GET") return;

    const url = new URL(request.url);

    if (url.origin !== self.location.origin) return;

    if (!["http:", "https:"].includes(url.protocol)) return;

    if (request.headers.has("Range")) return;

    if (request.destination === "audio") return;

    event.respondWith(
        fetch(request)
            .then(response => {
                if (response.ok) {
                    const copy = response.clone();

                    caches.open(CACHE_NAME)
                        .then(cache => cache.put(request, copy))
                        .catch(console.error);
                }

                return response;
            })
            .catch(async () => {
                const cached = await caches.match(request);

                if (cached) return cached;

                if (request.mode === "navigate") {
                    const fallback =
                        await caches.match("./index.html");

                    if (fallback) return fallback;
                }

                return Response.error();
            })
    );
});
