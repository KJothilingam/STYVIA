package com.stylediscovery.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssistantChatResponse {
    private String reply;
    /** "rules", "gemini", or "openai" */
    private String source;
    /** In-app path (with query string) for the client to navigate to, e.g. /products?category=kids&search=adidas */
    private String navigateTo;
    /** Short intent id for analytics or UI (e.g. browse_category, nav_cart) */
    private String intent;
}
