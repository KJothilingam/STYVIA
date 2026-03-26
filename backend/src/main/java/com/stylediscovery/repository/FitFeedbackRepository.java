package com.stylediscovery.repository;

import com.stylediscovery.entity.FitFeedback;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FitFeedbackRepository extends JpaRepository<FitFeedback, Long> {
    List<FitFeedback> findByProduct_Id(Long productId);
}
