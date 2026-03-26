package com.stylediscovery.dto.ml;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MlPredictFitRequestDTO {
    private MlUserFeaturesDTO userFeatures;
    private MlProductFeaturesDTO productFeatures;
    private String size;
}
