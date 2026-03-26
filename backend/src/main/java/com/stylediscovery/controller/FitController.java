package com.stylediscovery.controller;

import com.stylediscovery.dto.ApiResponse;
import com.stylediscovery.dto.fit.FitCheckRequest;
import com.stylediscovery.dto.fit.FitCheckResponseDTO;
import com.stylediscovery.security.UserPrincipal;
import com.stylediscovery.service.FitConfidenceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/fit")
@RequiredArgsConstructor
public class FitController {

    private final FitConfidenceService fitConfidenceService;

    @PostMapping("/check")
    public ResponseEntity<ApiResponse<FitCheckResponseDTO>> checkFit(
            @AuthenticationPrincipal UserPrincipal user,
            @Valid @RequestBody FitCheckRequest body) {
        FitCheckResponseDTO dto = fitConfidenceService.checkFitForSelectedSize(user.getId(), body.getProductId(), body.getSize());
        return ResponseEntity.ok(ApiResponse.success(dto));
    }
}
