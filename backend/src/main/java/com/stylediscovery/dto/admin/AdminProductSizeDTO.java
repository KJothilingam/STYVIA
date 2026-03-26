package com.stylediscovery.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminProductSizeDTO {
    private Long id;
    private String size;
    private Double chestMeasurementCm;
    private Double shoulderMeasurementCm;
    private Double waistMeasurementCm;
    private Double lengthCm;
    private Double hipMeasurementCm;
}
