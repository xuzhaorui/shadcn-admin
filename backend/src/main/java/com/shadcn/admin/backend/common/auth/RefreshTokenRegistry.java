package com.shadcn.admin.backend.common.auth;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.github.benmanes.caffeine.cache.Expiry;
import java.time.Duration;
import java.util.concurrent.TimeUnit;
import org.springframework.stereotype.Component;

@Component
public class RefreshTokenRegistry {
    private static final long MAX_ENTRIES = 500_000L;

    private final Cache<String, Long> validTokenExpiryByJti = Caffeine.newBuilder()
            .maximumSize(MAX_ENTRIES)
            .expireAfter(new ExpireAtEpochMillis())
            .build();

    public void register(String jti, long expireEpochMillis) {
        if (expireEpochMillis <= System.currentTimeMillis()) {
            validTokenExpiryByJti.invalidate(jti);
            return;
        }
        validTokenExpiryByJti.put(jti, expireEpochMillis);
    }

    public boolean consume(String jti) {
        Long expireAt = validTokenExpiryByJti.asMap().remove(jti);
        if (expireAt == null) {
            return false;
        }
        return expireAt > System.currentTimeMillis();
    }

    public void revoke(String jti) {
        validTokenExpiryByJti.invalidate(jti);
    }

    public void cleanup() {
        validTokenExpiryByJti.cleanUp();
    }

    public long toEpochMillis(Duration duration) {
        return System.currentTimeMillis() + duration.toMillis();
    }

    private static long nanosUntilExpiry(long expireEpochMillis) {
        long remainingMillis = Math.max(expireEpochMillis - System.currentTimeMillis(), 1L);
        return TimeUnit.MILLISECONDS.toNanos(remainingMillis);
    }

    private static final class ExpireAtEpochMillis implements Expiry<String, Long> {
        @Override
        public long expireAfterCreate(String key, Long expireEpochMillis, long currentTime) {
            return nanosUntilExpiry(expireEpochMillis == null ? 0L : expireEpochMillis);
        }

        @Override
        public long expireAfterUpdate(String key, Long expireEpochMillis, long currentTime, long currentDuration) {
            return nanosUntilExpiry(expireEpochMillis == null ? 0L : expireEpochMillis);
        }

        @Override
        public long expireAfterRead(String key, Long expireEpochMillis, long currentTime, long currentDuration) {
            return nanosUntilExpiry(expireEpochMillis == null ? 0L : expireEpochMillis);
        }
    }
}
