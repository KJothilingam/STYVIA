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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

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

    private static final int MAX_MERGED_RESULTS = 24;
    private static final int PER_TYPE_SOFT_CAP = 12;

    /** Clothing & fashion-related Nearby Search types (one request each; merged, deduped). */
    private static final String[] FASHION_NEARBY_TYPES = {
            "clothing_store",
            "shoe_store",
            "shopping_mall",
    };

    public List<ShopPlaceDTO> findNearbyClothingStores(double lat, double lng, int radiusMeters) {
        return findNearbyClothingStores(lat, lng, radiusMeters, false);
    }

    /**
     * Google Places Nearby Search — multiple types merged by {@code place_id}.
     */
    public List<ShopPlaceDTO> findNearbyClothingStores(double lat, double lng, int radiusMeters, boolean openNowOnly) {
        if (placesApiKey == null || placesApiKey.isBlank()) {
            log.warn("Google Places API key is not configured (app.google.places-api-key / GOOGLE_PLACES_API_KEY)");
            return Collections.emptyList();
        }
        int radius = Math.min(Math.max(radiusMeters, 100), 50_000);
        String key = placesApiKey.trim();

        Map<String, ShopPlaceDTO> byPlaceId = new LinkedHashMap<>();
        for (String type : FASHION_NEARBY_TYPES) {
            List<ShopPlaceDTO> batch = fetchNearbyForType(lat, lng, radius, openNowOnly, type, key);
            for (ShopPlaceDTO p : batch) {
                if (p.getPlaceId() != null && !p.getPlaceId().isBlank()) {
                    byPlaceId.putIfAbsent(p.getPlaceId(), p);
                }
            }
            if (byPlaceId.size() >= MAX_MERGED_RESULTS) {
                break;
            }
        }
        return new ArrayList<>(byPlaceId.values()).stream().limit(MAX_MERGED_RESULTS).toList();
    }

    private List<ShopPlaceDTO> fetchNearbyForType(
            double lat,
            double lng,
            int radiusMeters,
            boolean openNowOnly,
            String placeType,
            String apiKey) {
        List<ShopPlaceDTO> out = new ArrayList<>();
        try {
            String loc = URLEncoder.encode(lat + "," + lng, StandardCharsets.UTF_8);
            String typeEnc = URLEncoder.encode(placeType, StandardCharsets.UTF_8);
            String keyEnc = URLEncoder.encode(apiKey, StandardCharsets.UTF_8);
            StringBuilder url = new StringBuilder(String.format(
                    "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=%s&radius=%d&type=%s&key=%s",
                    loc, radiusMeters, typeEnc, keyEnc));
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
                log.warn("Places Nearby Search HTTP status {} type={}", res.statusCode(), placeType);
                return out;
            }
            JsonNode root = objectMapper.readTree(res.body());
            String status = root.path("status").asText("");
            if ("ZERO_RESULTS".equals(status)) {
                return out;
            }
            if (!"OK".equals(status)) {
                String errMsg = root.path("error_message").asText("");
                log.warn("Places Nearby Search status={} type={} err={}", status, placeType, errMsg);
                return out;
            }
            for (JsonNode r : root.path("results")) {
                ShopPlaceDTO dto = parsePlace(r, apiKey);
                if (dto != null) {
                    out.add(dto);
                }
                if (out.size() >= PER_TYPE_SOFT_CAP) {
                    break;
                }
            }
        } catch (Exception e) {
            log.warn("Places lookup type={} failed: {}", placeType, e.getMessage());
        }
        return out;
    }

    private ShopPlaceDTO parsePlace(JsonNode r, String apiKey) {
        String placeId = r.path("place_id").asText("").trim();
        if (placeId.isEmpty()) {
            return null;
        }
        double rlat = r.path("geometry").path("location").path("lat").asDouble();
        double rlng = r.path("geometry").path("location").path("lng").asDouble();
        boolean open = r.path("opening_hours").path("open_now").asBoolean(false);
        String name = r.path("name").asText("Store");
        String vicinity = r.path("vicinity").asText("");
        Double rating = r.path("rating").isMissingNode() ? null : r.path("rating").asDouble();
        int userRatingsTotal = r.path("user_ratings_total").asInt(0);

        List<String> types = new ArrayList<>();
        for (JsonNode t : r.path("types")) {
            String raw = t.asText("").replace("_", " ").trim();
            if (!raw.isEmpty()) {
                types.add(capitalizeWords(raw));
            }
        }
        if (types.isEmpty()) {
            types = null;
        }

        String googleMapsUrl;
        try {
            googleMapsUrl = "https://www.google.com/maps/search/?api=1&query_place_id="
                    + URLEncoder.encode(placeId, StandardCharsets.UTF_8);
        } catch (Exception e) {
            googleMapsUrl = null;
        }

        String photoUrl = null;
        JsonNode photos = r.path("photos");
        if (photos.isArray() && !photos.isEmpty()) {
            String ref = photos.get(0).path("photo_reference").asText("").trim();
            if (!ref.isEmpty()) {
                try {
                    photoUrl = "https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference="
                            + URLEncoder.encode(ref, StandardCharsets.UTF_8)
                            + "&key="
                            + URLEncoder.encode(apiKey, StandardCharsets.UTF_8);
                } catch (Exception ignored) {
                    photoUrl = null;
                }
            }
        }

        return ShopPlaceDTO.builder()
                .name(name)
                .address(vicinity)
                .lat(rlat)
                .lng(rlng)
                .rating(rating)
                .placeId(placeId)
                .openNow(open)
                .googleMapsUrl(googleMapsUrl)
                .photoUrl(photoUrl)
                .userRatingsTotal(userRatingsTotal > 0 ? userRatingsTotal : null)
                .types(types)
                .build();
    }

    private static String capitalizeWords(String s) {
        String[] parts = s.toLowerCase(Locale.ROOT).split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < parts.length; i++) {
            if (i > 0) sb.append(' ');
            if (parts[i].isEmpty()) continue;
            sb.append(Character.toUpperCase(parts[i].charAt(0))).append(parts[i].substring(1));
        }
        return sb.toString();
    }
}
