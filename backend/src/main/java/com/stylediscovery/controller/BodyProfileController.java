package com.stylediscovery.controller;

import com.stylediscovery.dto.ApiResponse;
import com.stylediscovery.dto.BodyProfileDTO;
import com.stylediscovery.security.UserPrincipal;
import com.stylediscovery.service.BodyProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/profile")
@RequiredArgsConstructor
public class BodyProfileController {

    private final BodyProfileService bodyProfileService;

    @GetMapping("/body")
    public ResponseEntity<ApiResponse<BodyProfileDTO>> getBody(@AuthenticationPrincipal UserPrincipal user) {
        BodyProfileDTO dto = bodyProfileService.getForUser(user.getId());
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @GetMapping("/body/exists")
    public ResponseEntity<ApiResponse<Boolean>> exists(@AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(ApiResponse.success(bodyProfileService.existsForUser(user.getId())));
    }

    @PostMapping("/body")
    public ResponseEntity<ApiResponse<BodyProfileDTO>> create(
            @AuthenticationPrincipal UserPrincipal user,
            @Valid @RequestBody BodyProfileDTO dto) {
        BodyProfileDTO saved = bodyProfileService.save(user.getId(), dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Profile saved", saved));
    }

    @PutMapping("/body")
    public ResponseEntity<ApiResponse<BodyProfileDTO>> update(
            @AuthenticationPrincipal UserPrincipal user,
            @Valid @RequestBody BodyProfileDTO dto) {
        BodyProfileDTO saved = bodyProfileService.save(user.getId(), dto);
        return ResponseEntity.ok(ApiResponse.success("Profile updated", saved));
    }
}
