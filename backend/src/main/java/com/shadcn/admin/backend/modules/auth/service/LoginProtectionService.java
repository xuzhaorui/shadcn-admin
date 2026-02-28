package com.shadcn.admin.backend.modules.auth.service;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import java.time.Duration;
import java.util.Locale;
import org.springframework.stereotype.Component;

@Component
public class LoginProtectionService {
    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int MAX_ATTEMPTS_PER_MINUTE = 30;
    private static final long LOCK_MILLIS = Duration.ofMinutes(15).toMillis();
    private static final long WINDOW_MILLIS = Duration.ofMinutes(1).toMillis();

    private final Cache<String, Integer> failureCountByAccount = Caffeine.newBuilder()
            .maximumSize(200_000)
            .expireAfterWrite(Duration.ofMillis(LOCK_MILLIS))
            .build();
    private final Cache<String, Long> lockUntilByAccount = Caffeine.newBuilder()
            .maximumSize(200_000)
            .expireAfterWrite(Duration.ofMillis(LOCK_MILLIS))
            .build();
    private final Cache<String, WindowState> windowByAccountIp = Caffeine.newBuilder()
            .maximumSize(300_000)
            .expireAfterWrite(Duration.ofMillis(WINDOW_MILLIS * 2))
            .build();

    public void checkAllowed(String account, String ip) {
        String accountKey = accountKey(account);
        String rateKey = rateKey(account, ip);

        if (lockUntilByAccount.getIfPresent(accountKey) != null) {
            throw new TooManyLoginAttemptsException("account locked, try again later");
        }

        long now = System.currentTimeMillis();
        WindowState current = windowByAccountIp.asMap().compute(rateKey, (k, existing) -> {
            if (existing == null || now - existing.windowStartMillis() > WINDOW_MILLIS) {
                return new WindowState(now, 1);
            }
            return new WindowState(existing.windowStartMillis(), existing.count() + 1);
        });

        if (current != null && current.count() > MAX_ATTEMPTS_PER_MINUTE) {
            throw new TooManyLoginAttemptsException("too many login attempts, try again later");
        }
    }

    public void onSuccess(String account) {
        String key = accountKey(account);
        failureCountByAccount.invalidate(key);
        lockUntilByAccount.invalidate(key);
    }

    public void onFailure(String account) {
        String key = accountKey(account);
        int count = failureCountByAccount.asMap().merge(key, 1, Integer::sum);
        if (count >= MAX_FAILED_ATTEMPTS) {
            lockUntilByAccount.put(key, System.currentTimeMillis() + LOCK_MILLIS);
            failureCountByAccount.invalidate(key);
        }
    }

    private String accountKey(String account) {
        return String.valueOf(account).trim().toLowerCase(Locale.ROOT);
    }

    private String rateKey(String account, String ip) {
        return accountKey(account) + "|" + String.valueOf(ip).trim();
    }

    private record WindowState(long windowStartMillis, int count) {}

    public static class TooManyLoginAttemptsException extends RuntimeException {
        public TooManyLoginAttemptsException(String message) {
            super(message);
        }
    }
}
