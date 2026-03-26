package com.stylediscovery.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.stylediscovery.dto.error.ApiErrorResponse;
import com.stylediscovery.exception.TooManyRequestsException;
import com.stylediscovery.service.UserRequestRateLimiter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;

/**
 * Per-user (or per-IP if anonymous) fixed-window rate limit; see {@link UserRequestRateLimiter}.
 */
@Component
@Order(20)
@RequiredArgsConstructor
public class UserRateLimitFilter extends OncePerRequestFilter {

    private final UserRequestRateLimiter userRequestRateLimiter;
    private final ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();
        if (!path.startsWith("/api/v1/") || "OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }
        if (path.startsWith("/api/v1/auth/")) {
            filterChain.doFilter(request, response);
            return;
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserPrincipal up)) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            userRequestRateLimiter.checkAllowed(up.getId(), clientIp(request));
        } catch (TooManyRequestsException e) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json;charset=UTF-8");
            ApiErrorResponse body = ApiErrorResponse.builder()
                    .success(false)
                    .status(HttpStatus.TOO_MANY_REQUESTS.value())
                    .code("RATE_LIMITED")
                    .message(e.getMessage())
                    .timestamp(Instant.now())
                    .build();
            objectMapper.writeValue(response.getWriter(), body);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private static String clientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
