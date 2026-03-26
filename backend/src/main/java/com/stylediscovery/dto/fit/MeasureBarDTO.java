package com.stylediscovery.dto.fit;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Same as {@link MeasurementPointDTO} plus acceptable band (cm) for visualization.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MeasureBarDTO {
    private double body;
    private double garment;
    private double diffPercent;
    private double rawDiffPercent;
    private String status;
    private double weight;
    private double dimensionScore;
    private double rangeMinCm;
    private double rangeMaxCm;
}
