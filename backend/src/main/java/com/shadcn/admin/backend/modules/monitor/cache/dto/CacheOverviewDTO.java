package com.shadcn.admin.backend.modules.monitor.cache.dto;

public record CacheOverviewDTO(
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
