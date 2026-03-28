package com.stylediscovery.repository;

import com.stylediscovery.entity.DonationPickupRequest;
import com.stylediscovery.enums.DonationPickupStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;

public interface DonationPickupRequestRepository extends JpaRepository<DonationPickupRequest, Long> {
    List<DonationPickupRequest> findByUser_IdOrderByCreatedAtDesc(Long userId);

    boolean existsByUser_IdAndWardrobeItemIdAndStatusIn(
            Long userId,
            Long wardrobeItemId,
            Collection<DonationPickupStatus> statuses);

    long countByStatus(DonationPickupStatus status);

    @Query("SELECT d FROM DonationPickupRequest d JOIN FETCH d.user ORDER BY d.createdAt DESC")
    List<DonationPickupRequest> findAllWithUserOrderByCreatedAtDesc();
}
