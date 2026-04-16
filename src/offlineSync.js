const QUEUE_KEY = "nomad-sync-queue-v1";
const listeners = new Set();

const canUseStorage = () => typeof window !== "undefined" && typeof localStorage !== "undefined";

const safeJsonParse = (value, fallback) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const readQueue = () => {
  if (!canUseStorage()) return [];
  return safeJsonParse(localStorage.getItem(QUEUE_KEY) || "[]", []);
};

const writeQueue = (queue) => {
  if (!canUseStorage()) return;
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  const size = queue.length;
  listeners.forEach((listener) => listener(size));
};

export const getPendingSyncCount = () => readQueue().length;

export const subscribePendingSync = (listener) => {
  listeners.add(listener);
  listener(getPendingSyncCount());
  return () => listeners.delete(listener);
};

const buildQueueItem = ({ path, method = "GET", headers = {}, body = null, dedupeKey = null }) => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  path,
  method,
  headers,
  body,
  dedupeKey,
  createdAt: new Date().toISOString(),
});

const enqueueRequest = (item) => {
  const queue = readQueue();
  const next = item.dedupeKey
    ? [...queue.filter((queued) => queued.dedupeKey !== item.dedupeKey), item]
    : [...queue, item];
  writeQueue(next);
  return item;
};

const dropQueuedByDedupeKey = (dedupeKey) => {
  if (!dedupeKey) return;
  const queue = readQueue();
  const next = queue.filter((queued) => queued.dedupeKey !== dedupeKey);
  if (next.length !== queue.length) writeQueue(next);
};

const performRequest = (item) =>
  fetch(item.path, {
    method: item.method,
    headers: item.headers,
    body: item.body,
  });

export const queueSupabaseRequest = (request) => enqueueRequest(buildQueueItem(request));

export const sendSupabaseRequest = async (request, options = {}) => {
  const item = buildQueueItem(request);
  const shouldQueue = options.queueIfOffline !== false;

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    if (shouldQueue) enqueueRequest(item);
    return { ok: false, queued: shouldQueue, offline: true, response: null };
  }

  try {
    const response = await performRequest(item);
    if (response.ok) {
      dropQueuedByDedupeKey(item.dedupeKey);
      return { ok: true, queued: false, offline: false, response };
    }

    if (response.status >= 500 && shouldQueue) {
      enqueueRequest(item);
      return { ok: false, queued: true, offline: false, response };
    }

    return { ok: false, queued: false, offline: false, response };
  } catch {
    if (shouldQueue) {
      enqueueRequest(item);
      return { ok: false, queued: true, offline: true, response: null };
    }
    return { ok: false, queued: false, offline: true, response: null };
  }
};

export const flushSyncQueue = async () => {
  if (typeof navigator !== "undefined" && !navigator.onLine) return { synced: 0, pending: getPendingSyncCount() };

  const queue = readQueue();
  if (!queue.length) return { synced: 0, pending: 0 };

  const remaining = [];
  let synced = 0;

  for (let index = 0; index < queue.length; index += 1) {
    const item = queue[index];
    try {
      const response = await performRequest(item);
      if (response.ok) {
        synced += 1;
        continue;
      }

      // Keep failed items queued unless the server explicitly rejects them as client errors.
      if (response.status >= 500 || response.status === 0) {
        remaining.push(item, ...queue.slice(index + 1));
        break;
      }

      if (response.status >= 400) {
        continue;
      }

      remaining.push(item, ...queue.slice(index + 1));
      break;
    } catch {
      remaining.push(item, ...queue.slice(index + 1));
      break;
    }
  }

  writeQueue(remaining);
  return { synced, pending: remaining.length };
};

let syncInitialized = false;

export const initOfflineSync = () => {
  if (syncInitialized || typeof window === "undefined") return () => {};
  syncInitialized = true;

  const handleOnline = () => {
    flushSyncQueue().catch(() => {});
  };

  window.addEventListener("online", handleOnline);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") flushSyncQueue().catch(() => {});
  });

  handleOnline();

  return () => {
    window.removeEventListener("online", handleOnline);
  };
};
