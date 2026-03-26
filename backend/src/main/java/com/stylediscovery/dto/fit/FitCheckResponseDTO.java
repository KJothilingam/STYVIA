package com.stylediscovery.dto.fit;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FitCheckResponseDTO {
    private String fit;
    private int confidence;
    private String message;
    private List<String> issues;
    private String suggestedSize;
    private FitCheckComparisonDTO comparison;
}
