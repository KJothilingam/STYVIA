package com.stylediscovery.service;

public interface UserRequestRateLimiter {

    /**
     * @param userId authenticated user id, or null for anonymous (IP-based bucket)
     * @param clientIp best-effort client IP (after trusted proxies if configured)
     */
    void checkAllowed(Long userId, String clientIp);
}
