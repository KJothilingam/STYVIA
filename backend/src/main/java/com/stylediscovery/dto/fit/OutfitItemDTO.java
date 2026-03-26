package com.stylediscovery.dto.fit;

import com.stylediscovery.dto.ProductDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OutfitItemDTO {
    private ProductDTO product;
    private String suggestedSize;
    private double fitConfidence;
    private String categoryRole;
}
