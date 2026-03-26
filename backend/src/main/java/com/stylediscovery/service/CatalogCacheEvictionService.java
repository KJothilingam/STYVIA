package com.stylediscovery.service;

import com.stylediscovery.config.CacheConfig;
import com.stylediscovery.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;

/**
 * Evicts catalog caches when data changes (inventory, fit signals, product metadata).
 */
@Service
@RequiredArgsConstructor
public class CatalogCacheEvictionService {

    private final CacheManager cacheManager;
    private final ProductRepository productRepository;

    public void evictProductDetail(Long productId) {
        Cache cache = cacheManager.getCache(CacheConfig.CACHE_PRODUCT_DETAILS);
        if (cache == null) {
            return;
        }
        cache.evict(productId);
        productRepository.findById(productId).ifPresent(p -> cache.evict("slug:" + p.getSlug()));
    }

    /** Fit scores depend on crowd data and per-user wardrobe; clear all entries (bounded cache). */
    public void evictAllFitConfidence() {
        Cache cache = cacheManager.getCache(CacheConfig.CACHE_FIT_CONFIDENCE);
        if (cache != null) {
            cache.clear();
        }
    }

    public void evictProductAndFit(Long productId) {
        evictProductDetail(productId);
        evictAllFitConfidence();
    }
}
