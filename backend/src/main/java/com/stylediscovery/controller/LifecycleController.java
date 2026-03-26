package com.stylediscovery.controller;

import com.stylediscovery.dto.ApiResponse;
import com.stylediscovery.dto.lifecycle.LifecycleInsightsDTO;
import com.stylediscovery.security.UserPrincipal;
import com.stylediscovery.service.LifecycleInsightsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/lifecycle")
@RequiredArgsConstructor
public class LifecycleController {

    private final LifecycleInsightsService lifecycleInsightsService;

    @GetMapping("/insights")
    public ResponseEntity<ApiResponse<LifecycleInsightsDTO>> insights(@AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(ApiResponse.success(lifecycleInsightsService.insights(user.getId())));
    }
}
