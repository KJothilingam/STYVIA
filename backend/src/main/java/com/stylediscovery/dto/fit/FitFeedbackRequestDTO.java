package com.stylediscovery.dto.fit;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FitFeedbackRequestDTO {
    @NotBlank
    private String size;
    @NotBlank
    private String feedback;
}
