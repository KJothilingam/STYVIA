package com.stylediscovery.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateDonationBoxRequest {
    @NotBlank
    private String addressLine1;
    private String locality;
    @NotBlank
    private String city;
    @NotBlank
    private String pincode;
    @NotBlank
    private String phone;
    private String notes;
}
