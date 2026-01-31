package com.stylediscovery.repository;

import com.stylediscovery.entity.WishlistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WishlistItemRepository extends JpaRepository<WishlistItem, Long> {
    List<WishlistItem> findByWishlistId(Long wishlistId);
    Optional<WishlistItem> findByWishlistIdAndProductId(Long wishlistId, Long productId);
    Boolean existsByWishlistIdAndProductId(Long wishlistId, Long productId);
    void deleteByWishlistId(Long wishlistId);
}

