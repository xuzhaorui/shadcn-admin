package com.shadcn.admin.backend.modules.monitor.online.service;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.github.benmanes.caffeine.cache.Expiry;
import com.shadcn.admin.backend.common.api.PageResponse;
import com.shadcn.admin.backend.common.exception.BusinessException;
import com.shadcn.admin.backend.modules.monitor.online.dto.OnlineUserDTO;
import com.shadcn.admin.backend.modules.monitor.online.dto.OnlineUserListQuery;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.concurrent.TimeUnit;
import org.springframework.stereotype.Component;

@Component
public class OnlineSessionRegistry {
    private static final long MAX_ONLINE_SESSIONS = 300_000L;
    private static final long MAX_BLOCKED_TOKENS = 500_000L;

    private final Cache<String, SessionRecord> sessionsBySessionId = Caffeine.newBuilder()
            .maximumSize(MAX_ONLINE_SESSIONS)
            .expireAfter(new SessionRecordExpiry())
            .build();
    private final Cache<String, SessionRecord> sessionsByTokenHash = Caffeine.newBuilder()
            .maximumSize(MAX_ONLINE_SESSIONS)
            .expireAfter(new SessionRecordExpiry())
            .build();
    private final Cache<String, Long> blockedTokenExpiryEpochMillisByHash = Caffeine.newBuilder()
            .maximumSize(MAX_BLOCKED_TOKENS)
            .expireAfter(new ExpireAtEpochMillis())
            .build();

    public void registerSession(
            String token,
            String userId,
            String username,
            String deptName,
            String ip,
            String userAgent,
            long expireSeconds) {
        String tokenHash = tokenHash(token);
        String sessionId = java.util.UUID.randomUUID().toString();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expireAt = now.plusSeconds(Math.max(expireSeconds, 1));
        SessionRecord record = new SessionRecord(
                sessionId,
                tokenHash,
                userId,
                username,
                normalizeDeptName(deptName),
                normalizeIp(ip),
                "unknown",
                detectBrowser(userAgent),
                detectOs(userAgent),
                now,
                now,
                expireAt,
                "online");

        sessionsBySessionId.put(sessionId, record);
        sessionsByTokenHash.put(tokenHash, record);
    }

    public boolean isTokenBlocked(String token) {
        String tokenHash = tokenHash(token);
        Long expireAt = blockedTokenExpiryEpochMillisByHash.getIfPresent(tokenHash);
        return expireAt != null && expireAt > System.currentTimeMillis();
    }

    public void touchByToken(String token) {
        String tokenHash = tokenHash(token);
        SessionRecord record = sessionsByTokenHash.getIfPresent(tokenHash);
        if (record == null || !"online".equals(record.status())) {
            return;
        }

        SessionRecord updated = record.withLastActiveAt(LocalDateTime.now());
        sessionsBySessionId.put(updated.sessionId(), updated);
        sessionsByTokenHash.put(updated.tokenHash(), updated);
    }

    public PageResponse<OnlineUserDTO> list(OnlineUserListQuery query) {
        cleanup();
        String username = normalizeKeyword(query.getUsername());
        String ip = normalizeKeyword(query.getIp());

        List<SessionRecord> all = sessionsBySessionId.asMap().values().stream()
                .filter(v -> "online".equals(v.status()))
                .filter(v -> username == null || v.username().toLowerCase(Locale.ROOT).contains(username))
                .filter(v -> ip == null || v.ip().toLowerCase(Locale.ROOT).contains(ip))
                .sorted(Comparator.comparing(SessionRecord::loginTime).reversed())
                .toList();

        return buildPageResponse(all, query);
    }

    public void forceLogout(String sessionId) {
        cleanup();
        SessionRecord record = sessionsBySessionId.getIfPresent(sessionId);
        if (record == null) {
            throw new BusinessException(404, "online session not found");
        }

        blockTokenUntil(record.tokenHash(), toEpochMillis(record.expireAt()));
        removeSession(record);
    }

    public void revokeToken(String token, long tokenExpireSeconds) {
        String tokenHash = tokenHash(token);
        if (tokenHash.isBlank()) {
            return;
        }

        SessionRecord record = sessionsByTokenHash.getIfPresent(tokenHash);
        if (record != null) {
            blockTokenUntil(tokenHash, toEpochMillis(record.expireAt()));
            removeSession(record);
            return;
        }

        long ttlMillis = Math.max(tokenExpireSeconds, 1) * 1000;
        blockTokenUntil(tokenHash, System.currentTimeMillis() + ttlMillis);
    }

    private PageResponse<OnlineUserDTO> buildPageResponse(List<SessionRecord> all, OnlineUserListQuery query) {
        int page = Math.max(query.getPage(), 1);
        int pageSize = Math.max(query.getPageSize(), 1);
        int from = Math.min((page - 1) * pageSize, all.size());
        int to = Math.min(from + pageSize, all.size());

        List<OnlineUserDTO> list = new ArrayList<>();
        for (SessionRecord record : all.subList(from, to)) {
            list.add(new OnlineUserDTO(
                    record.sessionId(),
                    record.username(),
                    record.deptName(),
                    record.ip(),
                    record.location(),
                    record.browser(),
                    record.os(),
                    record.loginTime()));
        }

        return new PageResponse<>(list, all.size(), page, pageSize);
    }

    private void removeSession(SessionRecord record) {
        sessionsBySessionId.invalidate(record.sessionId());
        sessionsByTokenHash.invalidate(record.tokenHash());
    }

    private void blockTokenUntil(String tokenHash, long expireEpochMillis) {
        if (expireEpochMillis <= System.currentTimeMillis()) {
            blockedTokenExpiryEpochMillisByHash.invalidate(tokenHash);
            return;
        }
        blockedTokenExpiryEpochMillisByHash.put(tokenHash, expireEpochMillis);
    }

    private void cleanup() {
        sessionsBySessionId.cleanUp();
        sessionsByTokenHash.cleanUp();
        blockedTokenExpiryEpochMillisByHash.cleanUp();
    }

    private long toEpochMillis(LocalDateTime time) {
        return time.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();
    }

    private String normalizeKeyword(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeDeptName(String deptName) {
        if (deptName == null || deptName.isBlank()) {
            return "-";
        }
        return deptName;
    }

    private String normalizeIp(String ip) {
        if (ip == null || ip.isBlank()) {
            return "unknown";
        }
        return ip;
    }

    private String detectBrowser(String ua) {
        if (ua == null) {
            return "Unknown";
        }
        String value = ua.toLowerCase(Locale.ROOT);
        if (value.contains("edg/")) {
            return "Edge";
        }
        if (value.contains("chrome/") && !value.contains("edg/")) {
            return "Chrome";
        }
        if (value.contains("firefox/")) {
            return "Firefox";
        }
        if (value.contains("safari/") && !value.contains("chrome/")) {
            return "Safari";
        }
        return "Unknown";
    }

    private String detectOs(String ua) {
        if (ua == null) {
            return "Unknown";
        }
        String value = ua.toLowerCase(Locale.ROOT);
        if (value.contains("windows")) {
            return "Windows";
        }
        if (value.contains("mac os")) {
            return "macOS";
        }
        if (value.contains("linux")) {
            return "Linux";
        }
        if (value.contains("android")) {
            return "Android";
        }
        if (value.contains("iphone") || value.contains("ios")) {
            return "iOS";
        }
        return "Unknown";
    }

    private String tokenHash(String token) {
        if (token == null || token.isBlank()) {
            return "";
        }
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 algorithm unavailable", ex);
        }
    }

    private static long nanosUntil(long expireEpochMillis) {
        long remainingMillis = Math.max(expireEpochMillis - System.currentTimeMillis(), 1L);
        return TimeUnit.MILLISECONDS.toNanos(remainingMillis);
    }

    private static final class ExpireAtEpochMillis implements Expiry<String, Long> {
        @Override
        public long expireAfterCreate(String key, Long expireEpochMillis, long currentTime) {
            return nanosUntil(expireEpochMillis == null ? 0L : expireEpochMillis);
        }

        @Override
        public long expireAfterUpdate(String key, Long expireEpochMillis, long currentTime, long currentDuration) {
            return nanosUntil(expireEpochMillis == null ? 0L : expireEpochMillis);
        }

        @Override
        public long expireAfterRead(String key, Long expireEpochMillis, long currentTime, long currentDuration) {
            return nanosUntil(expireEpochMillis == null ? 0L : expireEpochMillis);
        }
    }

    private static final class SessionRecordExpiry implements Expiry<String, SessionRecord> {
        @Override
        public long expireAfterCreate(String key, SessionRecord value, long currentTime) {
            return nanosUntil(value == null ? 0L : value.expireAtEpochMillis());
        }

        @Override
        public long expireAfterUpdate(String key, SessionRecord value, long currentTime, long currentDuration) {
            return nanosUntil(value == null ? 0L : value.expireAtEpochMillis());
        }

        @Override
        public long expireAfterRead(String key, SessionRecord value, long currentTime, long currentDuration) {
            return nanosUntil(value == null ? 0L : value.expireAtEpochMillis());
        }
    }

    private static record SessionRecord(
            String sessionId,
            String tokenHash,
            String userId,
            String username,
            String deptName,
            String ip,
            String location,
            String browser,
            String os,
            LocalDateTime loginTime,
            LocalDateTime lastActiveAt,
            LocalDateTime expireAt,
            String status) {
        SessionRecord {
            Objects.requireNonNull(sessionId);
            Objects.requireNonNull(tokenHash);
            Objects.requireNonNull(userId);
            Objects.requireNonNull(username);
            Objects.requireNonNull(deptName);
            Objects.requireNonNull(ip);
            Objects.requireNonNull(location);
            Objects.requireNonNull(browser);
            Objects.requireNonNull(os);
            Objects.requireNonNull(loginTime);
            Objects.requireNonNull(lastActiveAt);
            Objects.requireNonNull(expireAt);
            Objects.requireNonNull(status);
        }

        SessionRecord withLastActiveAt(LocalDateTime value) {
            return new SessionRecord(
                    sessionId,
                    tokenHash,
                    userId,
                    username,
                    deptName,
                    ip,
                    location,
                    browser,
                    os,
                    loginTime,
                    value,
                    expireAt,
                    status);
        }

        long expireAtEpochMillis() {
            return expireAt.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();
        }
    }
}
