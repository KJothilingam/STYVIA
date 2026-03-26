package com.stylediscovery.service;

import com.stylediscovery.exception.TooManyRequestsException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.util.concurrent.ConcurrentHashMap;

/**
 * Fixed-window per-minute counter (single-node). Use Redis implementation for multi-instance production.
 */
@Component
@ConditionalOnMissingBean(StringRedisTemplate.class)
public class InMemoryUserRequestRateLimiter implements UserRequestRateLimiter {

    private final int maxPerMinute;
    private final ConcurrentHashMap<String, WindowCounter> windows = new ConcurrentHashMap<>();

    public InMemoryUserRequestRateLimiter(
            @Value("${app.rate-limit.requests-per-minute:50}") int maxPerMinute) {
        this.maxPerMinute = maxPerMinute;
    }

    @Override
    public void checkAllowed(Long userId, String clientIp) {
        long window = System.currentTimeMillis() / 60_000L;
        String subject = userId != null ? "u:" + userId : "a:" + (clientIp == null || clientIp.isBlank() ? "unknown" : clientIp.replace(':', '_'));
        String key = subject + ":" + window;
        int n = windows.compute(key, (k, existing) -> {
            if (existing == null || existing.window != window) {
                return new WindowCounter(window, 1);
            }
            existing.count++;
            return existing;
        }).count;
        if (n > maxPerMinute) {
            throw new TooManyRequestsException("Rate limit exceeded: max " + maxPerMinute + " requests per minute.");
        }
        if (windows.size() > 50_000) {
            windows.entrySet().removeIf(e -> e.getValue().window < window - 2);
        }
    }

    private static final class WindowCounter {
        final long window;
        int count;

        WindowCounter(long window, int count) {
            this.window = window;
            this.count = count;
        }
    }
}
