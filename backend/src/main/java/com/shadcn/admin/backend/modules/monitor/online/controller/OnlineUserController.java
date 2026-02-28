package com.shadcn.admin.backend.modules.monitor.online.controller;

import com.shadcn.admin.backend.common.api.ApiResponse;
import com.shadcn.admin.backend.common.api.PageResponse;
import com.shadcn.admin.backend.modules.monitor.online.dto.ForceLogoutRequest;
import com.shadcn.admin.backend.modules.monitor.online.dto.OnlineUserDTO;
import com.shadcn.admin.backend.modules.monitor.online.dto.OnlineUserListQuery;
import com.shadcn.admin.backend.modules.monitor.online.service.OnlineSessionRegistry;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/monitor/online")
public class OnlineUserController {
    private final OnlineSessionRegistry onlineSessionRegistry;

    public OnlineUserController(OnlineSessionRegistry onlineSessionRegistry) {
        this.onlineSessionRegistry = onlineSessionRegistry;
    }

    @GetMapping("/list")
    public Mono<ApiResponse<PageResponse<OnlineUserDTO>>> list(OnlineUserListQuery query) {
        return Mono.just(ApiResponse.success(onlineSessionRegistry.list(query)));
    }

    @PostMapping("/force-logout")
    public Mono<ApiResponse<Void>> forceLogout(@Valid @RequestBody ForceLogoutRequest request) {
        onlineSessionRegistry.forceLogout(request.getSessionId());
        return Mono.just(ApiResponse.success());
    }
}
