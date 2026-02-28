package com.shadcn.admin.backend.modules.monitor.cache.dto;

import java.time.LocalDateTime;
import java.util.List;

public record CacheSummaryDTO(
        LocalDateTime sampledAt,
        long cacheCount,
        long totalEntries,
        long totalEstimatedBytes,
        List<CacheOverviewDTO> caches) {}
