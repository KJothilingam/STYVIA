package com.stylediscovery.service;

import com.stylediscovery.config.MlFitProperties;
import com.stylediscovery.dto.ml.MlPredictFitRequestDTO;
import com.stylediscovery.dto.ml.MlPredictFitResponseDTO;
import com.stylediscovery.dto.ml.MlTrainModelResponseDTO;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.OptionalDouble;

@Service
@RequiredArgsConstructor
public class MlFitClient {

    private static final Logger log = LoggerFactory.getLogger(MlFitClient.class);

    private final WebClient mlFitWebClient;
    private final MlFitProperties mlFitProperties;

    public OptionalDouble predictGoodFitProbability(MlPredictFitRequestDTO request) {
        if (!mlFitProperties.isEnabled()) {
            return OptionalDouble.empty();
        }
        try {
            MlPredictFitResponseDTO res = mlFitWebClient.post()
                    .uri("/predict-fit")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(MlPredictFitResponseDTO.class)
                    .timeout(Duration.ofMillis(mlFitProperties.getReadTimeoutMs() + mlFitProperties.getConnectTimeoutMs()))
                    .block();
            if (res == null) {
                return OptionalDouble.empty();
            }
            double p = res.getProbability();
            if (Double.isNaN(p) || p < 0 || p > 1) {
                return OptionalDouble.empty();
            }
            return OptionalDouble.of(p);
        } catch (WebClientResponseException e) {
            log.warn("ML predict HTTP error: {} {}", e.getStatusCode(), e.getResponseBodyAsString());
            return OptionalDouble.empty();
        } catch (Exception e) {
            log.warn("ML predict failed: {}", e.getMessage());
            return OptionalDouble.empty();
        }
    }

    public MlTrainModelResponseDTO trainModel(List<Map<String, Object>> rows) {
        if (!mlFitProperties.isEnabled()) {
            return MlTrainModelResponseDTO.builder()
                    .message("ML disabled in application config")
                    .build();
        }
        try {
            return mlFitWebClient.post()
                    .uri("/train-model")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(Map.of("rows", rows))
                    .retrieve()
                    .bodyToMono(MlTrainModelResponseDTO.class)
                    .timeout(Duration.ofMillis(120_000))
                    .block();
        } catch (Exception e) {
            log.error("ML train remote call failed", e);
            throw new IllegalStateException("ML training failed: " + e.getMessage(), e);
        }
    }
}
