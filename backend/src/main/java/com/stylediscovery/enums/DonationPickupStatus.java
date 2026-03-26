package com.stylediscovery.enums;

/**
 * Pickup workflow: PENDING → REQ_ACCEPTED → EXPECTED_PICK_DATE → COMPLETED.
 * (Legacy DB values SCHEDULED / PICKED_UP should be migrated manually if present.)
 */
public enum DonationPickupStatus {
    PENDING,
    REQ_ACCEPTED,
    EXPECTED_PICK_DATE,
    COMPLETED,
    CANCELLED
}
