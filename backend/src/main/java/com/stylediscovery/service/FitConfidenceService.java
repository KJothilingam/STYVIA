package com.stylediscovery.service;

import com.stylediscovery.config.MlFitProperties;
import com.stylediscovery.dto.fit.*;
import com.stylediscovery.dto.ml.MlPredictFitRequestDTO;
import com.stylediscovery.dto.ml.MlProductFeaturesDTO;
import com.stylediscovery.dto.ml.MlUserFeaturesDTO;
import com.stylediscovery.entity.BodyProfile;
import com.stylediscovery.entity.GarmentSizeSpec;
import com.stylediscovery.entity.Product;
import com.stylediscovery.enums.GarmentFitStyle;
import com.stylediscovery.enums.StretchLevel;
import com.stylediscovery.exception.ResourceNotFoundException;
import com.stylediscovery.repository.BodyProfileRepository;
import com.stylediscovery.repository.GarmentSizeSpecRepository;
import com.stylediscovery.repository.InventoryRepository;
import com.stylediscovery.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Explainable fit scoring: percentage difference per axis, stretch-adjusted diff,
 * per-axis score = clamp(100 − adjDiff% × axisWeight), composite = weighted sum of axis scores,
 * optional preference/silhouette bonus, clamp 0–100.
 */
@Service
@RequiredArgsConstructor
public class FitConfidenceService {

    private static final Logger log = LoggerFactory.getLogger(FitConfidenceService.class);

    /** Half-band (±%) for GOOD vs TIGHT/LOOSE; scaled by fit preference (SLIM −5%, LOOSE +5% on band). */
    private static final double REFERENCE_TOLERANCE_HALF_BAND_PCT = 5.0;

    private static final double W_CHEST = 0.4;
    private static final double W_SHOULDER = 0.3;
    private static final double W_WAIST = 0.2;
    private static final double W_LENGTH = 0.1;

    /**
     * When no size chart row exists, garment cm = bodyEstimate + step × (sizeIndex − medianIndex).
     * Steps are documented grading increments (not tuned multipliers on score).
     */
    private static final double GRADE_CHEST_CM_PER_STEP = 4.0;
    private static final double GRADE_SHOULDER_CM_PER_STEP = 1.2;
    private static final double GRADE_WAIST_CM_PER_STEP = 3.5;
    private static final double GRADE_LENGTH_CM_PER_STEP = 2.0;

    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;
    private final GarmentSizeSpecRepository garmentSizeSpecRepository;
    private final BodyProfileRepository bodyProfileRepository;
    private final BodyMeasurementEstimator bodyMeasurementEstimator;
    private final FitIntelligenceService fitIntelligenceService;
    private final MlFitClient mlFitClient;
    private final MlFitProperties mlFitProperties;

    @Transactional(readOnly = true)
    public FitConfidenceResponseDTO compute(Long userId, Long productId) {
        long t0 = System.nanoTime();
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        List<String> sizes = FitSizeOrdering.sortedCopy(inventoryRepository.findAvailableSizesByProductId(productId));
        if (sizes.isEmpty()) {
            log.warn("Fit confidence: no sizes in stock productId={} userId={}", productId, userId);
            return FitConfidenceResponseDTO.builder()
                    .recommendedSize(null)
                    .confidence(0)
                    .explanation("No sizes in stock for this product.")
                    .allSizes(List.of())
                    .breakdown(List.of())
                    .intelligenceExplanations(List.of("No inventory sizes with stock > 0."))
                    .whyThisSizeReasons(List.of())
                    .measurementComparison(null)
                    .build();
        }

        Optional<BodyProfile> profileOpt = bodyProfileRepository.findByUser_Id(userId);
        if (profileOpt.isEmpty()) {
            log.info("Fit confidence: missing body profile productId={} userId={}", productId, userId);
            return FitConfidenceResponseDTO.builder()
                    .recommendedSize(null)
                    .confidence(0)
                    .explanation("Add a body profile (height, weight, shape) in Settings to enable measurement-based fit scoring.")
                    .allSizes(emptySuggestions(sizes))
                    .breakdown(List.of())
                    .intelligenceExplanations(List.of(
                            "Fit engine requires BodyProfile: estimates use chest = 0.45×weight(kg) + 0.25×height(cm), etc."
                    ))
                    .whyThisSizeReasons(List.of())
                    .measurementComparison(null)
                    .build();
        }

        BodyProfile profile = profileOpt.get();
        BodyMeasurementEstimator.EstimatedBody body = bodyMeasurementEstimator.estimate(profile);
        StretchLevel stretch = product.getStretchLevel() != null ? product.getStretchLevel() : StretchLevel.MEDIUM;
        GarmentFitStyle silhouette = product.getGarmentFitStyle() != null ? product.getGarmentFitStyle() : GarmentFitStyle.REGULAR;
        double stretchFactor = stretchFactor(stretch);
        double toleranceScale = fitPreferenceToleranceScale(profile.getFitPreference());

        Map<String, GarmentSizeSpec> specByKey = garmentSizeSpecRepository.findByProduct_Id(productId).stream()
                .collect(Collectors.toMap(s -> FitSizeOrdering.normalizeKey(s.getSizeKey()), s -> s, (a, b) -> a));

        int medianIdx = sizes.size() / 2;

        FitIntelligenceService.Snapshot intelSnap = fitIntelligenceService.buildSnapshot(productId, userId, sizes);

        double rw0 = mlFitProperties.getRuleWeight();
        double mw0 = mlFitProperties.getMlWeight();
        double sumW = rw0 + mw0;
        if (sumW > 0 && Math.abs(sumW - 1.0) > 1e-6) {
            rw0 /= sumW;
            mw0 /= sumW;
        }
        final double normRuleW = rw0;
        final double normMlW = mw0;

        List<SizeScoreBreakdownDTO> breakdown = new ArrayList<>();
        List<SizeFitSuggestionDTO> suggestions = new ArrayList<>();
        List<String> traces = new ArrayList<>();
        traces.addAll(intelSnap.globalExplanations());

        String bestSize = sizes.get(0);
        double bestFinal = -1;
        boolean anyMlResponse = false;

        for (int i = 0; i < sizes.size(); i++) {
            String sizeLabel = sizes.get(i);
            int idx = FitSizeOrdering.indexInLadder(sizes, sizeLabel);
            GarmentSizeSpec spec = specByKey.get(FitSizeOrdering.normalizeKey(sizeLabel));
            double gChest = garmentCm(spec != null ? spec.getChestCm() : null, body.chestCm(), idx, medianIdx, GRADE_CHEST_CM_PER_STEP);
            double gShoulder = garmentCm(spec != null ? spec.getShoulderCm() : null, body.shoulderCm(), idx, medianIdx, GRADE_SHOULDER_CM_PER_STEP);
            double gWaist = garmentCm(spec != null ? spec.getWaistCm() : null, body.waistCm(), idx, medianIdx, GRADE_WAIST_CM_PER_STEP);
            double gLength = garmentCm(spec != null ? spec.getLengthCm() : null, body.lengthCm(), idx, medianIdx, GRADE_LENGTH_CM_PER_STEP);

            AxisResult chest = axis("chest", body.chestCm(), gChest, W_CHEST, stretchFactor, toleranceScale);
            AxisResult shoulder = axis("shoulder", body.shoulderCm(), gShoulder, W_SHOULDER, stretchFactor, toleranceScale);
            AxisResult waist = axis("waist", body.waistCm(), gWaist, W_WAIST, stretchFactor, toleranceScale);
            AxisResult length = axis("length", body.lengthCm(), gLength, W_LENGTH, stretchFactor, toleranceScale);

            double baseScore = W_CHEST * chest.dimensionScore()
                    + W_SHOULDER * shoulder.dimensionScore()
                    + W_WAIST * waist.dimensionScore()
                    + W_LENGTH * length.dimensionScore();

            double bonus = preferenceSilhouetteBonus(profile.getFitPreference(), silhouette);
            double physicsScore = clamp(baseScore + bonus, 0.0, 100.0);

            FitIntelligenceService.PerSizeAdjustment intelAdj = intelSnap.bySizeKey()
                    .getOrDefault(FitSizeOrdering.normalizeKey(sizeLabel), new FitIntelligenceService.PerSizeAdjustment(0, 0, 0));
            double ruleBasedScore = clamp(physicsScore + intelAdj.total(), 0.0, 100.0);

            OptionalDouble mlProb = OptionalDouble.empty();
            if (mlFitProperties.isEnabled()) {
                MlPredictFitRequestDTO mlReq = MlPredictFitRequestDTO.builder()
                        .userFeatures(MlUserFeaturesDTO.builder()
                                .height(profile.getHeightCm())
                                .weight(profile.getWeightKg())
                                .bodyShape(profile.getBodyShape())
                                .shoulderType(profile.getShoulderWidth())
                                .fitPreference(profile.getFitPreference())
                                .build())
                        .productFeatures(MlProductFeaturesDTO.builder()
                                .chest(gChest)
                                .waist(gWaist)
                                .shoulder(gShoulder)
                                .stretchLevel(stretch.name())
                                .build())
                        .size(sizeLabel)
                        .build();
                mlProb = mlFitClient.predictGoodFitProbability(mlReq);
            }

            boolean mlResponded = mlProb.isPresent();
            if (mlResponded) {
                anyMlResponse = true;
            }
            Double mlScore = null;
            double hybridFinal = ruleBasedScore;
            if (mlResponded) {
                mlScore = round2(mlProb.getAsDouble() * 100.0);
                hybridFinal = clamp(normRuleW * ruleBasedScore + normMlW * mlScore, 0.0, 100.0);
            }

            List<String> lines = new ArrayList<>();
            lines.add(String.format(Locale.US, "stretch=%s → diff multiplier=%.4f", stretch, stretchFactor));
            lines.add(axisLine(chest));
            lines.add(axisLine(shoulder));
            lines.add(axisLine(waist));
            lines.add(axisLine(length));
            lines.add(String.format(Locale.US, "baseScore = %.4f×%.2f + %.4f×%.2f + %.4f×%.2f + %.4f×%.2f = %.4f",
                    W_CHEST, chest.dimensionScore(), W_SHOULDER, shoulder.dimensionScore(),
                    W_WAIST, waist.dimensionScore(), W_LENGTH, length.dimensionScore(), baseScore));
            lines.add(String.format(Locale.US, "preferenceSilhouetteBonus=%.2f → physicsScore=clamp(%.4f,0,100)=%.4f", bonus, baseScore + bonus, physicsScore));
            lines.add(fitIntelligenceService.explainPerSize(sizeLabel, i, sizes, intelAdj, intelSnap));
            lines.add(String.format(Locale.US,
                    "ruleBasedScore=clamp(physicsScore %.4f + intelligence(feedback %.4f + returns %.4f + usage %.4f),0,100)=%.4f",
                    physicsScore, intelAdj.feedbackDelta(), intelAdj.returnDelta(), intelAdj.usageDelta(), ruleBasedScore));
            if (mlResponded) {
                lines.add(String.format(Locale.US,
                        "ML P(good fit)=%.4f → mlScore=%.2f; hybridFinal=clamp(%.4f×%.4f + %.4f×%.4f,0,100)=%.4f",
                        mlProb.getAsDouble(), mlScore, normRuleW, ruleBasedScore, normMlW, mlScore, hybridFinal));
            } else if (mlFitProperties.isEnabled()) {
                lines.add("ML predict unavailable; hybridFinal = ruleBasedScore.");
            } else {
                lines.add("ML disabled (app.ml.enabled=false); hybridFinal = ruleBasedScore.");
            }
            String hybrid = String.join("\n", lines);

            SizeMeasurementsBreakdownDTO ms = SizeMeasurementsBreakdownDTO.builder()
                    .chest(toPoint(chest))
                    .shoulder(toPoint(shoulder))
                    .waist(toPoint(waist))
                    .length(toPoint(length))
                    .build();

            String intelShort = Math.abs(intelAdj.total()) < 1e-6
                    ? ""
                    : String.format(Locale.US, " Historical simulation net %+.1f (feedback %+.1f, returns %+.1f, your wardrobe %+.1f).",
                    intelAdj.total(), intelAdj.feedbackDelta(), intelAdj.returnDelta(), intelAdj.usageDelta());
            String blendExplain = explainHybrid(ruleBasedScore, mlScore, mlResponded, mlFitProperties.isEnabled());
            String reason = humanReason(chest, shoulder, waist, length, physicsScore, ruleBasedScore, hybridFinal,
                    intelShort, mlResponded, mlFitProperties.isEnabled(), normRuleW, normMlW);

            breakdown.add(SizeScoreBreakdownDTO.builder()
                    .size(sizeLabel)
                    .score(hybridFinal)
                    .ruleScore(ruleBasedScore)
                    .mlScore(mlScore)
                    .finalScore(hybridFinal)
                    .baseScore(baseScore)
                    .physicsScore(physicsScore)
                    .intelligenceFeedbackDelta(intelAdj.feedbackDelta())
                    .intelligenceReturnDelta(intelAdj.returnDelta())
                    .intelligenceUsageDelta(intelAdj.usageDelta())
                    .reason(reason)
                    .hybridBlendExplanation(blendExplain)
                    .hybridExplanation(hybrid)
                    .measurements(ms)
                    .build());

            suggestions.add(SizeFitSuggestionDTO.builder()
                    .size(sizeLabel)
                    .confidence(hybridFinal)
                    .note(reason)
                    .build());

            if (hybridFinal > bestFinal) {
                bestFinal = hybridFinal;
                bestSize = sizeLabel;
            }
        }

        final String recommendedSize = bestSize;
        final double topConfidence = bestFinal;
        SizeScoreBreakdownDTO bestBreak = breakdown.stream()
                .filter(b -> b.getSize().equals(recommendedSize))
                .findFirst()
                .orElse(null);

        MeasurementComparisonDTO comparison = bestBreak != null ? toMeasureBars(bestBreak.getMeasurements(), toleranceScale) : null;

        traces.add("Body estimates (cm): chest=" + round2(body.chestCm()) + ", waist=" + round2(body.waistCm())
                + ", shoulder=" + round2(body.shoulderCm()) + ", length=" + round2(body.lengthCm()));
        traces.add("Per-axis score formula: clamp(100 − (rawDiff% × stretchFactor) × axisWeight, 0, 100); axisWeights sum to 1.0 in composite.");
        traces.add("Physics composite: 0.4×chestScore + 0.3×shoulderScore + 0.2×waistScore + 0.1×lengthScore + silhouette bonus.");
        traces.add("Final score = clamp(physicsScore + crowd feedback + SIZE_ISSUE returns + your wardrobe wear, 0, 100).");
        traces.add("Hybrid layer: when ML responds, final blends ruleBasedScore with P(good fit)×100 using app.ml rule-weight / ml-weight; on failure, rule score only.");

        String explanation = bestBreak != null ? summarizeComparison(bestBreak.getMeasurements()) : "Unable to summarize.";
        String hybridExplanation = buildTopHybridExplanation(mlFitProperties.isEnabled(), anyMlResponse, bestBreak);

        double durationMs = (System.nanoTime() - t0) / 1_000_000.0;
        log.info("Fit confidence computed userId={} productId={} recommendedSize={} confidence={} durationMs={}",
                userId, productId, recommendedSize, round2(topConfidence), round2(durationMs));

        return FitConfidenceResponseDTO.builder()
                .recommendedSize(recommendedSize)
                .confidence(topConfidence)
                .recommendedRuleScore(bestBreak != null ? bestBreak.getRuleScore() : null)
                .recommendedMlScore(bestBreak != null ? bestBreak.getMlScore() : null)
                .recommendedHybridScore(bestBreak != null ? bestBreak.getFinalScore() : null)
                .explanation(explanation)
                .hybridExplanation(hybridExplanation)
                .intelligenceExplanations(traces)
                .breakdown(breakdown)
                .allSizes(suggestions)
                .whyThisSizeReasons(buildWhy(bestBreak, topConfidence, body))
                .measurementComparison(comparison)
                .build();
    }

    private static List<SizeFitSuggestionDTO> emptySuggestions(List<String> sizes) {
        return sizes.stream()
                .map(s -> SizeFitSuggestionDTO.builder().size(s).confidence(0).note("Body profile required for scoring.").build())
                .collect(Collectors.toList());
    }

    private static double garmentCm(Double specValue, double bodyEstimate, int idx, int medianIdx, double gradePerStep) {
        if (specValue != null && specValue > 0) {
            return specValue;
        }
        return bodyEstimate + gradePerStep * (idx - medianIdx);
    }

    private static double stretchFactor(StretchLevel level) {
        return switch (level) {
            case HIGH -> 0.80;
            case LOW -> 1.15;
            case MEDIUM, NONE -> 1.0;
        };
    }

    private static double fitPreferenceToleranceScale(String fitPreference) {
        String p = fitPreference == null ? "" : fitPreference.trim().toUpperCase(Locale.ROOT);
        if ("SLIM".equals(p)) {
            return 0.95;
        }
        if ("LOOSE".equals(p)) {
            return 1.05;
        }
        return 1.0;
    }

    private static double preferenceSilhouetteBonus(String fitPreference, GarmentFitStyle silhouette) {
        String p = fitPreference == null ? "" : fitPreference.trim().toUpperCase(Locale.ROOT);
        if ("SLIM".equals(p) && silhouette == GarmentFitStyle.SLIM) {
            return 5.0;
        }
        if ("LOOSE".equals(p) && silhouette == GarmentFitStyle.RELAXED) {
            return 5.0;
        }
        return 0.0;
    }

    private record AxisResult(
            String name,
            double body,
            double garment,
            double rawDiffPercent,
            double adjDiffPercent,
            double weight,
            double dimensionScore,
            String status,
            double rangeMinCm,
            double rangeMaxCm
    ) {}

    private static AxisResult axis(String name, double bodyCm, double garmentCm, double axisWeight,
                                   double stretchFactor, double toleranceScale) {
        double bodySafe = Math.max(bodyCm, 1e-3);
        double rawDiff = Math.abs(garmentCm - bodyCm) / bodySafe * 100.0;
        double adjDiff = rawDiff * stretchFactor;
        double dimScore = clamp(100.0 - adjDiff * axisWeight, 0.0, 100.0);

        double signedPct = (garmentCm - bodyCm) / bodySafe * 100.0;
        double halfBand = REFERENCE_TOLERANCE_HALF_BAND_PCT * toleranceScale;
        String status;
        if (signedPct < -halfBand) {
            status = "TIGHT";
        } else if (signedPct > halfBand) {
            status = "LOOSE";
        } else {
            status = "GOOD";
        }
        double rangeMin = bodyCm * (1.0 - halfBand / 100.0);
        double rangeMax = bodyCm * (1.0 + halfBand / 100.0);
        return new AxisResult(name, bodyCm, garmentCm, rawDiff, adjDiff, axisWeight, dimScore, status, rangeMin, rangeMax);
    }

    private static String axisLine(AxisResult a) {
        return String.format(Locale.US,
                "%s: body=%.2f garment=%.2f rawDiff%%=%.4f adjDiff%%=%.4f dimScore=clamp(100−%.4f×%.2f)=%.4f status=%s",
                a.name, a.body, a.garment, a.rawDiffPercent, a.adjDiffPercent, a.adjDiffPercent, a.weight, a.dimensionScore, a.status);
    }

    private static MeasurementPointDTO toPoint(AxisResult a) {
        return MeasurementPointDTO.builder()
                .body(round2(a.body))
                .garment(round2(a.garment))
                .diffPercent(round4(a.adjDiffPercent))
                .rawDiffPercent(round4(a.rawDiffPercent))
                .status(a.status)
                .weight(a.weight)
                .dimensionScore(round4(a.dimensionScore))
                .build();
    }

    private static MeasurementComparisonDTO toMeasureBars(SizeMeasurementsBreakdownDTO m, double toleranceScale) {
        if (m == null) {
            return null;
        }
        double halfBand = REFERENCE_TOLERANCE_HALF_BAND_PCT * toleranceScale;
        return MeasurementComparisonDTO.builder()
                .chest(bar(m.getChest(), halfBand))
                .shoulder(bar(m.getShoulder(), halfBand))
                .waist(bar(m.getWaist(), halfBand))
                .length(bar(m.getLength(), halfBand))
                .build();
    }

    private static MeasureBarDTO bar(MeasurementPointDTO p, double halfBandPct) {
        if (p == null) {
            return null;
        }
        double rangeMin = p.getBody() * (1.0 - halfBandPct / 100.0);
        double rangeMax = p.getBody() * (1.0 + halfBandPct / 100.0);
        return MeasureBarDTO.builder()
                .body(p.getBody())
                .garment(p.getGarment())
                .diffPercent(p.getDiffPercent())
                .rawDiffPercent(p.getRawDiffPercent())
                .status(p.getStatus())
                .weight(p.getWeight())
                .dimensionScore(p.getDimensionScore())
                .rangeMinCm(round2(rangeMin))
                .rangeMaxCm(round2(rangeMax))
                .build();
    }

    private static String humanReason(AxisResult c, AxisResult s, AxisResult w, AxisResult l,
                                      double physicsScore, double ruleScore, double hybridFinal,
                                      String intelligenceTail, boolean mlResponded, boolean mlEnabled,
                                      double ruleW, double mlW) {
        List<String> parts = new ArrayList<>();
        for (AxisResult a : List.of(c, s, w, l)) {
            if (!"GOOD".equals(a.status)) {
                parts.add(a.name + " " + a.status.toLowerCase(Locale.ROOT));
            }
        }
        String fit = parts.isEmpty() ? "Good balance on chest, shoulder, waist, and length." : String.join("; ", parts) + ".";
        String mlNote;
        if (mlResponded) {
            mlNote = String.format(Locale.US,
                    " Hybrid final %.0f/100 blends rules (%.0f%%) with ML similar-user signal (%.0f%%).",
                    hybridFinal, ruleW * 100, mlW * 100);
        } else if (mlEnabled) {
            mlNote = " ML unavailable; hybrid uses rule score only.";
        } else {
            mlNote = "";
        }
        return String.format(Locale.US,
                "%s Physics layer %.0f/100; rule %.0f/100 after historical intelligence.%s%s",
                fit, physicsScore, ruleScore, intelligenceTail, mlNote);
    }

    private static String explainHybrid(double ruleScore, Double mlScore, boolean mlResponded, boolean mlEnabled) {
        if (!mlEnabled) {
            return "Rule-based fit is strong; ML is disabled for this deployment.";
        }
        if (!mlResponded || mlScore == null) {
            return "Rule-based fit is strong; ML layer unavailable so the score uses rules only.";
        }
        if (ruleScore >= 72 && mlScore >= 72) {
            return "Rule-based fit is strong; adjusted using feedback from similar users (ML agrees).";
        }
        if (mlScore > ruleScore + 5) {
            return "Adjusted using feedback from similar users (ML suggests higher good-fit probability).";
        }
        if (mlScore + 5 < ruleScore) {
            return "Rule-based fit is strong; ML tempered the blend based on comparable purchase outcomes.";
        }
        return "Recommended based on body fit and historical user feedback, refined with similar-user ML signal.";
    }

    private static String buildTopHybridExplanation(boolean mlEnabled, boolean anyMlResponse, SizeScoreBreakdownDTO best) {
        if (!mlEnabled) {
            return "ML layer is disabled; recommendations use the rule-based engine only.";
        }
        if (!anyMlResponse) {
            return "Rule-based fit is strong; ML service did not respond, so scores use rules only.";
        }
        if (best != null && best.getHybridBlendExplanation() != null && !best.getHybridBlendExplanation().isBlank()) {
            return best.getHybridBlendExplanation();
        }
        return "Recommended based on body fit and historical user feedback, blended with similar-user ML signals.";
    }

    private static String summarizeComparison(SizeMeasurementsBreakdownDTO m) {
        if (m == null) {
            return "";
        }
        List<String> good = new ArrayList<>();
        List<String> bad = new ArrayList<>();
        addLine(m.getChest(), "chest", good, bad);
        addLine(m.getShoulder(), "shoulder", good, bad);
        addLine(m.getWaist(), "waist", good, bad);
        addLine(m.getLength(), "length", good, bad);
        StringBuilder sb = new StringBuilder();
        if (!good.isEmpty()) {
            sb.append(String.join(", ", good));
        }
        if (!bad.isEmpty()) {
            if (sb.length() > 0) {
                sb.append("; ");
            }
            sb.append(String.join("; ", bad));
        }
        return sb.length() > 0 ? sb.toString() : "Neutral fit across measured axes.";
    }

    private static void addLine(MeasurementPointDTO p, String label, List<String> good, List<String> bad) {
        if (p == null) {
            return;
        }
        if ("GOOD".equals(p.getStatus())) {
            good.add(label + " in tolerance");
        } else {
            bad.add(label + " reads " + p.getStatus().toLowerCase(Locale.ROOT) + " (≈" + round2(p.getRawDiffPercent()) + "% raw diff)");
        }
    }

    private static List<String> buildWhy(SizeScoreBreakdownDTO best, double score,
                                          BodyMeasurementEstimator.EstimatedBody body) {
        if (best == null) {
            return List.of();
        }
        List<String> out = new ArrayList<>();
        out.add(String.format(Locale.US,
                "%s scores highest after physics + historical intelligence and optional ML blend (chest %.0f%%, shoulder %.0f%%, waist %.0f%%, length %.0f%% of physics composite) at %.1f/100.",
                best.getSize(), W_CHEST * 100, W_SHOULDER * 100, W_WAIST * 100, W_LENGTH * 100, score));
        if (best.getPhysicsScore() != null && Math.abs(score - best.getPhysicsScore()) > 0.25) {
            out.add(String.format(Locale.US,
                    "Physics-only score was %.1f; difference is deterministic feedback/returns/wardrobe adjustments (see per-size hybrid trace).",
                    best.getPhysicsScore()));
        }
        if (best.getMlScore() != null) {
            out.add(String.format(Locale.US,
                    "ML layer contributed (mlScore ≈%.1f on a 0–100 scale); the displayed score is the weighted blend with the rule layer.",
                    best.getMlScore()));
        }
        out.add(String.format(Locale.US,
                "Your estimated chest/waist/shoulder/length (cm): %.1f / %.1f / %.1f / %.1f.",
                body.chestCm(), body.waistCm(), body.shoulderCm(), body.lengthCm()));
        return out;
    }

    private static double clamp(double v, double lo, double hi) {
        return Math.max(lo, Math.min(hi, v));
    }

    private static double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }

    private static double round4(double v) {
        return Math.round(v * 10000.0) / 10000.0;
    }
}
