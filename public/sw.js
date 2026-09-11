// Minimal service worker — just enough to satisfy browser installability
// criteria (a controlling SW with a fetch handler). Every request still
// goes straight to the network: this app's data is per-request/session
// (auth, listings, messages), so there's nothing here worth caching.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
