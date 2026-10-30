/**
 * High-performance In-Memory Cache with TTL and Key Invalidation
 */

class MemoryCache {
  constructor() {
    this.store = new Map();
  }

  /**
   * Store a value with a TTL (seconds). Default 30s.
   */
  set(key, value, ttlSeconds = 30) {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { value, expiresAt });
  }

  /**
   * Retrieve a value if not expired.
   */
  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  /**
   * Delete a specific key.
   */
  del(key) {
    this.store.delete(key);
  }

  /**
   * Delete all keys starting with prefix.
   */
  delPrefix(prefix) {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Clear entire cache.
   */
  clear() {
    this.store.clear();
  }
}

const cache = new MemoryCache();

module.exports = cache;
