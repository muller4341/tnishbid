// High-performance Stale-While-Revalidate Client Cache
const CACHE_TTL = 60000; // 60 seconds fresh window

let memoryCache = new Map();

export const cacheGet = (key) => {
  if (memoryCache.has(key)) {
    const { data, timestamp } = memoryCache.get(key);
    if (Date.now() - timestamp < CACHE_TTL) {
      return data;
    }
  }

  try {
    const stored = sessionStorage.getItem(`app_cache_${key}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Date.now() - parsed.timestamp < CACHE_TTL * 3) {
        memoryCache.set(key, parsed);
        return parsed.data;
      }
    }
  } catch {
    // ignore
  }

  return null;
};

export const cacheSet = (key, data) => {
  const payload = { data, timestamp: Date.now() };
  memoryCache.set(key, payload);
  try {
    sessionStorage.setItem(`app_cache_${key}`, JSON.stringify(payload));
  } catch {
    // ignore quota errors
  }
};

export const getCachedItems = () => cacheGet('items_all');

export const setCachedItems = (data) => cacheSet('items_all', data);

export const isCacheValid = () => {
  return getCachedItems() !== null;
};

export default {
  cacheGet,
  cacheSet,
  getCachedItems,
  setCachedItems,
  isCacheValid
};
