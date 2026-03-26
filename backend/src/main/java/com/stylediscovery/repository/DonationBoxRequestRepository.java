package com.stylediscovery.repository;

import com.stylediscovery.entity.DonationBoxRequest;
import com.stylediscovery.enums.DonationBoxStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface DonationBoxRequestRepository extends JpaRepository<DonationBoxRequest, Long> {
    List<DonationBoxRequest> findByUser_IdOrderByCreatedAtDesc(Long userId);

    Optional<DonationBoxRequest> findByDropToken(String dropToken);

    long countByStatus(DonationBoxStatus status);

    @Query("SELECT b FROM DonationBoxRequest b JOIN FETCH b.user ORDER BY b.createdAt DESC")
    List<DonationBoxRequest> findAllWithUserOrderByCreatedAtDesc();
}
