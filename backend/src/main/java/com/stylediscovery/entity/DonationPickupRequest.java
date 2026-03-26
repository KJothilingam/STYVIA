package com.stylediscovery.entity;

import com.stylediscovery.enums.DonationPickupStatus;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "donation_pickup_requests")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DonationPickupRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** Optional client wardrobe row id when wardrobe API is in use */
    @Column(name = "wardrobe_item_id")
    private Long wardrobeItemId;

    @Column(name = "product_summary", length = 500)
    private String productSummary;

    @Column(length = 32)
    private String size;

    @Column(name = "donation_center_code", nullable = false, length = 64)
    private String donationCenterCode;

    @Column(name = "pickup_address", length = 1000)
    private String pickupAddress;

    @Column(columnDefinition = "TEXT")
    private String notes;

    /** Latest message from admin to the user (may accumulate across updates). */
    @Column(name = "admin_reply", columnDefinition = "TEXT")
    private String adminReply;

    /** Set when status moves to EXPECTED_PICK_DATE. */
    @Column(name = "expected_pick_at")
    private LocalDateTime expectedPickAt;

    @Enumerated(EnumType.STRING)
    /** VARCHAR avoids MySQL ENUM truncation when workflow values change (REQ_ACCEPTED, EXPECTED_PICK_DATE, …). */
    @Column(name = "status", nullable = false, columnDefinition = "VARCHAR(64) NOT NULL")
    @Builder.Default
    private DonationPickupStatus status = DonationPickupStatus.PENDING;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
