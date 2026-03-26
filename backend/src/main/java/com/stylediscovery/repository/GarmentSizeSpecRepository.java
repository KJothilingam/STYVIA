package com.stylediscovery.repository;

import com.stylediscovery.entity.GarmentSizeSpec;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GarmentSizeSpecRepository extends JpaRepository<GarmentSizeSpec, Long> {
    List<GarmentSizeSpec> findByProduct_Id(Long productId);

    Optional<GarmentSizeSpec> findByProduct_IdAndSizeKey(Long productId, String sizeKey);

    void deleteByProduct_Id(Long productId);
}
