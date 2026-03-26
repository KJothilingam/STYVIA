package com.stylediscovery.repository;

import com.stylediscovery.entity.WardrobeItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WardrobeItemRepository extends JpaRepository<WardrobeItem, Long> {
    List<WardrobeItem> findByUser_IdOrderByPurchasedAtDesc(Long userId);

    List<WardrobeItem> findByUser_IdAndProductId(Long userId, Long productId);

    Optional<WardrobeItem> findBySourceOrderItemId(Long orderItemId);

    Optional<WardrobeItem> findFirstByUser_IdAndProductIdAndSizeAndColorAndSourceOrderItemIdIsNull(
            Long userId, Long productId, String size, String color);
}
