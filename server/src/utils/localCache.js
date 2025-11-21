/**
 * Local In-Memory Cache
 * 
 * Simple in-memory cache using JavaScript Map.
 */

const cache = new Map();

/**
 * Get value from cache
 * @param {string} key - Cache key
 * @returns {any|null} - Cached value or null if expired/not found
 */
const getCache = (key) => {
  const item = cache.get(key);
  if (!item || Date.now() > item.expiry) {
    cache.delete(key);
    return null;
  }
  return item.value;
};

/**
 * Set value in cache with TTL
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttlMs - Time to live in milliseconds (default: 1 hour)
 */
const setCache = (key, value, ttlMs = 3600000) => {
  cache.set(key, { value, expiry: Date.now() + ttlMs });
};

/**
 * Clear specific cache key
 * @param {string} key - Cache key to clear
 */
const clearCache = (key) => {
  cache.delete(key);
};

/**
 * Clear all cache entries
 */
const clearAllCache = () => {
  cache.clear();
};

/**
 * Get cache statistics
 */
const getCacheStats = () => {
  return {
    size: cache.size,
    keys: Array.from(cache.keys())
  };
};

module.exports = {
  getCache,
  setCache,
  clearCache,
  clearAllCache,
  getCacheStats
};
