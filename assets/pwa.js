/* BatchMath PWA registration/update foundation — v10.6.3.G */
(() => {
  'use strict';

  const APP_VERSION = '10.6.3.G';
  const state = {
    version: APP_VERSION,
    supported: 'serviceWorker' in navigator,
    registration: null,
    updateReady: false,
    installAvailable: false,
    applyUpdate() {
      const waiting = state.registration && state.registration.waiting;
      if (!waiting) return false;
      state._reloadOnControllerChange = true;
      waiting.postMessage({ type: 'SKIP_WAITING' });
      return true;
    },
    async install() {
      const prompt = state._installPrompt;
      if (!prompt) return false;
      state._installPrompt = null;
      state.installAvailable = false;
      syncActionUI();
      try {
        await prompt.prompt();
        await prompt.userChoice;
        return true;
      } catch (_) {
        return false;
      }
    }
  };

  window.BatchMathPWA = state;

  function ensureActionUI() {
    if (document.querySelector('.bm-pwa-actions')) return;
    const wrap = document.createElement('div');
    wrap.className = 'bm-pwa-actions';
    wrap.setAttribute('aria-label', 'BatchMath app actions');

    const install = document.createElement('button');
    install.type = 'button';
    install.className = 'bm-pwa-action bm-install';
    install.textContent = 'Install BatchMath';
    install.addEventListener('click', () => state.install());

    const update = document.createElement('button');
    update.type = 'button';
    update.className = 'bm-pwa-action bm-update';
    update.textContent = 'Update BatchMath';
    update.addEventListener('click', () => state.applyUpdate());

    const status = document.createElement('span');
    status.className = 'sr-only';
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('aria-atomic', 'true');
    status.dataset.bmPwaStatus = '1';

    wrap.append(install, update, status);
    document.body.appendChild(wrap);
  }

  function syncActionUI() {
    if (!document.body) return;
    ensureActionUI();
    const install = document.querySelector('.bm-pwa-action.bm-install');
    const update = document.querySelector('.bm-pwa-action.bm-update');
    const status = document.querySelector('[data-bm-pwa-status]');
    if (install) install.classList.toggle('is-visible', !!state.installAvailable);
    if (update) update.classList.toggle('is-visible', !!state.updateReady);
    if (status) {
      if (state.updateReady) status.textContent = 'A BatchMath update is available.';
      else if (state.installAvailable) status.textContent = 'BatchMath can be installed as an app.';
      else status.textContent = '';
    }
  }

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    state._installPrompt = event;
    state.installAvailable = true;
    syncActionUI();
    window.dispatchEvent(new CustomEvent('batchmath:pwa-install-available'));
  });

  window.addEventListener('appinstalled', () => {
    state._installPrompt = null;
    state.installAvailable = false;
    syncActionUI();
    window.dispatchEvent(new CustomEvent('batchmath:pwa-installed'));
  });

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
    syncActionUI();
    window.dispatchEvent(new CustomEvent('batchmath:pwa-update-ready', {
      detail: { version: APP_VERSION }
    }));
  }

  window.addEventListener('load', async () => {
    syncActionUI();
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
