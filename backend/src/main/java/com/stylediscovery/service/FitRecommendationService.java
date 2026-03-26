package com.stylediscovery.service;

import com.stylediscovery.config.CacheConfig;
import com.stylediscovery.dto.ProductDTO;
import com.stylediscovery.dto.fit.*;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Fit and outfit endpoints; fit confidence delegates to {@link FitConfidenceService}.
 */
@Service
@RequiredArgsConstructor
public class FitRecommendationService {

    private final ProductService productService;
    private final FitConfidenceService fitConfidenceService;

    @Transactional(readOnly = true)
    @Cacheable(cacheNames = CacheConfig.CACHE_FIT_CONFIDENCE, key = "'fit:' + #userId + ':' + #productId")
    public FitConfidenceResponseDTO fitConfidence(Long userId, Long productId) {
        return fitConfidenceService.compute(userId, productId);
    }

    @Transactional(readOnly = true)
    public OutfitRecommendationDTO outfit(Long productId) {
        ProductDTO anchor = productService.getProductById(productId);
        return OutfitRecommendationDTO.builder()
                .anchorProduct(anchor)
                .items(List.of())
                .occasion("Everyday / smart casual")
                .colorHarmonyNote("Pair with neutral bottoms from the same palette for a cohesive look.")
                .overallConfidence(0.72)
                .filteringNote("Extended outfit suggestions can be wired to catalog rules in a future release.")
                .build();
    }
}
