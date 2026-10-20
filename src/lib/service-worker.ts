export function registerAssetCache() {
  if (!("serviceWorker" in navigator)) return;
  let registration: ServiceWorkerRegistration | undefined;
  function warmVisibleImages() {
    const worker = navigator.serviceWorker.controller;
    if (!worker) return;
    const urls = [
      ...new Set(
        [...document.images]
          .filter((image) => image.complete && image.naturalWidth > 0)
          .map((image) => image.currentSrc || image.src),
      ),
    ];
    worker.postMessage({ type: "CACHE_IMAGES", urls });
  }
  navigator.serviceWorker.addEventListener(
    "controllerchange",
    warmVisibleImages,
  );
  navigator.serviceWorker
    .register("/sw.js", { updateViaCache: "none" })
    .then((value) => {
      registration = value;
      return navigator.serviceWorker.ready;
    })
    .then(warmVisibleImages)
    .catch(() => {
      /* The site also works with ordinary browser caching. */
    });
  // Pick up art loaded before the worker claimed this first visit.
  window.addEventListener("load", warmVisibleImages, { once: true });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) void registration?.update().catch(() => {});
  });
}
