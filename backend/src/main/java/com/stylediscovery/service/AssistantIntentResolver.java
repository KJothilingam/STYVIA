package com.stylediscovery.service;

import com.stylediscovery.dto.AssistantChatResponse;
import org.springframework.stereotype.Component;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.regex.Pattern;

/**
 * Rule-based intent detection for in-app navigation and product browse URLs.
 * Runs before LLM calls so paths work without API keys.
 */
@Component
public class AssistantIntentResolver {

    private static final Pattern CATEGORY_KIDS = Pattern.compile(
            "\\b(kids?|children|child|toddlers?)\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern CATEGORY_WOMEN = Pattern.compile(
            "\\b(women|womens|women's|woman|ladies|lady)\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern CATEGORY_MEN = Pattern.compile(
            "\\b(men|mens|men's|man|gentlemen|gentleman)\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern CATEGORY_ACCESSORIES = Pattern.compile(
            "\\b(accessor(?:y|ies)|handbags?|jewel(?:lery|ry)|sunglasses|watches|belts?|caps?)\\b",
            Pattern.CASE_INSENSITIVE);

    private static final Pattern FIT_STUDIO = Pattern.compile(
            "\\b(fit\\s*studio|virtual\\s*fitting|size\\s*recommendation)\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern DONATION_BOX = Pattern.compile(
            "\\b(donation\\s*box|empty\\s*box|request\\s+a\\s+box)\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern DONATIONS = Pattern.compile("\\b(donat|pickup|give\\s+away\\s+clothes)\\b",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern SHOPS = Pattern.compile(
            "\\b(nearby\\s+shops?|near\\s+me|store\\s*locator|find\\s+stores?|shop\\s+map|maps?\\s+for\\s+shops)\\b",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern WARDROBE = Pattern.compile("\\bwardrobe\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern BODY = Pattern.compile("\\b(body\\s*profile|measurements?|my\\s+body)\\b",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern CART = Pattern.compile("\\b(cart|shopping\\s+bag|my\\s+bag)\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern ORDERS = Pattern.compile("\\b(orders?|track\\s+(?:an?\\s+)?order|my\\s+orders)\\b",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern WISHLIST = Pattern.compile("\\bwish\\s*list\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern CHECKOUT = Pattern.compile("\\bcheckout\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern PROFILE = Pattern.compile("\\b(my\\s+)?profile\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern HOME = Pattern.compile("\\b(go\\s+)?home\\b", Pattern.CASE_INSENSITIVE);

    private static final Set<String> STOP = Set.of(
            "a", "an", "the", "show", "me", "find", "look", "looking", "for", "i", "want", "need", "get", "buy",
            "some", "please", "can", "you", "to", "in", "of", "with", "go", "open", "take", "view", "browse", "shop",
            "section", "category", "stuff", "things", "something", "any", "where", "is", "are", "do", "does", "how",
            "about", "give", "see", "list", "all", "page", "navigate", "redirect", "like", "just", "only", "also",
            "really", "very");

    /** Not product keywords — “men’s dress / clothes” means browse the Men aisle, not text search for “dress”. */
    private static final Set<String> GENERIC_BROWSE_TERMS = Set.of(
            "dress", "dresses", "clothe", "clothes", "clothing", "cloths", "vlothes", "wear", "wearing", "outfit",
            "outfits",
            "fashion", "styles", "style", "garments", "garment", "collection", "collections", "items", "looks", "look",
            "apparel");

    public Optional<AssistantChatResponse> resolve(String raw) {
        if (raw == null || raw.isBlank()) {
            return Optional.empty();
        }
        String norm = raw.toLowerCase(Locale.ROOT).replace('’', '\'').replaceAll("\\s+", " ").trim();

        Optional<AssistantChatResponse> nav = tryFeatureRoutes(norm);
        if (nav.isPresent()) {
            return nav;
        }
        return tryCategoryBrowse(raw, norm);
    }

    private Optional<AssistantChatResponse> tryFeatureRoutes(String norm) {
        if (FIT_STUDIO.matcher(norm).find()) {
            return Optional.of(nav("/products",
                    "Open any product, then launch **Fit Studio** from its page (you’ll need a product selected). Browsing **Products** now.",
                    "nav_fit_studio"));
        }
        if (DONATION_BOX.matcher(norm).find()) {
            return Optional.of(nav("/donation-box",
                    "Opening **Donation box** — request a box and get a drop code.",
                    "nav_donation_box"));
        }
        if (DONATIONS.matcher(norm).find()) {
            return Optional.of(nav("/donations",
                    "Opening **Donations** — dress pickups and empty-box requests.",
                    "nav_donations"));
        }
        if (SHOPS.matcher(norm).find()) {
            return Optional.of(nav("/shops",
                    "Opening **Nearby shops** — see clothing stores on the map.",
                    "nav_shops"));
        }
        if (WARDROBE.matcher(norm).find()) {
            return Optional.of(nav("/wardrobe",
                    "Opening your **Wardrobe** — pieces from orders and wear logs.",
                    "nav_wardrobe"));
        }
        if (BODY.matcher(norm).find()) {
            return Optional.of(nav("/body",
                    "Opening **Body profile** — measurements power Fit Studio.",
                    "nav_body"));
        }
        if (CART.matcher(norm).find()) {
            return Optional.of(nav("/cart", "Opening your **Cart**.", "nav_cart"));
        }
        if (ORDERS.matcher(norm).find()) {
            return Optional.of(nav("/orders", "Opening **Orders**.", "nav_orders"));
        }
        if (WISHLIST.matcher(norm).find()) {
            return Optional.of(nav("/wishlist", "Opening **Wishlist**.", "nav_wishlist"));
        }
        if (CHECKOUT.matcher(norm).find()) {
            return Optional.of(nav("/checkout", "Opening **Checkout**.", "nav_checkout"));
        }
        if (PROFILE.matcher(norm).find()) {
            return Optional.of(nav("/profile", "Opening **Profile**.", "nav_profile"));
        }
        if (HOME.matcher(norm).find()) {
            return Optional.of(nav("/", "Taking you **home**.", "nav_home"));
        }
        return Optional.empty();
    }

    private Optional<AssistantChatResponse> tryCategoryBrowse(String raw, String norm) {
        String category = null;
        if (CATEGORY_KIDS.matcher(norm).find()) {
            category = "kids";
        } else if (CATEGORY_WOMEN.matcher(norm).find()) {
            category = "women";
        } else if (CATEGORY_MEN.matcher(norm).find()) {
            category = "men";
        } else if (CATEGORY_ACCESSORIES.matcher(norm).find()) {
            category = "accessories";
        }
        if (category == null) {
            return Optional.empty();
        }

        String stripped = CATEGORY_KIDS.matcher(norm).replaceAll(" ");
        stripped = CATEGORY_WOMEN.matcher(stripped).replaceAll(" ");
        stripped = CATEGORY_MEN.matcher(stripped).replaceAll(" ");
        stripped = CATEGORY_ACCESSORIES.matcher(stripped).replaceAll(" ");
        stripped = stripped.replaceAll("[^a-z0-9\\s]", " ");
        stripped = stripped.replaceAll("\\s+", " ").trim();

        StringBuilder search = new StringBuilder();
        for (String tok : stripped.split(" ")) {
            if (tok.isEmpty() || tok.length() < 2) {
                continue;
            }
            if (STOP.contains(tok)) {
                continue;
            }
            if (search.length() > 0) {
                search.append(' ');
            }
            search.append(tok);
        }
        String q = search.toString().trim();
        q = stripGenericBrowseTerms(q);

        String path = "/products?category=" + category;
        if (!q.isEmpty()) {
            path += "&search=" + URLEncoder.encode(q, StandardCharsets.UTF_8);
        }

        String label = category.substring(0, 1).toUpperCase(Locale.ROOT) + category.substring(1);
        String reply = q.isEmpty()
                ? "Opening **" + label + "** — browse the catalog."
                : "Opening **" + label + "** filtered with search **" + q + "**.";

        return Optional.of(AssistantChatResponse.builder()
                .reply(reply)
                .navigateTo(path)
                .intent("browse_category")
                .source("rules")
                .build());
    }

    private static AssistantChatResponse nav(String path, String reply, String intent) {
        return AssistantChatResponse.builder()
                .reply(reply)
                .navigateTo(path)
                .intent(intent)
                .source("rules")
                .build();
    }

    /** Drops aisle-browse filler words; keeps real keywords (e.g. nike, floral, party). */
    private static String stripGenericBrowseTerms(String q) {
        if (q == null || q.isBlank()) {
            return "";
        }
        return Arrays.stream(q.split("\\s+"))
                .map(String::trim)
                .filter(tok -> !tok.isEmpty() && !GENERIC_BROWSE_TERMS.contains(tok))
                .collect(Collectors.joining(" "));
    }
}
