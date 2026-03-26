package com.stylediscovery.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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

    /** Optional overrides (cm); omit or null to use height/weight estimates. */
    private Double chestCm;
    private Double shoulderCm;
    private Double waistCm;
    private Double lengthCm;

    @Size(max = 16)
    private String usualShirtSize;

    @Min(20)
    @Max(60)
    private Integer usualPantWaistInches;

    @Size(max = 32)
    private String usualShoeSize;

    @Size(max = 64)
    private String sareeStyle;

    private Boolean prefersFreeSize;
}
