package com.stylediscovery.dto.fit;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FitCheckComparisonDTO {
    /** Garment cm − body estimate (cm), rounded. Positive ≈ more room in garment. */
    private int chestDiff;
    private int shoulderDiff;

    private int bodyChestCm;
    private int garmentChestCm;
    private int bodyShoulderCm;
    private int garmentShoulderCm;
    private int bodyWaistCm;
    private int garmentWaistCm;
    private int bodyLengthCm;
    private int garmentLengthCm;
}
