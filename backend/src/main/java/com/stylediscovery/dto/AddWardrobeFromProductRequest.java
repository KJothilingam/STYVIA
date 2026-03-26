package com.stylediscovery.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AddWardrobeFromProductRequest {
    @NotBlank
    @Size(max = 48)
    private String size;

    @NotBlank
    @Size(max = 100)
    private String color;

    /** Optional: store personalized fit score from Fit Studio when adding. */
    private Double fitConfidence;

    /** How many to add when merging a manual catalog entry (default 1). */
    @Min(1)
    @Max(99)
    private Integer quantity;
}
