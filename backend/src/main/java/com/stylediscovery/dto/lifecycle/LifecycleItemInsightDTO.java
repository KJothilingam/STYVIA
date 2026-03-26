package com.stylediscovery.dto.lifecycle;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LifecycleItemInsightDTO {
    private Long wardrobeItemId;
    private Long productId;
    private String productName;
    private double baselineFitConfidence;
    private double simulatedFitNow;
    private int monthsOwned;
    private int wearCount;
    private String wearFrequencyLabel;
    private String narrative;
}
