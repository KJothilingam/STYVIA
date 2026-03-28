package com.stylediscovery.repository;

import com.stylediscovery.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    /** Resolve payment row for an order (by {@code orders.id}). */
    Optional<Payment> findByOrder_Id(Long orderId);
    Optional<Payment> findByTransactionId(String transactionId);
}

