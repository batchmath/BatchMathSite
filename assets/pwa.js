/* BatchMath PWA registration/update foundation — v10.3.3 */
(() => {
  'use strict';

  const APP_VERSION = '10.3.3';
  const state = {
    version: APP_VERSION,
    supported: 'serviceWorker' in navigator,
    registration: null,
    updateReady: false,
    applyUpdate() {
      const waiting = state.registration && state.registration.waiting;
      if (!waiting) return false;
      state._reloadOnControllerChange = true;
      waiting.postMessage({ type: 'SKIP_WAITING' });
      return true;
    }
  };

  window.BatchMathPWA = state;

  if (!state.supported || !/^https?:$/.test(location.protocol)) return;

  let lastUpdateCheck = 0;
  const UPDATE_CHECK_INTERVAL = 60 * 60 * 1000;

  async function checkForUpdate(force = false) {
    const registration = state.registration;
    if (!registration) return;
    const now = Date.now();
    if (!force && now - lastUpdateCheck < UPDATE_CHECK_INTERVAL) return;
    lastUpdateCheck = now;
    try { await registration.update(); } catch (_) {}
  }

  function markUpdateReady(registration) {
    if (!registration.waiting || !navigator.serviceWorker.controller) return;
    state.updateReady = true;
    window.dispatchEvent(new CustomEvent('batchmath:pwa-update-ready', {
      detail: { version: APP_VERSION }
    }));
  }

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });
      state.registration = registration;
      markUpdateReady(registration);

      registration.addEventListener('updatefound', () => {
        const installing = registration.installing;
        if (!installing) return;
        installing.addEventListener('statechange', () => {
          if (installing.state === 'installed') markUpdateReady(registration);
        });
      });

      checkForUpdate(true);
    } catch (error) {
      console.warn('BatchMath PWA registration was not available:', error);
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkForUpdate(false);
  });

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (state._reloadOnControllerChange) location.reload();
  });
})();
