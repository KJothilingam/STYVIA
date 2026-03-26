package com.stylediscovery.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AssistantChatRequest {
    @NotBlank
    private String message;
}
