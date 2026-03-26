package com.stylediscovery.service;

import com.stylediscovery.entity.FitFeedback;
import com.stylediscovery.entity.FitReturnSignal;
import com.stylediscovery.entity.WardrobeItem;
import com.stylediscovery.enums.FitFeedbackType;
import com.stylediscovery.enums.FitReturnReason;
import com.stylediscovery.repository.FitFeedbackRepository;
import com.stylediscovery.repository.FitReturnSignalRepository;
import com.stylediscovery.repository.WardrobeItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Deterministic, explainable “learning simulation” from historical rows (no ML).
 * <p>
 * Crowd fit feedback: LOOSE on size S penalizes S (−{@value #FEEDBACK_LOOSE_POINTS} per report);
 * TIGHT on the previous smaller size boosts this size (+{@value #FEEDBACK_TIGHT_BOOST_POINTS} per report on predecessor);
 * PERFECT on S nudges S upward (+{@value #FEEDBACK_PERFECT_POINTS} per report).
 * <p>
 * Returns: each SIZE_ISSUE signal for (product, size) applies {@value #RETURN_SIZE_ISSUE_POINTS} (negative), capped.
 * <p>
 * Wardrobe wear (current user only): high wear count boosts that size; zero wears after {@value #USAGE_STALE_DAYS} days reduces it.
 */
@Service
@RequiredArgsConstructor
public class FitIntelligenceService {

    /** Per LOOSE feedback row on this size. */
    private static final double FEEDBACK_LOOSE_POINTS = -5.0;
    /** Per TIGHT feedback row on the immediately smaller in-stock size → added to this size. */
    private static final double FEEDBACK_TIGHT_BOOST_POINTS = 5.0;
    /** Per PERFECT feedback row on this size. */
    private static final double FEEDBACK_PERFECT_POINTS = 2.0;
    private static final double MAX_FEEDBACK_DELTA_MAGNITUDE = 35.0;

    private static final double RETURN_SIZE_ISSUE_POINTS = -6.0;
    private static final double MAX_RETURN_PENALTY_MAGNITUDE = 30.0;

    private static final int USAGE_STALE_DAYS = 14;
    private static final double USAGE_FREQUENT_BOOST = 4.0;
    private static final int USAGE_FREQUENT_MIN_WEAR = 5;
    private static final double USAGE_SOME_BOOST = 2.0;
    private static final double USAGE_NEVER_WORN_PENALTY = -5.0;

    private final FitFeedbackRepository fitFeedbackRepository;
    private final FitReturnSignalRepository fitReturnSignalRepository;
    private final WardrobeItemRepository wardrobeItemRepository;

    public record PerSizeAdjustment(double feedbackDelta, double returnDelta, double usageDelta) {
        public double total() {
            return feedbackDelta + returnDelta + usageDelta;
        }
    }

    /**
     * @param sortedSizes in-stock ladder order (same as fit scoring)
     */
    @Transactional(readOnly = true)
    public Snapshot buildSnapshot(Long productId, Long userId, List<String> sortedSizes) {
        List<FitFeedback> feedbackRows = fitFeedbackRepository.findByProduct_Id(productId);
        List<FitReturnSignal> returnRows = fitReturnSignalRepository.findByProduct_IdAndReason(productId, FitReturnReason.SIZE_ISSUE);
        List<WardrobeItem> wardrobe = wardrobeItemRepository.findByUser_IdAndProductId(userId, productId);

        Map<String, Long> tightByKey = countBy(feedbackRows, FitFeedbackType.TIGHT);
        Map<String, Long> looseByKey = countBy(feedbackRows, FitFeedbackType.LOOSE);
        Map<String, Long> perfectByKey = countBy(feedbackRows, FitFeedbackType.PERFECT);

        Map<String, Long> returnCountByKey = returnRows.stream()
                .collect(Collectors.groupingBy(FitReturnSignal::getSizeKey, Collectors.counting()))
                .entrySet().stream()
                .collect(Collectors.toMap(Map.Entry::getKey, e -> e.getValue()));

        Map<String, WardrobeWearAgg> wearByKey = aggregateWardrobe(wardrobe);

        Map<String, PerSizeAdjustment> byKey = new LinkedHashMap<>();
        List<String> globalLines = new ArrayList<>();

        long totalFeedback = feedbackRows.size();
        if (totalFeedback > 0) {
            double avgScore = averageFeedbackScore(feedbackRows);
            globalLines.add(String.format(Locale.US,
                    "Historical fit feedback: %d row(s); average signed score (TIGHT=+1, PERFECT=0, LOOSE=-1) = %.3f.",
                    totalFeedback, avgScore));
            long tightTotal = tightByKey.values().stream().mapToLong(Long::longValue).sum();
            long looseTotal = looseByKey.values().stream().mapToLong(Long::longValue).sum();
            if (tightTotal > 0) {
                globalLines.add(String.format(Locale.US,
                        "%d user(s) reported TIGHT in some size — the next larger size gains +%.0f points per report (before cap), e.g. to correct undersized runs.",
                        tightTotal, FEEDBACK_TIGHT_BOOST_POINTS));
            }
            if (looseTotal > 0) {
                globalLines.add(String.format(Locale.US,
                        "%d user(s) reported LOOSE — those sizes are penalized %.0f points per report (before cap).",
                        looseTotal, -FEEDBACK_LOOSE_POINTS));
            }
        }
        long totalReturns = returnRows.size();
        if (totalReturns > 0) {
            globalLines.add(String.format(Locale.US,
                    "%d return signal(s) recorded with reason SIZE_ISSUE for this product (reduce confidence on affected sizes).",
                    totalReturns));
        }
        if (!wardrobe.isEmpty()) {
            globalLines.add(String.format(Locale.US,
                    "Your wardrobe has %d line(s) for this product; wear frequency adjusts scores only for you on matching sizes.",
                    wardrobe.size()));
        }

        for (int i = 0; i < sortedSizes.size(); i++) {
            String label = sortedSizes.get(i);
            String key = FitSizeOrdering.normalizeKey(label);
            long looseN = looseByKey.getOrDefault(key, 0L);
            long perfectN = perfectByKey.getOrDefault(key, 0L);
            String prevKey = i > 0 ? FitSizeOrdering.normalizeKey(sortedSizes.get(i - 1)) : null;
            long tightPrev = prevKey == null ? 0L : tightByKey.getOrDefault(prevKey, 0L);

            double rawFeedback = FEEDBACK_LOOSE_POINTS * looseN
                    + FEEDBACK_TIGHT_BOOST_POINTS * tightPrev
                    + FEEDBACK_PERFECT_POINTS * perfectN;
            double feedbackDelta = clamp(rawFeedback, -MAX_FEEDBACK_DELTA_MAGNITUDE, MAX_FEEDBACK_DELTA_MAGNITUDE);

            long retN = returnCountByKey.getOrDefault(key, 0L);
            double rawReturn = RETURN_SIZE_ISSUE_POINTS * retN;
            double returnDelta = clamp(rawReturn, -MAX_RETURN_PENALTY_MAGNITUDE, 0.0);

            double usageDelta = wearByKey.containsKey(key)
                    ? wearByKey.get(key).toDelta()
                    : 0.0;

            byKey.put(key, new PerSizeAdjustment(feedbackDelta, returnDelta, usageDelta));
        }

        return new Snapshot(byKey, globalLines, tightByKey, looseByKey, perfectByKey, returnCountByKey);
    }

    public String explainPerSize(String sizeLabel, int indexInLadder, List<String> sortedSizes, PerSizeAdjustment adj, Snapshot snap) {
        String key = FitSizeOrdering.normalizeKey(sizeLabel);
        List<String> parts = new ArrayList<>();
        long looseN = snap.looseByKey().getOrDefault(key, 0L);
        long tightPrev = 0L;
        if (indexInLadder > 0) {
            String prevKey = FitSizeOrdering.normalizeKey(sortedSizes.get(indexInLadder - 1));
            tightPrev = snap.tightByKey().getOrDefault(prevKey, 0L);
        }
        if (looseN > 0 && adj.feedbackDelta() < 0) {
            parts.add(String.format(Locale.US,
                    "crowd: %d LOOSE report(s) on this size contribute %.2f (%.2f each, capped in total)",
                    looseN, FEEDBACK_LOOSE_POINTS * looseN, FEEDBACK_LOOSE_POINTS));
        }
        if (tightPrev > 0) {
            parts.add(String.format(Locale.US,
                    "%d TIGHT report(s) on the previous smaller size boost this size by +%.2f total before cap",
                    tightPrev, FEEDBACK_TIGHT_BOOST_POINTS * tightPrev));
        }
        long perfectN = snap.perfectByKey().getOrDefault(key, 0L);
        if (perfectN > 0) {
            parts.add(String.format(Locale.US,
                    "%d PERFECT report(s) on this size → +%.2f before cap (%.2f each)",
                    perfectN, FEEDBACK_PERFECT_POINTS * perfectN, FEEDBACK_PERFECT_POINTS));
        }
        long retN = snap.returnCountByKey().getOrDefault(key, 0L);
        if (retN > 0) {
            parts.add(String.format(Locale.US,
                    "%d SIZE_ISSUE return(s) → %.2f (%.2f each, capped)", retN, adj.returnDelta(), RETURN_SIZE_ISSUE_POINTS));
        }
        if (Math.abs(adj.usageDelta()) > 1e-6) {
            parts.add(String.format(Locale.US, "your wardrobe wear pattern → %.2f", adj.usageDelta()));
        }
        if (parts.isEmpty() && Math.abs(adj.total()) < 1e-6) {
            return "intelligence: no historical adjustment for this size.";
        }
        return "intelligence: " + String.join("; ", parts)
                + String.format(Locale.US, " → net feedback %.2f, returns %.2f, usage %.2f (total %+.2f).",
                adj.feedbackDelta(), adj.returnDelta(), adj.usageDelta(), adj.total());
    }

    public record Snapshot(
            Map<String, PerSizeAdjustment> bySizeKey,
            List<String> globalExplanations,
            Map<String, Long> tightByKey,
            Map<String, Long> looseByKey,
            Map<String, Long> perfectByKey,
            Map<String, Long> returnCountByKey
    ) {}

    private static Map<String, Long> countBy(List<FitFeedback> rows, FitFeedbackType type) {
        return rows.stream()
                .filter(f -> f.getFeedback() == type)
                .collect(Collectors.groupingBy(FitFeedback::getSizeKey, Collectors.counting()))
                .entrySet().stream()
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
    }

    private static double averageFeedbackScore(List<FitFeedback> rows) {
        if (rows.isEmpty()) {
            return 0.0;
        }
        double sum = 0;
        for (FitFeedback f : rows) {
            sum += switch (f.getFeedback()) {
                case TIGHT -> 1.0;
                case PERFECT -> 0.0;
                case LOOSE -> -1.0;
            };
        }
        return sum / rows.size();
    }

    private static Map<String, WardrobeWearAgg> aggregateWardrobe(List<WardrobeItem> items) {
        Map<String, WardrobeWearAgg> map = new HashMap<>();
        LocalDateTime now = LocalDateTime.now();
        for (WardrobeItem w : items) {
            String key = FitSizeOrdering.normalizeKey(w.getSize());
            int wc = w.getWearCount() == null ? 0 : w.getWearCount();
            map.merge(key, new WardrobeWearAgg(wc, w.getPurchasedAt(), now), FitIntelligenceService::mergeWearAggs);
        }
        return map;
    }

    private static WardrobeWearAgg mergeWearAggs(WardrobeWearAgg a, WardrobeWearAgg b) {
        LocalDateTime oldest = a.oldestPurchase.isBefore(b.oldestPurchase) ? a.oldestPurchase : b.oldestPurchase;
        int wear = Math.max(a.maxWear, b.maxWear);
        return new WardrobeWearAgg(wear, oldest, a.now);
    }

    private record WardrobeWearAgg(int maxWear, LocalDateTime oldestPurchase, LocalDateTime now) {

        double toDelta() {
            if (maxWear >= USAGE_FREQUENT_MIN_WEAR) {
                return USAGE_FREQUENT_BOOST;
            }
            if (maxWear >= 1) {
                return USAGE_SOME_BOOST;
            }
            long days = ChronoUnit.DAYS.between(oldestPurchase, now);
            if (days >= USAGE_STALE_DAYS) {
                return USAGE_NEVER_WORN_PENALTY;
            }
            return 0.0;
        }
    }

    private static double clamp(double v, double lo, double hi) {
        return Math.max(lo, Math.min(hi, v));
    }
}
