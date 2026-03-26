package com.stylediscovery.dto.fit;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SizeMeasurementsBreakdownDTO {
    private MeasurementPointDTO chest;
    private MeasurementPointDTO shoulder;
    private MeasurementPointDTO waist;
    private MeasurementPointDTO length;
}
