package com.shadcn.admin.backend.infra.web;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shadcn.admin.backend.common.auth.AuthProperties;
import com.shadcn.admin.backend.common.auth.AuthUser;
import com.shadcn.admin.backend.common.auth.JwtTokenService;
import com.shadcn.admin.backend.modules.monitor.online.service.OnlineSessionRegistry;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

@ExtendWith(MockitoExtension.class)
class JwtAuthWebFilterIntegrationTest {

    @Mock
    private JwtTokenService jwtTokenService;

    @Mock
    private OnlineSessionRegistry onlineSessionRegistry;

    private JwtAuthWebFilter filter;

    @BeforeEach
    void setUp() {
        AuthProperties authProperties = new AuthProperties();
        authProperties.setAccessCookieName("access_token");
        authProperties.setRefreshCookieName("refresh_token");
        filter = new JwtAuthWebFilter(jwtTokenService, new ObjectMapper(), onlineSessionRegistry, authProperties);
    }

    @Test
    void shouldReturn401WhenTokenMissing() {
        ServerWebExchange exchange = MockServerWebExchange.from(MockServerHttpRequest.get("/api/system/users/list").build());

        AtomicBoolean chainCalled = new AtomicBoolean(false);
        WebFilterChain chain = (e) -> {
            chainCalled.set(true);
            return Mono.empty();
        };

        StepVerifier.create(filter.filter(exchange, chain)).verifyComplete();

        assertEquals(HttpStatus.UNAUTHORIZED, exchange.getResponse().getStatusCode());
        assertFalse(chainCalled.get());
    }

    @Test
    void shouldReturn403WhenPermissionMissing() {
        String token = "token-no-users-view";
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/system/users/list")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        when(onlineSessionRegistry.isTokenBlocked(token)).thenReturn(false);
        when(jwtTokenService.parseAccessToken(token))
                .thenReturn(new AuthUser("u1", "alice", List.of("system:roles:view"), List.of("user")));

        AtomicBoolean chainCalled = new AtomicBoolean(false);
        WebFilterChain chain = (e) -> {
            chainCalled.set(true);
            return Mono.empty();
        };

        StepVerifier.create(filter.filter(exchange, chain)).verifyComplete();

        assertEquals(HttpStatus.FORBIDDEN, exchange.getResponse().getStatusCode());
        assertFalse(chainCalled.get());
    }

    @Test
    void shouldPassWhenPermissionGrantedAndAttachAuthUser() {
        String token = "token-users-view";
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/system/users/list")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        AuthUser parsed = new AuthUser("u1", "alice", List.of("system:users:view"), List.of("user"));
        when(onlineSessionRegistry.isTokenBlocked(token)).thenReturn(false);
        when(jwtTokenService.parseAccessToken(token)).thenReturn(parsed);

        AtomicBoolean chainCalled = new AtomicBoolean(false);
        WebFilterChain chain = (e) -> {
            chainCalled.set(true);
            return Mono.empty();
        };

        StepVerifier.create(filter.filter(exchange, chain)).verifyComplete();

        assertTrue(chainCalled.get());
        assertNotNull(exchange.getAttribute(JwtAuthWebFilter.AUTH_USER_ATTR));
        assertEquals(parsed, exchange.getAttribute(JwtAuthWebFilter.AUTH_USER_ATTR));
        verify(onlineSessionRegistry).touchByToken(token);
    }

    @Test
    void shouldProtectAssignDataScopeEndpointByPermission() {
        String token = "token-missing-data-scope-permission";
        MockServerHttpRequest request = MockServerHttpRequest.post("/api/system/roles/1/data-scope")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        when(onlineSessionRegistry.isTokenBlocked(token)).thenReturn(false);
        when(jwtTokenService.parseAccessToken(token))
                .thenReturn(new AuthUser("u1", "alice", List.of("system:roles:view"), List.of("user")));

        AtomicBoolean chainCalled = new AtomicBoolean(false);
        WebFilterChain chain = (e) -> {
            chainCalled.set(true);
            return Mono.empty();
        };

        StepVerifier.create(filter.filter(exchange, chain)).verifyComplete();

        assertEquals(HttpStatus.FORBIDDEN, exchange.getResponse().getStatusCode());
        assertFalse(chainCalled.get());
    }
}
