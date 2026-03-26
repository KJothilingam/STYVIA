package com.stylediscovery.entity;

import com.stylediscovery.enums.WardrobeLifecycleState;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "wardrobe_items", indexes = {
        @Index(name = "idx_wardrobe_user", columnList = "user_id"),
        @Index(name = "idx_wardrobe_product", columnList = "product_id")
})
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WardrobeItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "product_name", nullable = false, length = 500)
    private String productName;

    @Column(nullable = false, length = 48)
    private String size;

    @Column(nullable = false, length = 100)
    private String color;

    /** Pieces tracked for this row (manual merges or order line quantity). */
    @Column(nullable = false)
    @Builder.Default
    private Integer quantity = 1;

    /**
     * When set, this row was created from that order line — avoids duplicate imports on sync / re-place.
     */
    @Column(name = "source_order_item_id", unique = true)
    private Long sourceOrderItemId;

    @Column(name = "image_url", length = 1000)
    private String imageUrl;

    @Column(name = "purchased_at", nullable = false)
    private LocalDateTime purchasedAt;

    @Column(name = "wear_count", nullable = false)
    @Builder.Default
    private Integer wearCount = 0;

    @Column(name = "last_worn_at")
    private LocalDateTime lastWornAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "lifecycle_state", nullable = false, length = 32)
    @Builder.Default
    private WardrobeLifecycleState lifecycleState = WardrobeLifecycleState.NEW;

    @Column(name = "fit_confidence_at_purchase")
    private Double fitConfidenceAtPurchase;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(length = 500)
    @Builder.Default
    private String recommendation = "";

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
