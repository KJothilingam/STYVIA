package com.stylediscovery.repository;

import com.stylediscovery.entity.FitTrainingData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface FitTrainingDataRepository extends JpaRepository<FitTrainingData, Long> {

    Optional<FitTrainingData> findByOrderItemId(Long orderItemId);

    Optional<FitTrainingData> findFirstByUser_IdAndProduct_IdAndSelectedSizeIgnoreCaseAndFeedbackIsNullOrderByCreatedAtDesc(
            Long userId, Long productId, String selectedSize);

    @Query("SELECT f FROM FitTrainingData f WHERE f.returned = true OR f.feedback IS NOT NULL")
    List<FitTrainingData> findAllWithLabel();
}
