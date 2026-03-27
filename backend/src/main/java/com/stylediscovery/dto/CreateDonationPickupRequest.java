package com.stylediscovery.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateDonationPickupRequest {
    private Long wardrobeItemId;
    private String productSummary;
    private String size;
    @NotBlank
    private String donationCenterCode;
    @NotBlank
    private String pickupAddress;
    private String notes;
}
