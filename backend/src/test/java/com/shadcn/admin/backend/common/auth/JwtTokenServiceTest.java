package com.shadcn.admin.backend.common.auth;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class JwtTokenServiceTest {
    private JwtTokenService jwtTokenService;

    @BeforeEach
    void setUp() {
        AuthProperties properties = new AuthProperties();
        properties.setJwtSecret("0123456789abcdef0123456789abcdef");
        properties.setTokenExpireSeconds(1800);
        properties.setRefreshTokenExpireSeconds(86400);
        jwtTokenService = new JwtTokenService(properties);
    }

    @Test
    void shouldParseAccessTokenSuccessfully() {
        AuthUser authUser = new AuthUser("u-1", "alice", List.of("system:users:view"), List.of("admin"));
        String accessToken = jwtTokenService.generateAccessToken(authUser);

        AuthUser parsed = jwtTokenService.parseAccessToken(accessToken);

        assertEquals("u-1", parsed.userId());
        assertEquals("alice", parsed.username());
        assertEquals(List.of("system:users:view"), parsed.permissions());
        assertEquals(List.of("admin"), parsed.roleNames());
    }

    @Test
    void shouldRejectRefreshTokenWhenParsingAsAccessToken() {
        JwtTokenService.RefreshTokenClaims refreshToken = jwtTokenService.generateRefreshToken("u-1", "alice");

        assertThrows(IllegalArgumentException.class, () -> jwtTokenService.parseAccessToken(refreshToken.token()));
    }

    @Test
    void shouldRejectAccessTokenWhenParsingAsRefreshToken() {
        AuthUser authUser = new AuthUser("u-1", "alice", List.of("system:users:view"), List.of("admin"));
        String accessToken = jwtTokenService.generateAccessToken(authUser);

        assertThrows(IllegalArgumentException.class, () -> jwtTokenService.parseRefreshToken(accessToken));
    }

    @Test
    void shouldParseRefreshTokenSuccessfully() {
        JwtTokenService.RefreshTokenClaims refreshToken = jwtTokenService.generateRefreshToken("u-2", "bob");

        JwtTokenService.ParsedRefreshToken parsed =
                assertDoesNotThrow(() -> jwtTokenService.parseRefreshToken(refreshToken.token()));

        assertEquals("u-2", parsed.userId());
        assertEquals("bob", parsed.username());
        assertEquals(refreshToken.jti(), parsed.jti());
    }
}
