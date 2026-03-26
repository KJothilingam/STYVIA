package com.stylediscovery.repository;

import com.stylediscovery.entity.BodyProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BodyProfileRepository extends JpaRepository<BodyProfile, Long> {
    Optional<BodyProfile> findByUser_Id(Long userId);
    boolean existsByUser_Id(Long userId);
}
