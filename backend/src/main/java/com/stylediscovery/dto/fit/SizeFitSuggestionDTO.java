package com.stylediscovery.dto.fit;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SizeFitSuggestionDTO {
    private String size;
    private double confidence;
    private String note;
}
