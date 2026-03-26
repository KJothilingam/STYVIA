package com.stylediscovery.controller;

import com.stylediscovery.dto.ApiResponse;
import com.stylediscovery.service.GeocodeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public map helpers (geocoding via server to avoid browser CORS on Geocoding REST).
 */
@RestController
@RequestMapping("/api/v1/maps")
@RequiredArgsConstructor
public class MapsController {

    private final GeocodeService geocodeService;

    @GetMapping("/reverse-geocode")
    public ResponseEntity<ApiResponse<String>> reverseGeocode(
            @RequestParam double lat,
            @RequestParam double lng) {
        String address = geocodeService.reverseGeocode(lat, lng);
        return ResponseEntity.ok(ApiResponse.success(address));
    }
}
