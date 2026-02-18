package com.shadcn.admin.backend.infra.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shadcn.admin.backend.common.api.ApiResponse;
import com.shadcn.admin.backend.common.auth.AuthUser;
import com.shadcn.admin.backend.common.auth.JwtTokenService;
import java.nio.charset.StandardCharsets;
import java.util.Set;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 20)
public class JwtAuthWebFilter implements WebFilter {
    public static final String AUTH_USER_ATTR = "authUser";
    private static final Set<String> OPEN_PATHS = Set.of("/api/auth/login", "/actuator/health", "/actuator/info");
    private static final String AUTH_PREFIX = "Bearer ";

    private final JwtTokenService jwtTokenService;
    private final ObjectMapper objectMapper;

    public JwtAuthWebFilter(JwtTokenService jwtTokenService, ObjectMapper objectMapper) {
        this.jwtTokenService = jwtTokenService;
        this.objectMapper = objectMapper;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        String path = exchange.getRequest().getPath().value();
        HttpMethod method = exchange.getRequest().getMethod();
        if (HttpMethod.OPTIONS.equals(method) || OPEN_PATHS.contains(path) || !path.startsWith("/api/")) {
            return chain.filter(exchange);
        }

        String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (authHeader == null || !authHeader.startsWith(AUTH_PREFIX)) {
            return writeError(exchange, HttpStatus.UNAUTHORIZED, "unauthorized");
        }

        AuthUser authUser;
        try {
            authUser = jwtTokenService.parse(authHeader.substring(AUTH_PREFIX.length()));
        } catch (Exception ex) {
            return writeError(exchange, HttpStatus.UNAUTHORIZED, "invalid token");
        }

        String requiredPermission = PermissionResolver.resolve(method, path);
        if (requiredPermission != null && !hasPermission(authUser, requiredPermission)) {
            return writeError(exchange, HttpStatus.FORBIDDEN, "forbidden");
        }

        exchange.getAttributes().put(AUTH_USER_ATTR, authUser);
        return chain.filter(exchange);
    }

    private boolean hasPermission(AuthUser authUser, String permission) {
        if (authUser.permissions() == null || authUser.permissions().isEmpty()) {
            return false;
        }
        return authUser.permissions().contains("*") || authUser.permissions().contains(permission);
    }

    private Mono<Void> writeError(ServerWebExchange exchange, HttpStatus status, String message) {
        exchange.getResponse().setStatusCode(status);
        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
        byte[] bytes;
        try {
            bytes = objectMapper.writeValueAsBytes(ApiResponse.fail(status.value(), message));
        } catch (Exception ex) {
            bytes = ("{\"code\":" + status.value() + ",\"message\":\"" + message + "\",\"data\":null}")
                    .getBytes(StandardCharsets.UTF_8);
        }
        return exchange.getResponse()
                .writeWith(Mono.just(exchange.getResponse().bufferFactory().wrap(bytes)));
    }

    static class PermissionResolver {
        private PermissionResolver() {}

        static String resolve(HttpMethod method, String path) {
            if (path.startsWith("/api/system/users")) {
                return resolveUsers(method, path);
            }
            if (path.startsWith("/api/system/roles")) {
                return resolveRoles(method, path);
            }
            if (path.startsWith("/api/system/menus")) {
                return resolveMenus(method);
            }
            if (path.startsWith("/api/system/departments")) {
                return resolveDepartments(method);
            }
            return null;
        }

        private static String resolveUsers(HttpMethod method, String path) {
            if (HttpMethod.GET.equals(method)) {
                if (path.endsWith("/export")) {
                    return "system:users:export";
                }
                return "system:users:view";
            }
            if (HttpMethod.POST.equals(method)) {
                if (path.endsWith("/reset-password")) {
                    return "system:users:reset-pwd";
                }
                return "system:users:create";
            }
            if (HttpMethod.PUT.equals(method) || HttpMethod.PATCH.equals(method)) {
                return "system:users:edit";
            }
            if (HttpMethod.DELETE.equals(method)) {
                return "system:users:delete";
            }
            return null;
        }

        private static String resolveRoles(HttpMethod method, String path) {
            if (HttpMethod.GET.equals(method)) {
                if (path.endsWith("/export")) {
                    return "system:roles:export";
                }
                return "system:roles:view";
            }
            if (HttpMethod.POST.equals(method)) {
                if (path.endsWith("/permissions")) {
                    return "system:roles:assign-perms";
                }
                if (path.endsWith("/data-scope")) {
                    return "system:roles:assign-data-scope";
                }
                if (path.endsWith("/users")) {
                    return "system:roles:assign-users";
                }
                return "system:roles:create";
            }
            if (HttpMethod.PUT.equals(method) || HttpMethod.PATCH.equals(method)) {
                return "system:roles:edit";
            }
            if (HttpMethod.DELETE.equals(method)) {
                if (path.endsWith("/users")) {
                    return "system:roles:assign-users";
                }
                return "system:roles:delete";
            }
            return null;
        }

        private static String resolveMenus(HttpMethod method) {
            if (HttpMethod.GET.equals(method)) {
                return "system:menus:view";
            }
            if (HttpMethod.POST.equals(method)) {
                return "system:menus:create";
            }
            if (HttpMethod.PUT.equals(method) || HttpMethod.PATCH.equals(method)) {
                return "system:menus:edit";
            }
            if (HttpMethod.DELETE.equals(method)) {
                return "system:menus:delete";
            }
            return null;
        }

        private static String resolveDepartments(HttpMethod method) {
            if (HttpMethod.GET.equals(method)) {
                return "system:departments:view";
            }
            if (HttpMethod.POST.equals(method)) {
                return "system:departments:create";
            }
            if (HttpMethod.PUT.equals(method) || HttpMethod.PATCH.equals(method)) {
                return "system:departments:edit";
            }
            if (HttpMethod.DELETE.equals(method)) {
                return "system:departments:delete";
            }
            return null;
        }
    }
}
