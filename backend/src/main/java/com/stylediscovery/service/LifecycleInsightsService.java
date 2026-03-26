package com.stylediscovery.service;

import com.stylediscovery.dto.lifecycle.LifecycleInsightsDTO;
import com.stylediscovery.dto.lifecycle.LifecycleItemInsightDTO;
import com.stylediscovery.entity.WardrobeItem;
import com.stylediscovery.repository.WardrobeItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LifecycleInsightsService {

    private final WardrobeItemRepository wardrobeItemRepository;

    @Transactional(readOnly = true)
    public LifecycleInsightsDTO insights(Long userId) {
        List<WardrobeItem> items = wardrobeItemRepository.findByUser_IdOrderByPurchasedAtDesc(userId);
        List<LifecycleItemInsightDTO> out = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        for (WardrobeItem w : items) {
            int months = (int) Math.max(1, ChronoUnit.MONTHS.between(w.getPurchasedAt(), now));
            double baseline = w.getFitConfidenceAtPurchase() != null ? w.getFitConfidenceAtPurchase() : 78;
            double drift = Math.min(8, months * 0.4 + Math.max(0, 10 - w.getWearCount()) * 0.15);
            double simulated = Math.max(40, baseline - drift);
            String freq;
            if (w.getWearCount() == 0) freq = "NONE";
            else if (w.getWearCount() < 4) freq = "LOW";
            else if (w.getWearCount() < 12) freq = "MEDIUM";
            else freq = "HIGH";
            String narrative = String.format(
                    "%s — owned ~%d mo, worn %d×. Estimated fit vs purchase: %.0f → %.0f.",
                    w.getProductName(), months, w.getWearCount(), baseline, simulated);
            out.add(LifecycleItemInsightDTO.builder()
                    .wardrobeItemId(w.getId())
                    .productId(w.getProductId())
                    .productName(w.getProductName())
                    .baselineFitConfidence(baseline)
                    .simulatedFitNow(simulated)
                    .monthsOwned(months)
                    .wearCount(w.getWearCount())
                    .wearFrequencyLabel(freq)
                    .narrative(narrative)
                    .build());
        }
        return LifecycleInsightsDTO.builder().items(out).build();
    }
}
