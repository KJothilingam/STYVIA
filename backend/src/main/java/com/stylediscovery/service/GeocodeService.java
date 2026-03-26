package com.stylediscovery.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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

@Service
@RequiredArgsConstructor
@Slf4j
public class GeocodeService {

    private final ObjectMapper objectMapper;

    @Value("${app.google.geocoding-api-key:}")
    private String geocodingApiKey;

    private static final HttpClient HTTP = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    public String reverseGeocode(double lat, double lng) {
        if (geocodingApiKey == null || geocodingApiKey.isBlank()) {
            return fallbackLabel(lat, lng);
        }
        try {
            String keyEnc = URLEncoder.encode(geocodingApiKey.trim(), StandardCharsets.UTF_8);
            String url = String.format(
                    "https://maps.googleapis.com/maps/api/geocode/json?latlng=%f,%f&key=%s",
                    lat, lng, keyEnc);
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(8))
                    .GET()
                    .build();
            HttpResponse<String> res = HTTP.send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() != 200) {
                return fallbackLabel(lat, lng);
            }
            JsonNode root = objectMapper.readTree(res.body());
            if (!"OK".equals(root.path("status").asText())) {
                return fallbackLabel(lat, lng);
            }
            JsonNode results = root.path("results");
            if (!results.isArray() || results.isEmpty()) {
                return fallbackLabel(lat, lng);
            }
            String formatted = results.get(0).path("formatted_address").asText("").trim();
            return formatted.isEmpty() ? fallbackLabel(lat, lng) : formatted;
        } catch (Exception e) {
            log.debug("Reverse geocode failed: {}", e.getMessage());
            return fallbackLabel(lat, lng);
        }
    }

    private static String fallbackLabel(double lat, double lng) {
        return String.format("Map point (%.5f, %.5f)", lat, lng);
    }
}
