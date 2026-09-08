/* BatchMath service worker — v10.6.3.R
   Network-first while online; reliable runtime caching for offline use.
   Navigation cache keys are normalized so equivalent static-page URLs share one entry.
   MathJax is pinned to v4.1.3 and its CDN resources are cached explicitly. */
const VERSION = '10.6.3.R';
const CACHE_PREFIX = 'batchmath-';
const SHELL_CACHE = `${CACHE_PREFIX}shell-${VERSION}`;
const RUNTIME_CACHE = `${CACHE_PREFIX}runtime-${VERSION}`;
const MATHJAX_CACHE = `${CACHE_PREFIX}mathjax-${VERSION}`;
const MATHJAX_ENTRY = 'https://cdn.jsdelivr.net/npm/mathjax@4.1.3/tex-chtml.js';

const APP_SHELL = [
  '/',
  '/offline.html',
  '/manifest.webmanifest',
  '/assets/site.css',
  '/assets/answer-normalization.js',
  '/assets/pwa.js',
  '/assets/batchmath-storage.js',
  '/assets/problem-tracking.js',
  '/assets/reproducible-rng.js',
  '/assets/ap-topic-practice.css',
  '/assets/ap-topic-generators.js',
  '/assets/ap-topic-practice.js',
  '/favicon.svg',
  '/favicon.ico',
  '/favicon-32.png',
  '/apple-touch-icon.png',
  '/assets/icons/app-icon-192.png',
  '/assets/icons/app-icon-512.png',
  '/assets/icons/maskable-icon-192.png',
  '/assets/icons/maskable-icon-512.png',
  '/im1/',
  '/calculus-prep/',
  '/ap-calculus/',
  '/about/',
  '/diagnostics/'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    await cache.addAll(APP_SHELL);

    // Best-effort warm cache for the MathJax entry bundle. A temporary CDN
    // failure must never prevent the BatchMath service worker from installing.
    try {
      const mathCache = await caches.open(MATHJAX_CACHE);
      const request = new Request(MATHJAX_ENTRY, { mode: 'no-cors' });
      const response = await fetch(request);
      if (response && (response.ok || response.type === 'opaque')) {
        await mathCache.put(request, response.clone());
      }
    } catch (_) {}
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(key => key.startsWith(CACHE_PREFIX) && ![SHELL_CACHE, RUNTIME_CACHE, MATHJAX_CACHE].includes(key))
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (!event.data) return;
  if (event.data.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data.type === 'GET_VERSION' && event.ports && event.ports[0]) {
    event.ports[0].postMessage({ version: VERSION });
  }
});

function shouldRuntimeCache(url) {
  if (url.origin !== self.location.origin) return false;
  // Keep large/downloadable course files out of Cache Storage.
  return !/\.(?:pdf|zip|mp4|webm|mov|avi|m4v)$/i.test(url.pathname);
}

function isMathJaxRequest(url) {
  if (url.hostname !== 'cdn.jsdelivr.net') return false;
  // Includes the pinned MathJax bundle plus @mathjax font/dynamic component files.
  return /\/npm\/(?:mathjax@|@mathjax\/)/i.test(url.pathname);
}

function normalizedNavigationKey(request) {
  const url = new URL(request.url);
  url.hash = '';
  // BatchMath pages are static; query strings do not change page HTML.
  url.search = '';
  if (url.pathname.endsWith('/index.html')) {
    url.pathname = url.pathname.slice(0, -'index.html'.length);
  } else if (!url.pathname.endsWith('/') && !/\/[^/]+\.[^/]+$/.test(url.pathname)) {
    url.pathname += '/';
  }
  return url.href;
}

function cacheKey(request, navigation) {
  return navigation ? normalizedNavigationKey(request) : request;
}

async function cacheSameOriginResponse(request, response, navigation) {
  if (!shouldRuntimeCache(new URL(request.url))) return;
  if (!response || !response.ok || response.type !== 'basic') return;
  const cache = await caches.open(RUNTIME_CACHE);
  // Runtime writes are awaited so visited pages/resources remain reliable offline.
  await cache.put(cacheKey(request, navigation), response.clone());
}

async function findSameOriginCached(request, navigation) {
  const key = cacheKey(request, navigation);
  const cached = await caches.match(key);
  if (cached) return cached;
  // Compatibility fallback for an exact URL entry if one exists.
  if (navigation) return caches.match(request);
  return undefined;
}

async function networkFirst(request, navigation = false) {
  try {
    // Online users get the newest published BatchMath file rather than a stale
    // browser HTTP-cache copy. Cache Storage remains the explicit offline fallback.
    const response = await fetch(request, { cache: 'no-store' });
    await cacheSameOriginResponse(request, response, navigation);
    return response;
  } catch (error) {
    const cached = await findSameOriginCached(request, navigation);
    if (cached) return cached;
    if (navigation) {
      const fallback = await caches.match('/offline.html');
      if (fallback) return fallback;
    }
    throw error;
  }
}

async function mathJaxNetworkFirst(request) {
  const cache = await caches.open(MATHJAX_CACHE);
  try {
    // Preserve the request's original cross-origin mode/credentials.
    const response = await fetch(request);
    if (response && (response.ok || response.type === 'opaque')) {
      // Await the write for the same reliability reason as same-origin files.
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // MathJax is the one third-party dependency that is useful to preserve for
  // offline practice. Analytics, YouTube, College Board, etc. remain network-native.
  if (url.origin !== self.location.origin) {
    if (isMathJaxRequest(url)) event.respondWith(mathJaxNetworkFirst(request));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, true));
    return;
  }

  // Browser handles PDFs/media/downloads normally; all other same-origin assets
  // are network-first and become offline fallbacks after a successful load.
  if (!shouldRuntimeCache(url)) return;
  event.respondWith(networkFirst(request, false));
});
