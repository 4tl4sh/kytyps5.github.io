/* The production build prepends a content-versioned shell manifest. */
const BUILD = self.__KYTY_CACHE_CONFIG__ || { version: "dev", precache: [] };
const STATIC = `kyty-static-${BUILD.version}`;
const IMAGES = "kyty-images-v1";
const IMAGE_META = "kyty-image-meta-v1";
const FONTS = "kyty-fonts-v1";
const imageRequests = new Map();
const DAY = 86400000;

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    if (BUILD.precache.length) await (await caches.open(STATIC)).addAll(BUILD.precache);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const old = (await caches.keys()).filter(name => name.startsWith("kyty-static-") && name !== STATIC);
    // Retain one previous shell so an already-open tab can load its old chunks.
    await Promise.all(old.slice(0, Math.max(0, old.length - 1)).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

async function trim(cache, maximum, metadata) {
  const keys = await cache.keys();
  for (const key of keys.slice(0, Math.max(0, keys.length - maximum))) {
    await cache.delete(key);
    if (metadata) await metadata.delete(key);
  }
}

async function imageResponse(request, event) {
  let cache, metadata;
  try { cache = await caches.open(IMAGES); metadata = await caches.open(IMAGE_META); }
  catch { return fetch(request); }
  // Public artwork hosts can vary Accept/Origin between a warm-up fetch and img.
  const saved = await cache.match(request, { ignoreVary: true });
  const stamp = await metadata.match(request, { ignoreVary: true });
  const age = stamp ? Date.now() - Number(await stamp.text()) : Infinity;
  const maxAge = new URL(request.url).hostname === "avatars.githubusercontent.com" ? DAY : 30 * DAY;
  if (saved && age < maxAge) return saved;
  if (!imageRequests.has(request.url)) {
    const task = fetch(request).then(async response => {
      // A reachable server can still be temporarily unavailable. Keep the old
      // timestamp so the next image request retries instead of hiding an outage.
      if (saved && (response.status >= 500 || response.status === 429)) return saved;
      if (response.ok || response.type === "opaque") {
        const copy = response.clone();
        const save = (async () => {
          try {
            await cache.put(request, copy);
            await metadata.put(request, new Response(String(Date.now())));
            await trim(cache, 96, metadata);
          } catch { /* Quota pressure must not stop images from displaying. */ }
        })();
        if (event) event.waitUntil(save);
        else await save;
      }
      return response;
    }).finally(() => imageRequests.delete(request.url));
    imageRequests.set(request.url, task);
  }
  try { return (await imageRequests.get(request.url)).clone(); }
  catch (error) { if (saved) return saved; throw error; }
}

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || !/^https?:$/.test(url.protocol)) return;
  // Startup artwork is part of the offline shell, including the static
  // reduced-motion alternative even if it has never appeared on screen.
  if (url.origin === self.location.origin && BUILD.precache.includes(url.pathname) && request.destination === "image") {
    event.respondWith((async () => {
      try {
        const saved = await (await caches.open(STATIC)).match(request, { ignoreVary: true });
        if (saved) return saved;
      } catch { /* Restricted storage must not prevent startup. */ }
      return fetch(request);
    })());
    return;
  }
  if (request.destination === "image") {
    event.respondWith(imageResponse(request, event));
    return;
  }
  if (request.destination === "font") {
    event.respondWith((async () => {
      let cache;
      try { cache = await caches.open(FONTS); } catch { return fetch(request); }
      const saved = (await cache.match(request, { ignoreVary: true })) || (await caches.match(request, { ignoreVary: true }));
      if (saved) return saved;
      const response = await fetch(request);
      if (response.ok) event.waitUntil(cache.put(request, response.clone()).then(() => trim(cache, 24)).catch(() => {}));
      return response;
    })());
    return;
  }
  if (BUILD.version === "dev" || url.origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try { return await fetch(request); }
      catch { return (await caches.open(STATIC)).match("/index.html"); }
    })());
    return;
  }
  if (BUILD.precache.includes(url.pathname) || /^\/assets\/[^/]+\.(?:js|css|woff2?)$/.test(url.pathname)) {
    // Vite serves immutable assets with Vary: Origin; module/font request
    // headers differ from precache requests even on this same public origin.
    event.respondWith((async () => (await caches.match(request, { ignoreVary: true })) || fetch(request))());
  }
});

self.addEventListener("message", event => {
  if (event.data?.type !== "CACHE_IMAGES" || !Array.isArray(event.data.urls)) return;
  event.waitUntil(Promise.allSettled(event.data.urls.slice(0, 96).filter(url => /^https?:\/\//.test(url)).map(url => imageResponse(new Request(url, { mode: "no-cors", credentials: "omit" })))));
});
