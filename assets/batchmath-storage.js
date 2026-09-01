/* BatchMath local storage foundation — v10.0
   No student account or cloud sync. This creates a stable, namespaced API that
   future practice engines can use for settings, recents, and local history. */
(() => {
  'use strict';

  const SCHEMA_VERSION = 1;
  const PREFIX = `batchmath:v${SCHEMA_VERSION}:`;
  const memoryFallback = new Map();

  function storageAvailable() {
    try {
      const key = `${PREFIX}__test__`;
      localStorage.setItem(key, '1');
      localStorage.removeItem(key);
      return true;
    } catch (_) {
      return false;
    }
  }

  const hasLocalStorage = storageAvailable();

  function rawGet(key) {
    const fullKey = PREFIX + key;
    try {
      return hasLocalStorage ? localStorage.getItem(fullKey) : (memoryFallback.get(fullKey) ?? null);
    } catch (_) {
      return memoryFallback.get(fullKey) ?? null;
    }
  }

  function rawSet(key, value) {
    const fullKey = PREFIX + key;
    try {
      if (hasLocalStorage) localStorage.setItem(fullKey, value);
      else memoryFallback.set(fullKey, value);
      return true;
    } catch (_) {
      memoryFallback.set(fullKey, value);
      return false;
    }
  }

  function rawRemove(key) {
    const fullKey = PREFIX + key;
    try {
      if (hasLocalStorage) localStorage.removeItem(fullKey);
      memoryFallback.delete(fullKey);
      return true;
    } catch (_) {
      memoryFallback.delete(fullKey);
      return false;
    }
  }

  function get(key, fallback = null) {
    const raw = rawGet(key);
    if (raw == null) return fallback;
    try { return JSON.parse(raw); } catch (_) { return fallback; }
  }

  function set(key, value) {
    return rawSet(key, JSON.stringify(value));
  }

  function update(key, updater, fallback = null) {
    const current = get(key, fallback);
    const next = updater(current);
    set(key, next);
    return next;
  }

  function getSettings() {
    return get('settings', {});
  }

  function setSetting(name, value) {
    if (!name) return false;
    update('settings', current => ({ ...(current || {}), [name]: value }), {});
    return true;
  }

  function addRecentPractice(item, maxItems = 20) {
    if (!item || !item.id) return [];
    const normalized = {
      id: String(item.id),
      title: String(item.title || item.id),
      url: String(item.url || location.pathname),
      course: item.course ? String(item.course) : '',
      touchedAt: new Date().toISOString()
    };
    return update('recent-practice', current => {
      const list = Array.isArray(current) ? current : [];
      return [normalized, ...list.filter(x => x && x.id !== normalized.id)].slice(0, maxItems);
    }, []);
  }

  function recordPracticeSession(session, maxItems = 250) {
    if (!session || !session.activityId) return [];
    const entry = {
      ...session,
      activityId: String(session.activityId),
      recordedAt: session.recordedAt || new Date().toISOString()
    };
    return update('practice-history', current => {
      const list = Array.isArray(current) ? current : [];
      return [entry, ...list].slice(0, maxItems);
    }, []);
  }

  function clearAll() {
    const known = ['settings', 'recent-practice', 'practice-history'];
    known.forEach(rawRemove);
  }

  window.BatchMathStorage = Object.freeze({
    schemaVersion: SCHEMA_VERSION,
    persistent: hasLocalStorage,
    get,
    set,
    update,
    remove: rawRemove,
    getSettings,
    setSetting,
    getRecentPractice: () => get('recent-practice', []),
    addRecentPractice,
    getPracticeHistory: () => get('practice-history', []),
    recordPracticeSession,
    clearAll
  });
})();
