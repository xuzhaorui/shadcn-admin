package com.shadcn.admin.backend.modules.monitor.server.controller;

import com.shadcn.admin.backend.common.api.ApiResponse;
import com.shadcn.admin.backend.modules.monitor.server.dto.ServerMetricsDTO;
import com.shadcn.admin.backend.modules.monitor.server.service.ServerMonitorService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/monitor/server")
public class ServerMonitorController {
    private final ServerMonitorService serverMonitorService;

    public ServerMonitorController(ServerMonitorService serverMonitorService) {
        this.serverMonitorService = serverMonitorService;
    }

    @GetMapping("/info")
    public Mono<ApiResponse<ServerMetricsDTO>> info() {
        return Mono.just(ApiResponse.success(serverMonitorService.getMetrics()));
    }
}
