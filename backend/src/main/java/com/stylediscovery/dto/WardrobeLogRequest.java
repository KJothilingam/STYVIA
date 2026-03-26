package com.stylediscovery.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class WardrobeLogRequest {
    @NotNull
    private Long wardrobeItemId;
    @NotBlank
    private String event;
    private String notes;
}
