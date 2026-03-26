package com.stylediscovery.dto.fit;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SizeScoreBreakdownDTO {
    private String size;
    /** Blended rule + ML (or rule-only if ML unavailable). */
    private double score;
    /** Rule-based score: physics + historical intelligence (before ML blend). */
    private Double ruleScore;
    /** ML score = probability × 100 when model responded; null if ML off/unavailable. */
    private Double mlScore;
    private Double finalScore;
    /** Weighted measurement composite (no silhouette bonus). */
    private Double baseScore;
    /** Measurement composite + silhouette/preference bonus, before historical intelligence. */
    private Double physicsScore;
    private Double intelligenceFeedbackDelta;
    private Double intelligenceReturnDelta;
    private Double intelligenceUsageDelta;
    private String reason;
    /** Short hybrid explainability (rules vs ML vs similar users). Serialized as "explanation" for API clients. */
    @JsonProperty("explanation")
    private String hybridBlendExplanation;
    /** Line-by-line math trace for this size. */
    private String hybridExplanation;
    private SizeMeasurementsBreakdownDTO measurements;
}
