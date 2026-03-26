package com.stylediscovery.enums;

/**
 * Empty-box workflow: PENDING → REQ_ACCEPTED → EXPECTED_DELIVERY → COMPLETED.
 * Legacy values (REQUESTED, BOX_SHIPPED, …) are migrated at startup.
 */
public enum DonationBoxStatus {
    PENDING,
    REQ_ACCEPTED,
    EXPECTED_DELIVERY,
    COMPLETED,
    CANCELLED
}
