// In-memory cache for fast Stale-While-Revalidate page rendering
let itemsCache = null;
let lastFetchTime = 0;
const CACHE_TTL = 30000; // 30 seconds fresh window

export const getCachedItems = () => itemsCache;

export const setCachedItems = (data) => {
  itemsCache = data;
  lastFetchTime = Date.now();
};

export const isCacheValid = () => {
  return itemsCache !== null && (Date.now() - lastFetchTime < CACHE_TTL);
};
