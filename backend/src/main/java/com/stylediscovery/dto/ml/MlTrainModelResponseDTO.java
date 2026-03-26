package com.stylediscovery.dto.ml;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MlTrainModelResponseDTO {
    private String message;
    private Double accuracy;
    private String modelPath;
    private Integer nTrain;
    private Integer nTest;
}
