package com.stylediscovery.repository;

import com.stylediscovery.entity.WardrobeItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WardrobeItemRepository extends JpaRepository<WardrobeItem, Long> {
    List<WardrobeItem> findByUser_IdOrderByPurchasedAtDesc(Long userId);

    List<WardrobeItem> findByUser_IdAndProductId(Long userId, Long productId);

    boolean existsByUser_IdAndProductIdAndSizeAndColor(Long userId, Long productId, String size, String color);
}
