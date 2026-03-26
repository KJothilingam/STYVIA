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
public class FitConfidenceResponseDTO {
    private String recommendedSize;
    /** Blended top score (same as confidence for backward compatibility). */
    private double confidence;
    /** Rule-only score for recommended size (before ML blend). */
    private Double recommendedRuleScore;
    /** ML layer score for recommended size (probability × 100), if available. */
    private Double recommendedMlScore;
    /** Blended score = ruleWeight×rule + mlWeight×ML. */
    private Double recommendedHybridScore;
    private String explanation;
    /** High-level hybrid intelligence note. */
    private String hybridExplanation;
    private List<String> intelligenceExplanations;
    private List<SizeScoreBreakdownDTO> breakdown;
    private List<SizeFitSuggestionDTO> allSizes;
    private List<String> whyThisSizeReasons;
    /** Recommended size only: same structure as frontend MeasurementComparison with cm bands. */
    private MeasurementComparisonDTO measurementComparison;
}
