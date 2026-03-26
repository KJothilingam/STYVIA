package com.stylediscovery.dto.ml;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MlUserFeaturesDTO {
    private Double height;
    private Double weight;
    private String bodyShape;
    private String shoulderType;
    private String fitPreference;
}
