package com.stylediscovery.service;

import com.stylediscovery.entity.FitFeedback;
import com.stylediscovery.entity.FitReturnSignal;
import com.stylediscovery.entity.OrderItem;
import com.stylediscovery.entity.Product;
import com.stylediscovery.entity.User;
import com.stylediscovery.enums.FitFeedbackType;
import com.stylediscovery.enums.FitReturnReason;
import com.stylediscovery.exception.BadRequestException;
import com.stylediscovery.exception.ResourceNotFoundException;
import com.stylediscovery.repository.FitFeedbackRepository;
import com.stylediscovery.repository.FitReturnSignalRepository;
import com.stylediscovery.repository.OrderItemRepository;
import com.stylediscovery.repository.ProductRepository;
import com.stylediscovery.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

/**
 * Persists rows that drive {@link FitIntelligenceService} (no ML).
 */
@Service
@RequiredArgsConstructor
public class FitLearningWriteService {

    private final FitFeedbackRepository fitFeedbackRepository;
    private final FitReturnSignalRepository fitReturnSignalRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final OrderItemRepository orderItemRepository;
    private final CatalogCacheEvictionService catalogCacheEvictionService;
    private final FitTrainingDataService fitTrainingDataService;

    @Transactional
    public void submitFitFeedbackFromRequest(Long userId, Long productId, String sizeLabel, String feedbackRaw) {
        FitFeedbackType type;
        try {
            type = FitFeedbackType.valueOf(feedbackRaw.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("feedback must be TIGHT, PERFECT, or LOOSE");
        }
        persistFitFeedback(userId, productId, sizeLabel, type);
    }

    @Transactional
    public void submitFitFeedback(Long userId, Long productId, String sizeLabel, FitFeedbackType feedback) {
        persistFitFeedback(userId, productId, sizeLabel, feedback);
    }

    private void persistFitFeedback(Long userId, Long productId, String sizeLabel, FitFeedbackType feedback) {
        if (sizeLabel == null || sizeLabel.isBlank()) {
            throw new BadRequestException("size is required");
        }
        User user = userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Product product = productRepository.findById(productId).orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        String key = FitSizeOrdering.normalizeKey(sizeLabel);
        fitFeedbackRepository.save(FitFeedback.builder()
                .user(user)
                .product(product)
                .sizeKey(key)
                .feedback(feedback)
                .build());
        catalogCacheEvictionService.evictAllFitConfidence();
    }

    /**
     * Records a size-related return signal for fit learning (order should be returned or delivered per your ops policy).
     */
    @Transactional
    public void recordSizeIssueReturn(Long userId, Long orderItemId) {
        OrderItem line = orderItemRepository.findByIdWithOrderAndUser(orderItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Order item not found"));
        if (!line.getOrder().getUser().getId().equals(userId)) {
            throw new BadRequestException("Order item does not belong to user");
        }
        User user = line.getOrder().getUser();
        Product product = line.getProduct();
        String key = FitSizeOrdering.normalizeKey(line.getSize());
        fitReturnSignalRepository.save(FitReturnSignal.builder()
                .user(user)
                .product(product)
                .sizeKey(key)
                .reason(FitReturnReason.SIZE_ISSUE)
                .orderItemId(orderItemId)
                .build());
        fitTrainingDataService.markReturned(orderItemId);
        catalogCacheEvictionService.evictAllFitConfidence();
    }
}
