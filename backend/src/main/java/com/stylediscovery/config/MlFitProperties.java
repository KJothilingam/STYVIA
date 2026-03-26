package com.stylediscovery.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "app.ml")
public class MlFitProperties {

    /** When false, hybrid scoring uses rule path only (no HTTP calls). */
    private boolean enabled = true;

    private String baseUrl = "http://localhost:8090";

    private int connectTimeoutMs = 2000;

    private int readTimeoutMs = 5000;

    /** Blend: final = ruleWeight * ruleScore + mlWeight * (probability * 100). */
    private double ruleWeight = 0.7;

    private double mlWeight = 0.3;
}
