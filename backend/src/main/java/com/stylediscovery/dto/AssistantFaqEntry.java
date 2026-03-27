package com.stylediscovery.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class AssistantFaqEntry {
    private String question;
    private String answer;
    /** Optional in-app path with query string */
    private String navigateTo;
}
