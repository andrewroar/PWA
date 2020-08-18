const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/index.js",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/styles.css",
];

const CACHE_NAME = "static-cache-v2";
const DATA_CACHE_NAME = "data-cache-v1";

if (!("indexedDB" in window)) {
  console.log("This browser doesn't support IndexedDB");
  return;
} else {
  console.log("This browser have support IndexedDB");
}

const onInstall = (event) => {
  const createCache = caches.open(CACHE_NAME).then((cache) => {
    console.log("Your files were pre-cached successfully!");
    return cache.addAll(FILES_TO_CACHE);
  });

  event.waitUntil(createCache);

  self.skipWaiting();
};

const onActivate = (event) => {
  const updateCache = caches.keys().then((keyList) => {
    const promises = keyList.map((key) => {
      if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
        console.log("Removing old cache data", key);
        return caches.delete(key);
      }
    });

    return Promise.all(promises);
  });

  event.waitUntil(updateCache);

  self.clients.claim();
};

const onFetch = (event) => {
  // cache successful requests to the API
  if (event.request.url.includes("/api/")) {
    const cacheOrServer = caches
      .open(DATA_CACHE_NAME)
      .then((cache) => {
        return fetch(event.request)
          .then((response) => {
            // If the response was good, clone it and store it in the cache.
            if (response.status === 200) {
              cache.put(event.request.url, response.clone());
            }

            return response;
          })
          .catch((err) => {
            // Network request failed, try to get it from the cache.
            console.log(err);
            return cache.match(event.request);
          });
      })
      .catch((err) => console.log(err));

    event.respondWith(cacheOrServer);

    return;
  }

  // if the request is not for the API, serve static assets using "offline-first" approach.
  // see https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook#cache-falling-back-to-network
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
};

self.addEventListener("install", onInstall);

self.addEventListener("activate", onActivate);

self.addEventListener("fetch", onFetch);

///////////////////////////////
