package com.stylediscovery.dto.admin;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AdminScheduleDonationPickupRequest {
    @NotNull
    private LocalDateTime expectedPickAt;

    private String reply;
}
