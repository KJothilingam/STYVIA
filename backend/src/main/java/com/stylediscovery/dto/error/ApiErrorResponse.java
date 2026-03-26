package com.stylediscovery.dto.error;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;

/**
 * Standard API error envelope (aligned with {@link com.stylediscovery.dto.ApiResponse} success shape).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiErrorResponse {

    @Builder.Default
    private boolean success = false;

    private int status;
    private String code;
    private String message;
    private Instant timestamp;
    /** Field-level validation messages. */
    private Map<String, String> details;
}
