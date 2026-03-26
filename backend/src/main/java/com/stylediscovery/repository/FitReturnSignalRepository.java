package com.stylediscovery.repository;

import com.stylediscovery.entity.FitReturnSignal;
import com.stylediscovery.enums.FitReturnReason;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FitReturnSignalRepository extends JpaRepository<FitReturnSignal, Long> {
    List<FitReturnSignal> findByProduct_IdAndReason(Long productId, FitReturnReason reason);
}
