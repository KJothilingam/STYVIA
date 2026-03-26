package com.stylediscovery.controller;

import com.stylediscovery.dto.*;
import com.stylediscovery.security.UserPrincipal;
import com.stylediscovery.service.DonationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/donations")
@RequiredArgsConstructor
public class DonationController {

    private final DonationService donationService;

    @GetMapping("/pickups")
    public ResponseEntity<ApiResponse<List<DonationPickupRequestDTO>>> listPickups(
            @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(ApiResponse.success(donationService.listPickups(user.getId())));
    }

    @PostMapping("/pickups")
    public ResponseEntity<ApiResponse<DonationPickupRequestDTO>> createPickup(
            @AuthenticationPrincipal UserPrincipal user,
            @Valid @RequestBody CreateDonationPickupRequest body) {
        DonationPickupRequestDTO dto = donationService.createPickup(user.getId(), body);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Pickup requested", dto));
    }

    @GetMapping("/boxes")
    public ResponseEntity<ApiResponse<List<DonationBoxRequestDTO>>> listBoxes(
            @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(ApiResponse.success(donationService.listBoxes(user.getId())));
    }

    @PostMapping("/boxes")
    public ResponseEntity<ApiResponse<DonationBoxRequestDTO>> requestBox(
            @AuthenticationPrincipal UserPrincipal user,
            @Valid @RequestBody CreateDonationBoxRequest body) {
        DonationBoxRequestDTO dto = donationService.requestBox(user.getId(), body);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Donation box scheduled", dto));
    }

    /** Public: staff / partner verifies QR payload without auth */
    @GetMapping("/drop-verify/{token}")
    public ResponseEntity<ApiResponse<DropVerifyResponse>> verifyDrop(@PathVariable String token) {
        return ResponseEntity.ok(ApiResponse.success(donationService.verifyDropToken(token)));
    }
}
