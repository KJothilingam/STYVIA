package com.stylediscovery.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WardrobeItemDTO {
    private Long id;
    private Long productId;
    private String productName;
    private String size;
    private String color;
    private Integer quantity;
    /** True when this row is tied to a specific order line (including auto-import on checkout). */
    private Boolean fromOrder;
    private String imageUrl;
    private LocalDateTime purchasedAt;
    private Integer wearCount;
    private LocalDateTime lastWornAt;
    private String lifecycleState;
    private Double fitConfidenceAtPurchase;
    private String notes;
    private String recommendation;
}
