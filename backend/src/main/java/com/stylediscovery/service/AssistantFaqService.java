package com.stylediscovery.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stylediscovery.dto.AssistantChatResponse;
import com.stylediscovery.dto.AssistantFaqEntry;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Pattern;

/**
 * Loads {@code assistant-faq.json} and matches user messages to canonical Q&amp;A replies.
 * Longer questions are tried first so specific phrases win over shorter substrings.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AssistantFaqService {

    private final ObjectMapper objectMapper;

    private List<AssistantFaqEntry> entries = List.of();

    @PostConstruct
    public void load() {
        try (InputStream in = new ClassPathResource("assistant-faq.json").getInputStream()) {
            List<AssistantFaqEntry> loaded = objectMapper.readValue(in, new TypeReference<>() {});
            List<AssistantFaqEntry> copy = new ArrayList<>(loaded);
            copy.sort(Comparator.comparingInt((AssistantFaqEntry e) -> -normalize(e.getQuestion()).length()));
            this.entries = List.copyOf(copy);
            log.info("Loaded {} assistant FAQ entries", this.entries.size());
        } catch (Exception e) {
            log.error("Failed to load assistant-faq.json: {}", e.getMessage());
            this.entries = List.of();
        }
    }

    public Optional<AssistantChatResponse> match(String userMessage) {
        if (userMessage == null || userMessage.isBlank()) {
            return Optional.empty();
        }
        String u = normalize(userMessage);
        if (u.isEmpty()) {
            return Optional.empty();
        }
        for (AssistantFaqEntry e : entries) {
            if (e.getQuestion() == null || e.getAnswer() == null) {
                continue;
            }
            String q = normalize(e.getQuestion());
            if (q.isEmpty()) {
                continue;
            }
            if (matches(u, q)) {
                AssistantChatResponse.AssistantChatResponseBuilder b = AssistantChatResponse.builder()
                        .reply(e.getAnswer())
                        .source("faq")
                        .intent("faq_match");
                if (e.getNavigateTo() != null && !e.getNavigateTo().isBlank()) {
                    b.navigateTo(e.getNavigateTo().trim());
                }
                return Optional.of(b.build());
            }
        }
        return Optional.empty();
    }

    static String normalize(String s) {
        String t = s.toLowerCase(Locale.ROOT).replace('\u2019', '\'').trim();
        t = t.replaceAll("[^a-z0-9\\s]", " ");
        t = t.replaceAll("\\s+", " ").trim();
        return t;
    }

    /**
     * Exact match, or multi-word substring containment, or single-word whole-word match
     * (avoids false positives like "hi" inside "history").
     */
    static boolean matches(String normUser, String normQ) {
        if (normUser.equals(normQ)) {
            return true;
        }
        if (normQ.contains(" ")) {
            return normUser.contains(normQ);
        }
        return Pattern.compile("\\b" + Pattern.quote(normQ) + "\\b").matcher(normUser).find();
    }
}
