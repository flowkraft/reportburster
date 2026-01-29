package com.flowkraft.jobman.services;

import com.sourcekraft.documentburster.common.analytics.dto.PivotResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Simple LRU cache for query results.
 *
 * Pragmatic caching implementation:
 * - LRU eviction policy
 * - Configurable max size
 * - Time-based expiration
 * - Thread-safe
 */
public class QueryCache {

    private static final Logger log = LoggerFactory.getLogger(QueryCache.class);

    private final int maxSize;
    private final long ttlMillis;
    private final Map<String, CacheEntry> cache;

    /**
     * Cache entry with timestamp for TTL.
     */
    private static class CacheEntry {
        final PivotResponse response;
        final long timestamp;

        CacheEntry(PivotResponse response) {
            this.response = response;
            this.timestamp = System.currentTimeMillis();
        }

        boolean isExpired(long ttlMillis) {
            return (System.currentTimeMillis() - timestamp) > ttlMillis;
        }
    }

    /**
     * Create cache with default settings.
     * Default: 100 entries, 5 minutes TTL
     */
    public QueryCache() {
        this(100, 5 * 60 * 1000); // 5 minutes
    }

    /**
     * Create cache with custom settings.
     *
     * @param maxSize Maximum number of entries
     * @param ttlMillis Time-to-live in milliseconds
     */
    public QueryCache(int maxSize, long ttlMillis) {
        this.maxSize = maxSize;
        this.ttlMillis = ttlMillis;

        // LinkedHashMap with access order (LRU)
        this.cache = new LinkedHashMap<String, CacheEntry>(maxSize, 0.75f, true) {
            @Override
            protected boolean removeEldestEntry(Map.Entry<String, CacheEntry> eldest) {
                boolean shouldRemove = size() > QueryCache.this.maxSize;
                if (shouldRemove) {
                    log.debug("Evicting cache entry (LRU): {}", eldest.getKey());
                }
                return shouldRemove;
            }
        };

        log.info("Query cache initialized: maxSize={}, ttl={}ms", maxSize, ttlMillis);
    }

    /**
     * Get cached result.
     *
     * @param key Cache key
     * @return Cached response, or null if not found/expired
     */
    public synchronized PivotResponse get(String key) {
        CacheEntry entry = cache.get(key);

        if (entry == null) {
            log.debug("Cache MISS: {}", key);
            return null;
        }

        if (entry.isExpired(ttlMillis)) {
            log.debug("Cache EXPIRED: {}", key);
            cache.remove(key);
            return null;
        }

        log.debug("Cache HIT: {}", key);

        // Mark as cached in metadata
        PivotResponse response = entry.response;
        response.getMetadata().setCached(true);

        return response;
    }

    /**
     * Put result in cache.
     *
     * @param key Cache key
     * @param response Response to cache
     */
    public synchronized void put(String key, PivotResponse response) {
        cache.put(key, new CacheEntry(response));
        log.debug("Cache PUT: {} (size: {})", key, cache.size());
    }

    /**
     * Clear entire cache.
     */
    public synchronized void clear() {
        int size = cache.size();
        cache.clear();
        log.info("Cache cleared: {} entries removed", size);
    }

    /**
     * Remove specific entry.
     *
     * @param key Cache key
     */
    public synchronized void remove(String key) {
        cache.remove(key);
        log.debug("Cache REMOVE: {}", key);
    }

    /**
     * Get cache statistics.
     *
     * @return Map with cache stats
     */
    public synchronized Map<String, Object> getStats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("size", cache.size());
        stats.put("maxSize", maxSize);
        stats.put("ttlMillis", ttlMillis);

        // Count expired entries
        long now = System.currentTimeMillis();
        long expiredCount = cache.values().stream()
                .filter(entry -> entry.isExpired(ttlMillis))
                .count();
        stats.put("expiredCount", expiredCount);

        return stats;
    }

    /**
     * Generate cache key from request.
     *
     * @param connectionCode Connection code
     * @param sql SQL query
     * @return Cache key
     */
    public static String generateKey(String connectionCode, String sql) {
        // Simple hash-based key
        return connectionCode + ":" + sql.hashCode();
    }
}
