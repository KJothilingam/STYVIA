package com.stylediscovery.service;

import com.stylediscovery.exception.TooManyRequestsException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
@ConditionalOnBean(StringRedisTemplate.class)
public class RedisUserRequestRateLimiter implements UserRequestRateLimiter {

    private final StringRedisTemplate redis;
    private final int maxPerMinute;

    public RedisUserRequestRateLimiter(
            StringRedisTemplate redis,
            @Value("${app.rate-limit.requests-per-minute:50}") int maxPerMinute) {
        this.redis = redis;
        this.maxPerMinute = maxPerMinute;
    }

    @Override
    public void checkAllowed(Long userId, String clientIp) {
        long window = System.currentTimeMillis() / 60_000L;
        String subject = userId != null ? "u:" + userId : "a:" + safeIp(clientIp);
        String key = "ratelimit:" + subject + ":" + window;
        Long count = redis.opsForValue().increment(key);
        if (Long.valueOf(1L).equals(count)) {
            redis.expire(key, Duration.ofMinutes(2));
        }
        if (count != null && count > maxPerMinute) {
            throw new TooManyRequestsException("Rate limit exceeded: max " + maxPerMinute + " requests per minute.");
        }
    }

    private static String safeIp(String ip) {
        if (ip == null || ip.isBlank()) {
            return "unknown";
        }
        return ip.replace(':', '_');
    }
}
