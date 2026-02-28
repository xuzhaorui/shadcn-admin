package com.shadcn.admin.backend.modules.monitor.cache.controller;

import com.shadcn.admin.backend.common.api.ApiResponse;
import com.shadcn.admin.backend.modules.monitor.cache.dto.CacheSummaryDTO;
import com.shadcn.admin.backend.modules.monitor.cache.service.CacheMonitorService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/monitor/cache")
public class CacheMonitorController {
    private final CacheMonitorService cacheMonitorService;

    public CacheMonitorController(CacheMonitorService cacheMonitorService) {
        this.cacheMonitorService = cacheMonitorService;
    }

    @GetMapping("/summary")
    public Mono<ApiResponse<CacheSummaryDTO>> summary() {
        return Mono.just(ApiResponse.success(cacheMonitorService.summary()));
    }

    @PostMapping("/clear")
    public Mono<ApiResponse<Void>> clearCache(@RequestParam String cacheName) {
        cacheMonitorService.clearCache(cacheName);
        return Mono.just(ApiResponse.success());
    }

    @PostMapping("/clear-all")
    public Mono<ApiResponse<String>> clearAll() {
        return Mono.just(ApiResponse.success(cacheMonitorService.clearAll()));
    }
}
