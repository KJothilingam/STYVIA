package com.stylediscovery.dto.lifecycle;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LifecycleInsightsDTO {
    private List<LifecycleItemInsightDTO> items;
}
