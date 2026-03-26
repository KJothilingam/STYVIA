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

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
