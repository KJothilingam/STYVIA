package com.stylediscovery.entity;

import com.stylediscovery.enums.DonationBoxStatus;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "donation_box_requests", indexes = {
        @Index(name = "idx_donation_box_drop_token", columnList = "drop_token", unique = true)
})
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DonationBoxRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "drop_token", nullable = false, unique = true, length = 64)
    private String dropToken;

    @Column(name = "address_line1", nullable = false, length = 500)
    private String addressLine1;

    @Column(length = 255)
    private String locality;

    @Column(nullable = false, length = 120)
    private String city;

    @Column(nullable = false, length = 16)
    private String pincode;

    @Column(nullable = false, length = 32)
    private String phone;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "admin_reply", columnDefinition = "TEXT")
    private String adminReply;

    @Column(name = "expected_delivery_at")
    private LocalDateTime expectedDeliveryAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, columnDefinition = "VARCHAR(64) NOT NULL")
    @Builder.Default
    private DonationBoxStatus status = DonationBoxStatus.PENDING;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
