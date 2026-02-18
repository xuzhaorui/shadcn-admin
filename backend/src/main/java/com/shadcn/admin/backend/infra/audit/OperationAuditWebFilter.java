package com.shadcn.admin.backend.infra.audit;

import com.shadcn.admin.backend.common.auth.AuthUser;
import com.shadcn.admin.backend.infra.web.JwtAuthWebFilter;
import java.net.InetSocketAddress;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

@Component
@Order(Ordered.LOWEST_PRECEDENCE - 10)
public class OperationAuditWebFilter implements WebFilter {
    private final AuditService auditService;

    public OperationAuditWebFilter(AuditService auditService) {
        this.auditService = auditService;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        HttpMethod method = request.getMethod();
        String path = request.getPath().value();
        if (!shouldAudit(method, path)) {
            return chain.filter(exchange);
        }

        return chain.filter(exchange).doFinally(signalType -> {
            AuthUser authUser = exchange.getAttribute(JwtAuthWebFilter.AUTH_USER_ATTR);
            String username = authUser == null ? "anonymous" : authUser.username();
            String ip = resolveIp(request);
            HttpStatusCode code = exchange.getResponse().getStatusCode();
            String status = (code != null && code.is2xxSuccessful()) ? "success" : "failed";
            String action = method + " " + path;
            auditService.recordOperation(username, action, ip, status).subscribe();
        });
    }

    private boolean shouldAudit(HttpMethod method, String path) {
        if (method == null || HttpMethod.GET.equals(method) || HttpMethod.OPTIONS.equals(method)) {
            return false;
        }
        if (!path.startsWith("/api/system/")) {
            return false;
        }
        return !path.startsWith("/api/system/logs");
    }

    private String resolveIp(ServerHttpRequest request) {
        InetSocketAddress remote = request.getRemoteAddress();
        if (remote == null || remote.getAddress() == null) {
            return "unknown";
        }
        return String.valueOf(remote.getAddress().getHostAddress());
    }
}
