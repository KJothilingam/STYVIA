package com.stylediscovery.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopPlaceDTO {
    private String name;
    private String address;
    private double lat;
    private double lng;
    private Double rating;
    private String placeId;
    private boolean openNow;
}
