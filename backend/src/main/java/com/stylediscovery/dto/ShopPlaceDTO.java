package com.stylediscovery.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ShopPlaceDTO {
    private String name;
    private String address;
    private double lat;
    private double lng;
    private Double rating;
    private String placeId;
    private boolean openNow;
    /** Google Maps URL (open in new tab). */
    private String googleMapsUrl;
    /** Places Photo API URL when a photo exists. */
    private String photoUrl;
    private Integer userRatingsTotal;
    private List<String> types;
}
