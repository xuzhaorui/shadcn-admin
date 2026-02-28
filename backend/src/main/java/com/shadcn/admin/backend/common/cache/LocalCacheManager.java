package com.shadcn.admin.backend.common.cache;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.github.benmanes.caffeine.cache.stats.CacheStats;
import com.shadcn.admin.backend.common.exception.BusinessException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Supplier;
import org.springframework.stereotype.Component;

@Component
public class LocalCacheManager {
    private final Map<String, CacheBucket> buckets = new ConcurrentHashMap<>();

    public LocalCacheManager() {
        register(CacheNames.MONITOR_SERVER_METRICS, Duration.ofSeconds(15), 8);
    }

    public void register(String cacheName, Duration ttl, long maxSize) {
        if (cacheName == null || cacheName.isBlank()) {
            throw new IllegalArgumentException("cache name is blank");
        }
        if (ttl == null || ttl.isNegative() || ttl.isZero()) {
            throw new IllegalArgumentException("cache ttl must be positive");
        }
        if (maxSize <= 0) {
            throw new IllegalArgumentException("cache maxSize must be positive");
        }
        buckets.computeIfAbsent(cacheName, key -> new CacheBucket(cacheName, ttl, maxSize));
    }

    public <T> T getOrLoad(String cacheName, String key, Supplier<T> loader) {
        CacheBucket bucket = requireBucket(cacheName);
        CacheValue cached = bucket.cache.getIfPresent(key);
        if (cached != null) {
            @SuppressWarnings("unchecked")
            T value = (T) cached.value();
            return value;
        }
        T loaded = loader.get();
        if (loaded == null) {
            return null;
        }
        bucket.cache.put(key, CacheValue.from(loaded, bucket.ttl));
        return loaded;
    }

    public void put(String cacheName, String key, Object value) {
        if (value == null) {
            return;
        }
        CacheBucket bucket = requireBucket(cacheName);
        bucket.cache.put(key, CacheValue.from(value, bucket.ttl));
    }

    public void evict(String cacheName, String key) {
        CacheBucket bucket = requireBucket(cacheName);
        bucket.cache.invalidate(key);
    }

    public void clear(String cacheName) {
        CacheBucket bucket = requireBucket(cacheName);
        bucket.cache.invalidateAll();
    }

    public int clearAll() {
        int count = 0;
        for (CacheBucket bucket : buckets.values()) {
            bucket.cache.invalidateAll();
            count++;
        }
        return count;
    }

    public List<CacheStatsSnapshot> getStatsSnapshots() {
        return buckets.values().stream()
                .map(this::toStatsSnapshot)
                .sorted(Comparator.comparing(CacheStatsSnapshot::cacheName))
                .toList();
    }

    public List<CacheEntrySnapshot> listEntries(String cacheName, String keyword) {
        CacheBucket bucket = requireBucket(cacheName);
        bucket.cache.cleanUp();
        String normalizedKeyword = Optional.ofNullable(keyword).orElse("").trim().toLowerCase(Locale.ROOT);
        return bucket.cache.asMap().entrySet().stream()
                .filter(entry -> includeEntry(entry, normalizedKeyword))
                .map(entry -> CacheEntrySnapshot.from(cacheName, entry.getKey(), entry.getValue()))
                .sorted(Comparator.comparing(CacheEntrySnapshot::createdAt).reversed())
                .toList();
    }

    private boolean includeEntry(Map.Entry<String, CacheValue> entry, String keyword) {
        if (keyword.isEmpty()) {
            return true;
        }
        return entry.getKey().toLowerCase(Locale.ROOT).contains(keyword)
                || entry.getValue().preview().toLowerCase(Locale.ROOT).contains(keyword);
    }

    private CacheStatsSnapshot toStatsSnapshot(CacheBucket bucket) {
        bucket.cache.cleanUp();
        CacheStats stats = bucket.cache.stats();
        long requests = stats.requestCount();
        double hitRate = requests == 0 ? 0D : (double) stats.hitCount() * 100D / requests;
        long estimatedBytes = bucket.cache.asMap().entrySet().stream()
                .mapToLong(entry -> estimateEntryBytes(entry.getKey(), entry.getValue()))
                .sum();
        return new CacheStatsSnapshot(
                bucket.cacheName,
                bucket.ttl.toSeconds(),
                bucket.maxSize,
                bucket.cache.estimatedSize(),
                round2(hitRate),
                requests,
                stats.hitCount(),
                stats.missCount(),
                stats.evictionCount(),
                estimatedBytes);
    }

    private long estimateEntryBytes(String key, CacheValue value) {
        return key.getBytes(StandardCharsets.UTF_8).length + value.estimatedBytes();
    }

    private CacheBucket requireBucket(String cacheName) {
        CacheBucket bucket = buckets.get(cacheName);
        if (bucket == null) {
            throw new BusinessException(404, "cache not found: " + cacheName);
        }
        return bucket;
    }

    private double round2(double value) {
        return Math.round(value * 100D) / 100D;
    }

    private record CacheBucket(String cacheName, Duration ttl, long maxSize, Cache<String, CacheValue> cache) {
        private CacheBucket(String cacheName, Duration ttl, long maxSize) {
            this(
                    cacheName,
                    ttl,
                    maxSize,
                    Caffeine.newBuilder()
                            .expireAfterWrite(ttl)
                            .maximumSize(maxSize)
                            .recordStats()
                            .build());
        }
    }

    private record CacheValue(Object value, Instant createdAt, Instant expiresAt, String preview, String valueType, long estimatedBytes) {
        private static CacheValue from(Object value, Duration ttl) {
            String preview = buildPreview(value);
            String valueType = value.getClass().getSimpleName();
            long estimatedBytes = preview.getBytes(StandardCharsets.UTF_8).length;
            Instant now = Instant.now();
            return new CacheValue(value, now, now.plus(ttl), preview, valueType, estimatedBytes);
        }
    }

    private static String buildPreview(Object value) {
        String text = Objects.toString(value, "");
        if (text.length() <= 120) {
            return text;
        }
        return text.substring(0, 117) + "...";
    }

    public record CacheStatsSnapshot(
            String cacheName,
            long ttlSeconds,
            long maxSize,
            long entryCount,
            double hitRate,
            long requestCount,
            long hitCount,
            long missCount,
            long evictionCount,
            long estimatedBytes) {}

    public record CacheEntrySnapshot(
            String cacheName,
            String key,
            String preview,
            String valueType,
            long estimatedBytes,
            Instant createdAt,
            Instant expiresAt) {
        private static CacheEntrySnapshot from(String cacheName, String key, CacheValue value) {
            return new CacheEntrySnapshot(
                    cacheName,
                    key,
                    value.preview(),
                    value.valueType(),
                    value.estimatedBytes(),
                    value.createdAt(),
                    value.expiresAt());
        }
    }
}
