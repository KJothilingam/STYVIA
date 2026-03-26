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

@RestController
@RequestMapping("/api/v1/shops")
@RequiredArgsConstructor
public class ShopController {

    private final ShopDiscoveryService shopDiscoveryService;

    @GetMapping("/nearby")
    public ResponseEntity<ApiResponse<List<ShopPlaceDTO>>> nearby(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "5000") int radiusMeters,
            @RequestParam(defaultValue = "false") boolean openNow) {
        List<ShopPlaceDTO> places = shopDiscoveryService.findNearbyClothingStores(lat, lng, radiusMeters, openNow);
        return ResponseEntity.ok(ApiResponse.success(places));
    }
}
