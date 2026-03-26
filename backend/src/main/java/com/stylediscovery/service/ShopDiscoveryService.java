package com.stylediscovery.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stylediscovery.dto.ShopPlaceDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ShopDiscoveryService {

    private final ObjectMapper objectMapper;

    @Value("${app.google.places-api-key:}")
    private String placesApiKey;

    private static final HttpClient HTTP = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    private static final int MAX_RESULTS = 20;

    public List<ShopPlaceDTO> findNearbyClothingStores(double lat, double lng, int radiusMeters) {
        return findNearbyClothingStores(lat, lng, radiusMeters, false);
    }

    /**
     * Calls Google Places Nearby Search. Returns an empty list when the key is missing, on HTTP/API errors,
     * or when there are zero results (no mock data).
     */
    public List<ShopPlaceDTO> findNearbyClothingStores(double lat, double lng, int radiusMeters, boolean openNowOnly) {
        if (placesApiKey == null || placesApiKey.isBlank()) {
            log.warn("Google Places API key is not configured (app.google.places-api-key / GOOGLE_PLACES_API_KEY)");
            return Collections.emptyList();
        }
        int radius = Math.min(Math.max(radiusMeters, 100), 50_000);
        try {
            String loc = URLEncoder.encode(lat + "," + lng, StandardCharsets.UTF_8);
            String keyEnc = URLEncoder.encode(placesApiKey, StandardCharsets.UTF_8);
            StringBuilder url = new StringBuilder(String.format(
                    "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=%s&radius=%d&type=clothing_store&key=%s",
                    loc, radius, keyEnc));
            if (openNowOnly) {
                url.append("&opennow=true");
            }
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(url.toString()))
                    .timeout(Duration.ofSeconds(12))
                    .GET()
                    .build();
            HttpResponse<String> res = HTTP.send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() != 200) {
                log.warn("Places Nearby Search HTTP status {}", res.statusCode());
                return Collections.emptyList();
            }
            JsonNode root = objectMapper.readTree(res.body());
            String status = root.path("status").asText("");
            if ("ZERO_RESULTS".equals(status)) {
                return Collections.emptyList();
            }
            if (!"OK".equals(status)) {
                String errMsg = root.path("error_message").asText("");
                log.warn(
                        "Places Nearby Search status={} error_message={}. If status=REQUEST_DENIED, use a server key: "
                                + "Application restrictions must NOT be 'HTTP referrers' (Java has no referrer). "
                                + "Use separate keys: browser key (referrers) for VITE_GOOGLE_MAPS_API_KEY, "
                                + "server key (IP or none) for GOOGLE_PLACES_API_KEY.",
                        status,
                        errMsg);
                return Collections.emptyList();
            }
            List<ShopPlaceDTO> out = new ArrayList<>();
            for (JsonNode r : root.path("results")) {
                double rlat = r.path("geometry").path("location").path("lat").asDouble();
                double rlng = r.path("geometry").path("location").path("lng").asDouble();
                boolean open = r.path("opening_hours").path("open_now").asBoolean(false);
                out.add(ShopPlaceDTO.builder()
                        .name(r.path("name").asText("Store"))
                        .address(r.path("vicinity").asText(""))
                        .lat(rlat)
                        .lng(rlng)
                        .rating(r.path("rating").isMissingNode() ? null : r.path("rating").asDouble())
                        .placeId(r.path("place_id").asText(""))
                        .openNow(open)
                        .build());
                if (out.size() >= MAX_RESULTS) {
                    break;
                }
            }
            return out;
        } catch (Exception e) {
            log.warn("Places lookup failed: {}", e.getMessage());
            return Collections.emptyList();
        }
    }
}
