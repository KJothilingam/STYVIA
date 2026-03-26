package com.stylediscovery.dto.fit;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Per-axis fit detail: geometric diff, stretch-adjusted diff used in scoring, and clamped dimension score.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MeasurementPointDTO {
    private double body;
    private double garment;
    /** Stretch-adjusted absolute percentage difference used in score = 100 − diffPercent × axisWeight. */
    private double diffPercent;
    /** abs(body − garment) / body × 100 before stretch factor. */
    private double rawDiffPercent;
    /** GOOD | TIGHT | LOOSE from signed percent vs tolerance band (includes fit-preference tolerance). */
    private String status;
    /** Axis weight in composite score (0.4 chest, 0.3 shoulder, 0.2 waist, 0.1 length). */
    private double weight;
    private double dimensionScore;
}
