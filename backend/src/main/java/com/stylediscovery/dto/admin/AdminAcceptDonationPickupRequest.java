package com.stylediscovery.dto.admin;

import lombok.Data;

@Data
public class AdminAcceptDonationPickupRequest {
    /** Optional note to the user (shown on their Donations page). */
    private String reply;
}
