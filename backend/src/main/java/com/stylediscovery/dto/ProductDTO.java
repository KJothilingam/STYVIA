package com.stylediscovery.dto;

import com.stylediscovery.enums.Gender;
import com.stylediscovery.enums.ProductStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductDTO {
    private Long id;
    private String name;
    private String slug;
    private String description;
    private String brand;
    private Gender gender;
    private BigDecimal price;
    private BigDecimal originalPrice;
    private Integer discountPercentage;
    private String material;
    private BigDecimal rating;
    private Integer reviewCount;
    private ProductStatus status;
    private List<String> images;
    private List<String> sizes;
    private List<ColorDTO> colors;
    private List<CategoryDTO> categories;
}

