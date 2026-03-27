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
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.util.Optional;
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
    private final AssistantFaqService assistantFaqService;
    private final AssistantIntentResolver intentResolver;

    @Value("${app.assistant.openai-api-key:}")
    private String openAiKey;

    @Value("${app.assistant.model:gpt-4o-mini}")
    private String openAiModel;

    @Value("${app.assistant.gemini-api-key:}")
    private String geminiKey;

    @Value("${app.assistant.gemini-model:gemini-2.0-flash}")
    private String geminiModel;

    private static final HttpClient HTTP = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    private static final String SYSTEM = """
            You are Styvia Style Assistant for an AI-powered fashion e-commerce app (India).
            Help with: size & fit (suggest Fit Studio and body profile), navigation (/products, /wardrobe, /donations, /shops),
            sustainability (donations, donation box), and cart/checkout. Keep answers concise, friendly, and actionable.
            If the user asks for medical or body-shaming content, refuse politely and offer generic sizing tips.
            For general knowledge questions unrelated to shopping, answer helpfully and briefly, then you may gently mention Styvia if relevant.
            """;

    public AssistantChatResponse chat(String userMessage) {
        String trimmed = userMessage == null ? "" : userMessage.trim();
        if (trimmed.isEmpty()) {
            return AssistantChatResponse.builder()
                    .reply("Ask me anything about shopping, fit, wardrobe, donations — or general topics.")
                    .source("rules")
                    .build();
        }

        Optional<AssistantChatResponse> faqHit = assistantFaqService.match(trimmed);
        if (faqHit.isPresent()) {
            return faqHit.get();
        }

        Optional<AssistantChatResponse> navigated = intentResolver.resolve(trimmed);
        if (navigated.isPresent()) {
            return navigated.get();
        }

        AssistantChatResponse rules = ruleBasedReply(trimmed);
        if (rules != null) {
            return rules;
        }

        if (geminiKey != null && !geminiKey.isBlank()) {
            AssistantChatResponse gemini = callGemini(trimmed);
            if (gemini != null) {
                return gemini;
            }
        }

        if (openAiKey != null && !openAiKey.isBlank()) {
            AssistantChatResponse oai = callOpenAi(trimmed);
            if (oai != null) {
                return oai;
            }
        }

        return AssistantChatResponse.builder()
                .reply("Sorry for the inconvenience, I couldn't find an answer to that.")
                .source("rules")
                .build();
    }

    private AssistantChatResponse callGemini(String trimmed) {
        try {
            String encodedKey = URLEncoder.encode(geminiKey.trim(), StandardCharsets.UTF_8);
            String url = "https://generativelanguage.googleapis.com/v1beta/models/"
                    + URLEncoder.encode(geminiModel.trim(), StandardCharsets.UTF_8)
                    + ":generateContent?key=" + encodedKey;

            ObjectNode rootNode = objectMapper.createObjectNode();
            ObjectNode sysInstr = rootNode.putObject("systemInstruction");
            ArrayNode sysParts = sysInstr.putArray("parts");
            sysParts.addObject().put("text", SYSTEM);

            ArrayNode contents = rootNode.putArray("contents");
            ObjectNode userTurn = contents.addObject();
            userTurn.put("role", "user");
            userTurn.putArray("parts").addObject().put("text", trimmed);

            ObjectNode genCfg = rootNode.putObject("generationConfig");
            genCfg.put("maxOutputTokens", 1024);
            genCfg.put("temperature", 0.7);

            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(45))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(rootNode), StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> res = HTTP.send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() != 200) {
                log.warn("Gemini HTTP {} body snippet: {}", res.statusCode(), truncate(res.body(), 200));
                return null;
            }
            JsonNode root = objectMapper.readTree(res.body());
            JsonNode candidates = root.path("candidates");
            if (!candidates.isArray() || candidates.isEmpty()) {
                log.warn("Gemini empty candidates");
                return null;
            }
            JsonNode parts = candidates.get(0).path("content").path("parts");
            if (!parts.isArray() || parts.isEmpty()) {
                return null;
            }
            StringBuilder text = new StringBuilder();
            for (JsonNode p : parts) {
                if (p.has("text")) {
                    text.append(p.path("text").asText(""));
                }
            }
            String out = text.toString().trim();
            if (out.isEmpty()) {
                return null;
            }
            return AssistantChatResponse.builder().reply(out).source("gemini").build();
        } catch (Exception e) {
            log.warn("Gemini error: {}", e.getMessage());
            return null;
        }
    }

    private AssistantChatResponse callOpenAi(String trimmed) {
        try {
            ObjectNode body = objectMapper.createObjectNode();
            body.put("model", openAiModel);
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
                return null;
            }
            JsonNode root = objectMapper.readTree(res.body());
            String text = root.path("choices").path(0).path("message").path("content").asText("").trim();
            if (text.isEmpty()) {
                return null;
            }
            return AssistantChatResponse.builder().reply(text).source("openai").build();
        } catch (Exception e) {
            log.debug("OpenAI error: {}", e.getMessage());
            return null;
        }
    }

    private static String truncate(String s, int max) {
        if (s == null) return "";
        return s.length() <= max ? s : s.substring(0, max) + "…";
    }

    private AssistantChatResponse ruleBasedReply(String m) {
        String low = m.toLowerCase(Locale.ROOT);
        if (low.contains("what is your name")
                || low.contains("what's your name")
                || low.contains("who are you")
                || (low.contains("your name") && (low.contains("what") || low.contains("who")))) {
            return AssistantChatResponse.builder()
                    .reply("I’m **Styvia**, your in-app style assistant — here to help with products, fit, wardrobe, donations, and stores.")
                    .source("rules")
                    .build();
        }
        if (low.contains("what can you do")
                || low.contains("what do you do")
                || low.contains("how can you help")) {
            return AssistantChatResponse.builder()
                    .reply("I can **browse** categories (men, women, kids, accessories), **search** products, open **Fit Studio** from a product, **Wardrobe**, **Donations** / donation box, **nearby shops**, **cart** & checkout, and answer general questions when AI is enabled.")
                    .source("rules")
                    .build();
        }
        if (low.equals("bye")
                || low.startsWith("bye ")
                || low.startsWith("goodbye")
                || low.contains("see you")
                || low.contains("talk later")) {
            return AssistantChatResponse.builder()
                    .reply("Goodbye — enjoy styling with Styvia!")
                    .source("rules")
                    .build();
        }
        if (low.contains("fit") || low.contains("size") || low.contains("shirt") || low.contains("measure")) {
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
        if (low.contains("product") && (low.contains("where") || low.contains("browse") || low.contains("find"))) {
            return AssistantChatResponse.builder()
                    .reply("Browse the catalog from **Products** (`/products`) — filter by category, search, or open any item for details and **Fit Studio**.")
                    .source("rules")
                    .build();
        }
        if (low.contains("profile") || low.contains("body profile") || low.contains("/body")) {
            return AssistantChatResponse.builder()
                    .reply("Update your measurements in **Body profile** (`/body`) — used across Fit Studio and personalized fit hints.")
                    .source("rules")
                    .build();
        }
        if (low.contains("hello") || low.contains("hi ") || low.equals("hi") || low.startsWith("hey")) {
            return AssistantChatResponse.builder()
                    .reply("Hi! I’m the Styvia assistant — ask about fit, wardrobe, donations, stores, or anything else.")
                    .source("rules")
                    .build();
        }
        if (low.contains("thank")) {
            return AssistantChatResponse.builder()
                    .reply("You’re welcome — happy shopping with Styvia!")
                    .source("rules")
                    .build();
        }
        return null;
    }
}
