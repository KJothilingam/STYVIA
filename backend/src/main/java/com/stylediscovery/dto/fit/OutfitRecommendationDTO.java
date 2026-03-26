package com.stylediscovery.dto.fit;

import com.stylediscovery.dto.ProductDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OutfitRecommendationDTO {
    private ProductDTO anchorProduct;
    private List<OutfitItemDTO> items;
    private String occasion;
    private String colorHarmonyNote;
    private Double overallConfidence;
    private String filteringNote;
}
