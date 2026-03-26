package com.stylediscovery.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * Pattern / finished-garment measurements (cm) for one product size label.
 * Used by {@link com.stylediscovery.service.FitConfidenceService}; optional — fallback grading applies if absent.
 */
@Entity
@Table(name = "garment_size_specs", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"product_id", "size_key"})
})
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GarmentSizeSpec {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    /** Normalized key: trimmed upper-case size label (e.g. "M", "32") */
    @Column(name = "size_key", nullable = false, length = 32)
    private String sizeKey;

    @Column(name = "chest_cm")
    private Double chestCm;

    @Column(name = "shoulder_cm")
    private Double shoulderCm;

    @Column(name = "waist_cm")
    private Double waistCm;

    @Column(name = "length_cm")
    private Double lengthCm;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
