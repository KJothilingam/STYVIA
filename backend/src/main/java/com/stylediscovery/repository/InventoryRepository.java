package com.stylediscovery.repository;

import com.stylediscovery.entity.Inventory;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM Inventory i WHERE i.id = :id")
    Optional<Inventory> findByIdForUpdate(@Param("id") Long id);

    List<Inventory> findByProductId(Long productId);
    
    Optional<Inventory> findByProductIdAndSizeAndColor(Long productId, String size, String color);
    
    @Query("SELECT i FROM Inventory i WHERE i.product.id = :productId AND i.stockQuantity > 0")
    List<Inventory> findAvailableByProductId(@Param("productId") Long productId);
    
    @Query("SELECT DISTINCT i.size FROM Inventory i WHERE i.product.id = :productId AND i.stockQuantity > 0")
    List<String> findAvailableSizesByProductId(@Param("productId") Long productId);
    
    @Query("SELECT DISTINCT i.color FROM Inventory i WHERE i.product.id = :productId AND i.stockQuantity > 0")
    List<String> findAvailableColorsByProductId(@Param("productId") Long productId);
}

