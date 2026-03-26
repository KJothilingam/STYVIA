package com.stylediscovery.entity;

import com.stylediscovery.enums.FitReturnReason;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * Recorded when a return is attributed to fit / size (no ML — drives deterministic penalties in {@link com.stylediscovery.service.FitIntelligenceService}).
 */
@Entity
@Table(name = "fit_return_signals", indexes = {
        @Index(name = "idx_fit_return_product", columnList = "product_id"),
        @Index(name = "idx_fit_return_size", columnList = "product_id, size_key")
})
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FitReturnSignal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "size_key", nullable = false, length = 32)
    private String sizeKey;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private FitReturnReason reason;

    @Column(name = "order_item_id")
    private Long orderItemId;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
