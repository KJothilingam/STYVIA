package com.stylediscovery.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BodyProfileDTO {
    private Long id;
    private Long userId;
    @NotNull
    private Double heightCm;
    @NotNull
    private Double weightKg;
    @NotBlank
    private String gender;
    @NotBlank
    private String bodyShape;
    @NotBlank
    private String shoulderWidth;
    @NotBlank
    private String chestType;
    @NotBlank
    private String waistType;
    @NotBlank
    private String fitPreference;
}
