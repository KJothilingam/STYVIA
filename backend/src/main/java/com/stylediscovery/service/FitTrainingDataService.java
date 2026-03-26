package com.stylediscovery.service;

import com.stylediscovery.entity.*;
import com.stylediscovery.enums.FitFeedbackType;
import com.stylediscovery.repository.BodyProfileRepository;
import com.stylediscovery.repository.FitTrainingDataRepository;
import com.stylediscovery.repository.GarmentSizeSpecRepository;
import com.stylediscovery.repository.InventoryRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Captures rows for ML training: order placement, feedback updates, return flags.
 */
@Service
@RequiredArgsConstructor
public class FitTrainingDataService {

    private static final Logger log = LoggerFactory.getLogger(FitTrainingDataService.class);

    private final FitTrainingDataRepository fitTrainingDataRepository;
    private final BodyProfileRepository bodyProfileRepository;
    private final GarmentSizeSpecRepository garmentSizeSpecRepository;
    private final InventoryRepository inventoryRepository;
    private final BodyMeasurementEstimator bodyMeasurementEstimator;

    @Transactional
    public void recordFromPlacedOrder(Order order) {
        User user = order.getUser();
        Optional<BodyProfile> bpOpt = bodyProfileRepository.findByUser_Id(user.getId());
        BodyMeasurementEstimator.EstimatedBody est = bpOpt.map(bodyMeasurementEstimator::estimate).orElse(null);

        for (OrderItem item : order.getItems()) {
            Product product = item.getProduct();
            String size = item.getSize();
            String key = FitSizeOrdering.normalizeKey(size);
            GarmentSizeSpec spec = garmentSizeSpecRepository.findByProduct_IdAndSizeKey(product.getId(), key).orElse(null);

            Double chest = spec != null ? spec.getChestCm() : null;
            Double waist = spec != null ? spec.getWaistCm() : null;
            Double shoulder = spec != null ? spec.getShoulderCm() : null;
            if (est != null && (chest == null || waist == null || shoulder == null)) {
                List<String> ladder = FitSizeOrdering.sortedCopy(
                        inventoryRepository.findAvailableSizesByProductId(product.getId()));
                int medianIdx = ladder.isEmpty() ? 0 : ladder.size() / 2;
                int idx = FitSizeOrdering.indexInLadder(ladder, size);
                if (chest == null) {
                    chest = garmentCm(null, est.chestCm(), idx, medianIdx, 4.0);
                }
                if (waist == null) {
                    waist = garmentCm(null, est.waistCm(), idx, medianIdx, 3.5);
                }
                if (shoulder == null) {
                    shoulder = garmentCm(null, est.shoulderCm(), idx, medianIdx, 1.2);
                }
            }

            String stretch = product.getStretchLevel() != null ? product.getStretchLevel().name() : "MEDIUM";

            FitTrainingData row = FitTrainingData.builder()
                    .user(user)
                    .product(product)
                    .orderItemId(item.getId())
                    .height(bpOpt.map(BodyProfile::getHeightCm).orElse(null))
                    .weight(bpOpt.map(BodyProfile::getWeightKg).orElse(null))
                    .bodyShape(bpOpt.map(BodyProfile::getBodyShape).map(String::toUpperCase).orElse(null))
                    .shoulderType(bpOpt.map(BodyProfile::getShoulderWidth).map(String::toUpperCase).orElse(null))
                    .fitPreference(bpOpt.map(BodyProfile::getFitPreference).map(String::toUpperCase).orElse(null))
                    .productSize(size)
                    .chest(chest)
                    .waist(waist)
                    .shoulder(shoulder)
                    .stretchLevel(stretch)
                    .selectedSize(size)
                    .feedback(null)
                    .returned(false)
                    .build();
            fitTrainingDataRepository.save(row);
            log.debug("FitTrainingData recorded orderItemId={} productId={} size={}", item.getId(), product.getId(), size);
        }
    }

    @Transactional
    public void applyFeedback(Long userId, Long productId, String sizeLabel, FitFeedbackType feedback) {
        String size = sizeLabel != null ? sizeLabel.trim() : "";
        if (size.isEmpty()) {
            return;
        }
        fitTrainingDataRepository
                .findFirstByUser_IdAndProduct_IdAndSelectedSizeIgnoreCaseAndFeedbackIsNullOrderByCreatedAtDesc(
                        userId, productId, size)
                .ifPresentOrElse(row -> {
                    row.setFeedback(feedback);
                    fitTrainingDataRepository.save(row);
                    log.debug("FitTrainingData feedback updated id={} feedback={}", row.getId(), feedback);
                }, () -> log.debug("No open FitTrainingData row for feedback user={} product={} size={}", userId, productId, size));
    }

    @Transactional
    public void markReturned(Long orderItemId) {
        fitTrainingDataRepository.findByOrderItemId(orderItemId).ifPresent(row -> {
            row.setReturned(true);
            fitTrainingDataRepository.save(row);
            log.debug("FitTrainingData marked returned orderItemId={}", orderItemId);
        });
    }

    private static double garmentCm(Double specValue, double bodyEstimate, int idx, int medianIdx, double gradePerStep) {
        if (specValue != null && specValue > 0) {
            return specValue;
        }
        return bodyEstimate + gradePerStep * (idx - medianIdx);
    }
}
