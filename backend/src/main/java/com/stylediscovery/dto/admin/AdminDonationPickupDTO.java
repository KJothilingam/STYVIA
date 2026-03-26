package com.stylediscovery.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDonationPickupDTO {
    private Long id;
    private Long userId;
    private String userEmail;
    private String userName;
    private Long wardrobeItemId;
    private String productSummary;
    private String size;
    private String donationCenterCode;
    private String pickupAddress;
    private String notes;
    private String adminReply;
    private LocalDateTime expectedPickAt;
    private String status;
    private LocalDateTime createdAt;
}
