package com.stylediscovery.entity;

import com.stylediscovery.enums.FitFeedbackType;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * Labeled and order-linked rows for ML training (hybrid fit system).
 */
@Entity
@Table(name = "fit_training_data", indexes = {
        @Index(name = "idx_fit_train_user", columnList = "user_id"),
        @Index(name = "idx_fit_train_product", columnList = "product_id"),
        @Index(name = "idx_fit_train_order_item", columnList = "order_item_id")
})
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FitTrainingData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    /** Links to {@link OrderItem#getId()} for feedback/return updates. */
    @Column(name = "order_item_id")
    private Long orderItemId;

    @Column(name = "height_cm")
    private Double height;

    @Column(name = "weight_kg")
    private Double weight;

    @Column(name = "body_shape", length = 32)
    private String bodyShape;

    @Column(name = "shoulder_type", length = 32)
    private String shoulderType;

    @Column(name = "fit_preference", length = 32)
    private String fitPreference;

    /** Size label on product (e.g. chart key). */
    @Column(name = "product_size", nullable = false, length = 32)
    private String productSize;

    @Column(name = "chest_cm")
    private Double chest;

    @Column(name = "waist_cm")
    private Double waist;

    @Column(name = "shoulder_cm")
    private Double shoulder;

    @Column(name = "stretch_level", length = 16)
    private String stretchLevel;

    /** Purchased / tried size (usually same as productSize). */
    @Column(name = "selected_size", nullable = false, length = 32)
    private String selectedSize;

    @Enumerated(EnumType.STRING)
    @Column(name = "feedback", length = 16)
    private FitFeedbackType feedback;

    @Column(name = "returned", nullable = false)
    @Builder.Default
    private boolean returned = false;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
