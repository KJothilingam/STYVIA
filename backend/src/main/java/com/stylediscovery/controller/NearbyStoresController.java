package com.stylediscovery.controller;

import com.stylediscovery.dto.ApiResponse;
import com.stylediscovery.dto.ShopPlaceDTO;
import com.stylediscovery.service.ShopDiscoveryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Public store locator: Google Places key stays server-side only.
 */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class NearbyStoresController {

    private final ShopDiscoveryService shopDiscoveryService;

    /**
     * Nearby clothing stores (Google Places Nearby Search, type=clothing_store).
     *
     * @param lat    latitude
     * @param lng    longitude
     * @param radius search radius in meters (default 5000, clamped 100–50000)
     * @param openNow when true, adds Places {@code opennow=true}
     */
    @GetMapping("/nearby-stores")
    public ResponseEntity<ApiResponse<List<ShopPlaceDTO>>> nearbyStores(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "5000") int radius,
            @RequestParam(defaultValue = "false") boolean openNow) {
        List<ShopPlaceDTO> places = shopDiscoveryService.findNearbyClothingStores(lat, lng, radius, openNow);
        return ResponseEntity.ok(ApiResponse.success(places));
    }
}
