package com.stylediscovery.dto.ml;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MlProductFeaturesDTO {
    private Double chest;
    private Double waist;
    private Double shoulder;
    private String stretchLevel;
}
