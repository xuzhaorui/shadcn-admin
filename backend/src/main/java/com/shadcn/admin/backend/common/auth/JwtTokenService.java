package com.shadcn.admin.backend.common.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.UUID;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Component;

@Component
public class JwtTokenService {
    private final AuthProperties authProperties;

    public JwtTokenService(AuthProperties authProperties) {
        this.authProperties = authProperties;
    }

    public String generateAccessToken(AuthUser authUser) {
        Instant now = Instant.now();
        Instant exp = now.plusSeconds(authProperties.getTokenExpireSeconds());
        return Jwts.builder()
                .subject(authUser.userId())
                .claim("tokenType", "access")
                .claim("username", authUser.username())
                .claim("permissions", authUser.permissions())
                .claim("roleNames", authUser.roleNames())
                .issuedAt(Date.from(now))
                .expiration(Date.from(exp))
                .signWith(secretKey())
                .compact();
    }

    public RefreshTokenClaims generateRefreshToken(String userId, String username) {
        Instant now = Instant.now();
        Instant exp = now.plusSeconds(authProperties.getRefreshTokenExpireSeconds());
        String jti = UUID.randomUUID().toString();
        String token = Jwts.builder()
                .id(jti)
                .subject(userId)
                .claim("tokenType", "refresh")
                .claim("username", username)
                .issuedAt(Date.from(now))
                .expiration(Date.from(exp))
                .signWith(secretKey())
                .compact();
        return new RefreshTokenClaims(token, jti, exp.toEpochMilli());
    }

    @SuppressWarnings("unchecked")
    public AuthUser parseAccessToken(String token) {
        Claims claims = Jwts.parser().verifyWith(secretKey()).build().parseSignedClaims(token).getPayload();
        if (!"access".equals(String.valueOf(claims.get("tokenType")))) {
            throw new IllegalArgumentException("invalid token type");
        }
        List<String> permissions = (List<String>) claims.get("permissions");
        List<String> roleNames = (List<String>) claims.get("roleNames");
        return new AuthUser(claims.getSubject(), String.valueOf(claims.get("username")), permissions, roleNames);
    }

    public ParsedRefreshToken parseRefreshToken(String token) {
        Claims claims = Jwts.parser().verifyWith(secretKey()).build().parseSignedClaims(token).getPayload();
        if (!"refresh".equals(String.valueOf(claims.get("tokenType")))) {
            throw new IllegalArgumentException("invalid token type");
        }
        String jti = claims.getId();
        if (jti == null || jti.isBlank()) {
            throw new IllegalArgumentException("invalid refresh token");
        }
        String userId = claims.getSubject();
        String username = String.valueOf(claims.get("username"));
        Date expiration = claims.getExpiration();
        if (expiration == null) {
            throw new IllegalArgumentException("invalid refresh token expiry");
        }
        return new ParsedRefreshToken(jti, userId, username, expiration.toInstant().toEpochMilli());
    }

    public Duration accessTtl() {
        return Duration.ofSeconds(authProperties.getTokenExpireSeconds());
    }

    public Duration refreshTtl() {
        return Duration.ofSeconds(authProperties.getRefreshTokenExpireSeconds());
    }

    private SecretKey secretKey() {
        String raw = authProperties.getJwtSecret();
        if (raw == null || raw.length() < 32) {
            throw new IllegalStateException("app.auth.jwt-secret must be at least 32 chars");
        }
        return Keys.hmacShaKeyFor(raw.getBytes(StandardCharsets.UTF_8));
    }

    public record ParsedRefreshToken(String jti, String userId, String username, long expireEpochMillis) {}

    public record RefreshTokenClaims(String token, String jti, long expireEpochMillis) {}
}
