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
public class DonationBoxRequestDTO {
    private Long id;
    /** Account holder (for display on the customer Donations page). */
    private String userName;
    private String userEmail;
    private String dropToken;
    private String addressLine1;
    private String locality;
    private String city;
    private String pincode;
    private String phone;
    private String notes;
    private String adminReply;
    private LocalDateTime expectedDeliveryAt;
    private String status;
    private LocalDateTime createdAt;
}
