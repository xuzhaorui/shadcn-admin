package com.shadcn.admin.backend.modules.auth.controller;

import com.shadcn.admin.backend.common.auth.AuthProperties;
import com.shadcn.admin.backend.common.auth.AuthUser;
import com.shadcn.admin.backend.common.api.ApiResponse;
import com.shadcn.admin.backend.infra.web.JwtAuthWebFilter;
import com.shadcn.admin.backend.modules.auth.dto.LoginRequest;
import com.shadcn.admin.backend.modules.auth.dto.LoginResponse;
import com.shadcn.admin.backend.modules.auth.dto.RegisterRequest;
import com.shadcn.admin.backend.modules.auth.service.AuthService;
import jakarta.validation.Valid;
import java.net.InetSocketAddress;
import java.time.Duration;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import reactor.core.publisher.Mono;
import org.springframework.web.server.ServerWebExchange;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;
    private final AuthProperties authProperties;

    public AuthController(AuthService authService, AuthProperties authProperties) {
        this.authService = authService;
        this.authProperties = authProperties;
    }

    @PostMapping("/login")
    public Mono<ApiResponse<LoginResponse>> login(
            @Valid @RequestBody LoginRequest request, ServerHttpRequest httpRequest, ServerHttpResponse response) {
        String ip = resolveIp(httpRequest);
        String userAgent = httpRequest.getHeaders().getFirst(HttpHeaders.USER_AGENT);
        return authService.login(request, ip, userAgent).map(session -> {
            writeSessionCookies(response, session.accessToken(), session.refreshToken());
            return ApiResponse.success(session.response());
        });
    }

    @PostMapping("/register")
    public Mono<ApiResponse<Map<String, String>>> register(
            @Valid @RequestBody RegisterRequest request, ServerHttpRequest httpRequest) {
        String ip = resolveIp(httpRequest);
        return authService.register(request, ip).map(ApiResponse::success);
    }

    @PostMapping("/refresh")
    public Mono<ApiResponse<LoginResponse>> refresh(ServerHttpRequest httpRequest, ServerHttpResponse response) {
        String refreshToken = readCookieValue(httpRequest, authProperties.getRefreshCookieName());
        if (refreshToken == null || refreshToken.isBlank()) {
            return Mono.just(ApiResponse.fail(401, "refresh token missing"));
        }
        String ip = resolveIp(httpRequest);
        String userAgent = httpRequest.getHeaders().getFirst(HttpHeaders.USER_AGENT);
        return authService.refresh(refreshToken, ip, userAgent).map(session -> {
            writeSessionCookies(response, session.accessToken(), session.refreshToken());
            return ApiResponse.success(session.response());
        });
    }

    @PostMapping("/logout")
    public Mono<ApiResponse<Void>> logout(ServerHttpRequest request, ServerHttpResponse response) {
        String accessToken = readCookieValue(request, authProperties.getAccessCookieName());
        String refreshToken = readCookieValue(request, authProperties.getRefreshCookieName());
        return authService.logout(accessToken, refreshToken).then(Mono.fromSupplier(() -> {
            clearSessionCookies(response);
            return ApiResponse.success();
        }));
    }

    @GetMapping("/me")
    public Mono<ApiResponse<Map<String, Object>>> me(ServerWebExchange exchange) {
        AuthUser authUser = exchange.getAttribute(JwtAuthWebFilter.AUTH_USER_ATTR);
        if (authUser == null) {
            return Mono.just(ApiResponse.fail(401, "unauthorized"));
        }
        return Mono.just(ApiResponse.success(Map.of(
                "userId", authUser.userId(),
                "username", authUser.username(),
                "permissions", authUser.permissions(),
                "roleNames", authUser.roleNames())));
    }

    private String resolveIp(ServerHttpRequest httpRequest) {
        String forwardedFor = httpRequest.getHeaders().getFirst("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            String first = forwardedFor.split(",")[0].trim();
            if (!first.isBlank()) {
                return first;
            }
        }
        InetSocketAddress remote = httpRequest.getRemoteAddress();
        return remote == null ? "unknown" : String.valueOf(remote.getAddress().getHostAddress());
    }

    private String readCookieValue(ServerHttpRequest request, String cookieName) {
        var cookie = request.getCookies().getFirst(cookieName);
        return cookie == null ? null : cookie.getValue();
    }

    private void writeSessionCookies(ServerHttpResponse response, String accessToken, String refreshToken) {
        response.addCookie(buildSessionCookie(authProperties.getAccessCookieName(), accessToken, false));
        response.addCookie(buildSessionCookie(authProperties.getRefreshCookieName(), refreshToken, true));
    }

    private void clearSessionCookies(ServerHttpResponse response) {
        response.addCookie(expiredCookie(authProperties.getAccessCookieName()));
        response.addCookie(expiredCookie(authProperties.getRefreshCookieName()));
    }

    private ResponseCookie buildSessionCookie(String name, String value, boolean refresh) {
        long maxAgeSeconds =
                refresh ? authProperties.getRefreshTokenExpireSeconds() : authProperties.getTokenExpireSeconds();
        return ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(authProperties.isCookieSecure())
                .sameSite("Strict")
                .path("/")
                .maxAge(Duration.ofSeconds(Math.max(maxAgeSeconds, 1)))
                .build();
    }

    private ResponseCookie expiredCookie(String name) {
        return ResponseCookie.from(name, "")
                .httpOnly(true)
                .secure(authProperties.isCookieSecure())
                .sameSite("Strict")
                .path("/")
                .maxAge(Duration.ZERO)
                .build();
    }
}
