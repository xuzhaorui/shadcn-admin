package com.shadcn.admin.backend.modules.monitor.cache.service;

import com.shadcn.admin.backend.common.cache.LocalCacheManager;
import com.shadcn.admin.backend.modules.monitor.cache.dto.CacheOverviewDTO;
import com.shadcn.admin.backend.modules.monitor.cache.dto.CacheSummaryDTO;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;

@Service
public class CacheMonitorService {
    private final LocalCacheManager localCacheManager;

    public CacheMonitorService(LocalCacheManager localCacheManager) {
        this.localCacheManager = localCacheManager;
    }

    public CacheSummaryDTO summary() {
        List<CacheOverviewDTO> caches = localCacheManager.getStatsSnapshots().stream()
                .map(snapshot -> new CacheOverviewDTO(
                        snapshot.cacheName(),
                        snapshot.ttlSeconds(),
                        snapshot.maxSize(),
                        snapshot.entryCount(),
                        snapshot.hitRate(),
                        snapshot.requestCount(),
                        snapshot.hitCount(),
                        snapshot.missCount(),
                        snapshot.evictionCount(),
                        snapshot.estimatedBytes()))
                .toList();

        long totalEntries = caches.stream().mapToLong(CacheOverviewDTO::entryCount).sum();
        long totalEstimatedBytes = caches.stream().mapToLong(CacheOverviewDTO::estimatedBytes).sum();
        return new CacheSummaryDTO(LocalDateTime.now(), caches.size(), totalEntries, totalEstimatedBytes, caches);
    }

    public void clearCache(String cacheName) {
        localCacheManager.clear(cacheName);
    }

    public String clearAll() {
        int count = localCacheManager.clearAll();
        return String.format(Locale.ROOT, "cleared %d local caches", count);
    }
}
