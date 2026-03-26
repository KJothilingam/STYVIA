package com.stylediscovery.dto.admin;

import com.stylediscovery.enums.Gender;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class AdminCreateProductRequest {
    @NotBlank
    private String name;
    @NotBlank
    private String brand;
    @NotNull
    private Gender gender;
    @NotNull
    private BigDecimal price;
    private BigDecimal originalPrice;
    private Integer discountPercentage;
    private String description;
    private String material;
    private List<Long> categoryIds;
    private List<String> imageUrls;
    @Valid
    private List<AdminInventoryRowDTO> inventory;
}
