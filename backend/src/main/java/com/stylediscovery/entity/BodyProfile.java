package com.stylediscovery.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "body_profiles", uniqueConstraints = @UniqueConstraint(columnNames = "user_id"))
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BodyProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "height_cm", nullable = false)
    private Double heightCm;

    @Column(name = "weight_kg", nullable = false)
    private Double weightKg;

    @Column(nullable = false, length = 16)
    private String gender;

    @Column(name = "body_shape", nullable = false, length = 32)
    private String bodyShape;

    @Column(name = "shoulder_width", nullable = false, length = 32)
    private String shoulderWidth;

    @Column(name = "chest_type", nullable = false, length = 32)
    private String chestType;

    @Column(name = "waist_type", nullable = false, length = 32)
    private String waistType;

    @Column(name = "fit_preference", nullable = false, length = 32)
    private String fitPreference;

    /** Optional manual overrides (cm). When null, {@link com.stylediscovery.service.BodyMeasurementEstimator} uses formulas. */
    @Column(name = "chest_cm")
    private Double chestCm;

    @Column(name = "shoulder_cm")
    private Double shoulderCm;

    @Column(name = "waist_cm")
    private Double waistCm;

    @Column(name = "length_cm")
    private Double lengthCm;

    /** Letter size the user usually buys for tops (e.g. S, M, L, XL). */
    @Column(name = "usual_shirt_size", length = 16)
    private String usualShirtSize;

    /** Numeric waist size in inches for bottoms the user usually buys (e.g. 34). */
    @Column(name = "usual_pant_waist_inches")
    private Integer usualPantWaistInches;

    @Column(name = "usual_shoe_size", length = 32)
    private String usualShoeSize;

    @Column(name = "saree_style", length = 64)
    private String sareeStyle;

    @Column(name = "prefers_free_size", nullable = false)
    @Builder.Default
    private Boolean prefersFreeSize = Boolean.FALSE;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
