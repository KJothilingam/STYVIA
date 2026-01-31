package com.stylediscovery.repository;

import com.stylediscovery.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    List<CartItem> findByCartId(Long cartId);
    Optional<CartItem> findByCartIdAndProductIdAndInventoryId(Long cartId, Long productId, Long inventoryId);
    void deleteByCartId(Long cartId);
}

