/*
 * BAI Health service worker.
 *
 * Strategy:
 *   - Install:  pre-cache the five app routes so a cold offline launch has
 *               HTML to fall back to.
 *   - Activate: purge old caches whose names don't match the current version
 *               strings below.
 *   - Fetch:    network-first for navigations (HTML) with cache fallback;
 *               stale-while-revalidate for same-origin static assets
 *               (JS, CSS, fonts, images). Everything else passes through.
 *
 * Bump CACHE_VERSION whenever the shell routes or caching behavior change so
 * old caches get swept. Runtime assets have hashed filenames so stale entries
 * don't matter across builds.
 */

const CACHE_VERSION = "v1";
const PAGES_CACHE = `bai-pages-${CACHE_VERSION}`;
const RUNTIME_CACHE = `bai-runtime-${CACHE_VERSION}`;
const OWNED_CACHES = new Set([PAGES_CACHE, RUNTIME_CACHE]);

const PRECACHE_URLS = ["/", "/measure", "/history", "/settings", "/about"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PAGES_CACHE);
      // Fetch each individually so one 404/offline failure doesn't abort install.
      await Promise.all(
        PRECACHE_URLS.map(async (url) => {
          try {
            const res = await fetch(url, { credentials: "same-origin" });
            if (res.ok) await cache.put(url, res.clone());
          } catch {
            // Offline during install: skip. Page will be cached on first visit.
          }
        }),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((n) => n.startsWith("bai-") && !OWNED_CACHES.has(n))
          .map((n) => caches.delete(n)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Never try to cache the service worker or manifest endpoints.
  if (url.pathname === "/sw.js" || url.pathname === "/manifest.webmanifest") {
    return;
  }

  if (req.mode === "navigate") {
    event.respondWith(handleNavigation(req));
    return;
  }

  if (isCacheableAsset(url)) {
    event.respondWith(handleAsset(req));
  }
});

async function handleNavigation(request) {
  const cache = await caches.open(PAGES_CACHE);
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.ok) {
      cache.put(request, fresh.clone()).catch(() => {});
    }
    return fresh;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    const fallback = await cache.match("/");
    if (fallback) return fallback;
    return new Response(
      "<h1>Offline</h1><p>BAI Health is offline and this page hasn't been cached yet.</p>",
      {
        status: 503,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      },
    );
  }
}

async function handleAsset(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then((res) => {
      if (res && res.ok && res.type !== "opaque") {
        cache.put(request, res.clone()).catch(() => {});
      }
      return res;
    })
    .catch(() => null);

  if (cached) return cached;
  const fresh = await networkPromise;
  if (fresh) return fresh;
  return new Response("", { status: 504, statusText: "Gateway Timeout" });
}

function isCacheableAsset(url) {
  // Next hashed assets under /_next/static; also common static types.
  if (url.pathname.startsWith("/_next/static/")) return true;
  return /\.(js|css|woff2?|ttf|otf|png|jpg|jpeg|svg|webp|gif|ico)$/i.test(
    url.pathname,
  );
}
