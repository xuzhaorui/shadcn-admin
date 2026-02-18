package com.shadcn.admin.backend.common.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Component;

@Component
public class JwtTokenService {
    private final AuthProperties authProperties;

    public JwtTokenService(AuthProperties authProperties) {
        this.authProperties = authProperties;
    }

    public String generateToken(AuthUser authUser) {
        Instant now = Instant.now();
        Instant exp = now.plusSeconds(authProperties.getTokenExpireSeconds());
        return Jwts.builder()
                .subject(authUser.userId())
                .claim("username", authUser.username())
                .claim("permissions", authUser.permissions())
                .issuedAt(Date.from(now))
                .expiration(Date.from(exp))
                .signWith(secretKey())
                .compact();
    }

    @SuppressWarnings("unchecked")
    public AuthUser parse(String token) {
        Claims claims = Jwts.parser().verifyWith(secretKey()).build().parseSignedClaims(token).getPayload();
        List<String> permissions = (List<String>) claims.get("permissions");
        return new AuthUser(claims.getSubject(), String.valueOf(claims.get("username")), permissions);
    }

    private SecretKey secretKey() {
        String raw = authProperties.getJwtSecret();
        if (raw == null || raw.length() < 32) {
            throw new IllegalStateException("app.auth.jwt-secret must be at least 32 chars");
        }
        return Keys.hmacShaKeyFor(raw.getBytes(StandardCharsets.UTF_8));
    }
}
