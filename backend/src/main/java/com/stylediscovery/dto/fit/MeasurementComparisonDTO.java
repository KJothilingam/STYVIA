package com.stylediscovery.dto.fit;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MeasurementComparisonDTO {
    private MeasureBarDTO chest;
    private MeasureBarDTO shoulder;
    private MeasureBarDTO waist;
    private MeasureBarDTO length;
}
