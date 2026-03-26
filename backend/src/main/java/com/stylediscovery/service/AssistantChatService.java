package com.stylediscovery.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.stylediscovery.dto.AssistantChatResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j
public class AssistantChatService {

    private final ObjectMapper objectMapper;

    @Value("${app.assistant.openai-api-key:}")
    private String openAiKey;

    @Value("${app.assistant.model:gpt-4o-mini}")
    private String model;

    private static final HttpClient HTTP = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    private static final String SYSTEM = """
            You are Styvia Style Assistant for an AI-powered fashion e-commerce app (India).
            Help with: size & fit (suggest Fit Studio and body profile), navigation (/products, /wardrobe, /donations, /shops),
            sustainability (donations, donation box), and cart/checkout. Keep answers concise, friendly, and actionable.
            If the user asks for medical or body-shaming content, refuse politely and offer generic sizing tips.
            """;

    public AssistantChatResponse chat(String userMessage) {
        String trimmed = userMessage == null ? "" : userMessage.trim();
        if (trimmed.isEmpty()) {
            return AssistantChatResponse.builder()
                    .reply("Ask me anything about shopping, fit, wardrobe, or donations.")
                    .source("rules")
                    .build();
        }

        AssistantChatResponse rules = ruleBasedReply(trimmed);
        if (rules != null) {
            return rules;
        }

        if (openAiKey == null || openAiKey.isBlank()) {
            return AssistantChatResponse.builder()
                    .reply("I’m running in **offline mode**. Set `OPENAI_API_KEY` (or `app.assistant.openai-api-key`) on the server for full AI answers. "
                            + "Meanwhile: open **Products** to browse, **Fit Studio** from a product page for size help, **Wardrobe** after you buy, and **Donations** to schedule a pickup.")
                    .source("rules")
                    .build();
        }

        try {
            ObjectNode body = objectMapper.createObjectNode();
            body.put("model", model);
            ArrayNode messages = body.putArray("messages");
            ObjectNode sys = messages.addObject();
            sys.put("role", "system");
            sys.put("content", SYSTEM);
            ObjectNode usr = messages.addObject();
            usr.put("role", "user");
            usr.put("content", trimmed);
            body.put("max_tokens", 600);

            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.openai.com/v1/chat/completions"))
                    .timeout(Duration.ofSeconds(25))
                    .header("Authorization", "Bearer " + openAiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body), StandardCharsets.UTF_8))
                    .build();
            HttpResponse<String> res = HTTP.send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() != 200) {
                log.warn("OpenAI HTTP {}", res.statusCode());
                return fallback(trimmed);
            }
            JsonNode root = objectMapper.readTree(res.body());
            String text = root.path("choices").path(0).path("message").path("content").asText("").trim();
            if (text.isEmpty()) {
                return fallback(trimmed);
            }
            return AssistantChatResponse.builder().reply(text).source("openai").build();
        } catch (Exception e) {
            log.debug("OpenAI error: {}", e.getMessage());
            return fallback(trimmed);
        }
    }

    private AssistantChatResponse fallback(String trimmed) {
        AssistantChatResponse r = ruleBasedReply(trimmed);
        if (r != null) return r;
        return AssistantChatResponse.builder()
                .reply("I couldn’t reach the AI service. Try again shortly, or browse **Products** and use **Fit Studio** for sizing.")
                .source("rules")
                .build();
    }

    private AssistantChatResponse ruleBasedReply(String m) {
        String low = m.toLowerCase(Locale.ROOT);
        if (low.contains("fit") || low.contains("size") || low.contains("shirt")) {
            return AssistantChatResponse.builder()
                    .reply("For the best size match: open any product → **Fit Studio** (or `/fit-studio/{productId}`). Save your **body profile** under **Profile** so scores stay accurate.")
                    .source("rules")
                    .build();
        }
        if (low.contains("wardrobe")) {
            return AssistantChatResponse.builder()
                    .reply("Your **Wardrobe** (`/wardrobe`) lists purchases after delivery. Sync from orders, log wears, and schedule donations when you’re ready.")
                    .source("rules")
                    .build();
        }
        if (low.contains("donat")) {
            return AssistantChatResponse.builder()
                    .reply("Use **Donations** (`/donations`) to request a pickup partner, or **Donation box** (`/donation-box`) for a box with a QR drop code.")
                    .source("rules")
                    .build();
        }
        if (low.contains("shop") || low.contains("store") || low.contains("nearby") || low.contains("map")) {
            return AssistantChatResponse.builder()
                    .reply("Open **Nearby shops** (`/shops`) to see clothing stores near you. With `GOOGLE_PLACES_API_KEY` on the server, results are live; otherwise you’ll see demo pins.")
                    .source("rules")
                    .build();
        }
        if (low.contains("cart") || low.contains("checkout") || low.contains("order")) {
            return AssistantChatResponse.builder()
                    .reply("Add items from the product page, review **Cart**, then **Checkout**. Track orders under **Orders**.")
                    .source("rules")
                    .build();
        }
        if (low.contains("hello") || low.contains("hi ") || low.equals("hi")) {
            return AssistantChatResponse.builder()
                    .reply("Hi! I’m the Styvia assistant — ask about fit, wardrobe, donations, or finding stores nearby.")
                    .source("rules")
                    .build();
        }
        return null;
    }
}
