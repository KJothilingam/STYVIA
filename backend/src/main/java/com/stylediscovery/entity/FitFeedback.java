package com.stylediscovery.entity;

import com.stylediscovery.enums.FitFeedbackType;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "fit_feedback", indexes = {
        @Index(name = "idx_fit_feedback_product", columnList = "product_id"),
        @Index(name = "idx_fit_feedback_user", columnList = "user_id")
})
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FitFeedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    /** Normalized size key (trimmed upper-case) for aggregation. */
    @Column(name = "size_key", nullable = false, length = 32)
    private String sizeKey;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private FitFeedbackType feedback;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
