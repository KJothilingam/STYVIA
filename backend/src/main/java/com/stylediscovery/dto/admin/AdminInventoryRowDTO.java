package com.stylediscovery.dto.admin;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AdminInventoryRowDTO {
    @NotBlank
    private String size;
    @NotBlank
    private String color;
    private String colorHex;
    @Min(0)
    private int stockQuantity = 0;
}
