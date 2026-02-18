package com.shadcn.admin.backend.modules.auth.controller;

import com.shadcn.admin.backend.common.api.ApiResponse;
import com.shadcn.admin.backend.modules.auth.dto.LoginRequest;
import com.shadcn.admin.backend.modules.auth.dto.LoginResponse;
import com.shadcn.admin.backend.modules.auth.service.AuthService;
import jakarta.validation.Valid;
import java.net.InetSocketAddress;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.server.reactive.ServerHttpRequest;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public Mono<ApiResponse<LoginResponse>> login(
            @Valid @RequestBody LoginRequest request, ServerHttpRequest httpRequest) {
        InetSocketAddress remote = httpRequest.getRemoteAddress();
        String ip = remote == null ? "unknown" : String.valueOf(remote.getAddress().getHostAddress());
        return authService.login(request, ip).map(ApiResponse::success);
    }
}
