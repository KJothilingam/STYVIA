package com.stylediscovery.controller;

import com.stylediscovery.dto.ApiResponse;
import com.stylediscovery.dto.admin.AdminAcceptDonationPickupRequest;
import com.stylediscovery.dto.admin.AdminCompleteDonationPickupRequest;
import com.stylediscovery.dto.admin.AdminDonationBoxDTO;
import com.stylediscovery.dto.admin.AdminDonationPickupDTO;
import com.stylediscovery.dto.admin.AdminScheduleDonationPickupRequest;
import com.stylediscovery.service.DonationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/donations")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminDonationController {

    private final DonationService donationService;

    @GetMapping("/pickups")
    public ResponseEntity<ApiResponse<List<AdminDonationPickupDTO>>> listPickups() {
        return ResponseEntity.ok(ApiResponse.success(donationService.listPickupsForAdmin()));
    }

    /** Pickups-only pending count (legacy clients). */
    @GetMapping("/pickups/pending-count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> pendingPickupCount() {
        long n = donationService.countPendingPickups();
        return ResponseEntity.ok(ApiResponse.success(Map.of("count", n)));
    }

    /** Pickups + empty-box requests awaiting admin (sidebar badge). */
    @GetMapping("/pending-summary")
    public ResponseEntity<ApiResponse<Map<String, Long>>> pendingSummary() {
        long pickups = donationService.countPendingPickups();
        long boxes = donationService.countPendingBoxes();
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "pickupsPending", pickups,
                "boxesPending", boxes,
                "totalPending", pickups + boxes)));
    }

    @GetMapping("/boxes")
    public ResponseEntity<ApiResponse<List<AdminDonationBoxDTO>>> listBoxes() {
        return ResponseEntity.ok(ApiResponse.success(donationService.listBoxesForAdmin()));
    }

    @PostMapping("/boxes/{id}/accept")
    public ResponseEntity<ApiResponse<AdminDonationBoxDTO>> acceptBox(
            @PathVariable Long id,
            @RequestBody(required = false) AdminAcceptDonationPickupRequest body) {
        return ResponseEntity.ok(ApiResponse.success("Box request approved", donationService.acceptBox(id, body)));
    }

    @PostMapping("/boxes/{id}/reject")
    public ResponseEntity<ApiResponse<AdminDonationBoxDTO>> rejectBox(
            @PathVariable Long id,
            @RequestBody(required = false) AdminAcceptDonationPickupRequest body) {
        return ResponseEntity.ok(ApiResponse.success("Box request rejected", donationService.rejectBox(id, body)));
    }

    @PostMapping("/boxes/{id}/schedule")
    public ResponseEntity<ApiResponse<AdminDonationBoxDTO>> scheduleBox(
            @PathVariable Long id,
            @Valid @RequestBody AdminScheduleDonationPickupRequest body) {
        return ResponseEntity.ok(ApiResponse.success("Expected delivery set", donationService.scheduleBoxDelivery(id, body)));
    }

    @PostMapping("/boxes/{id}/complete")
    public ResponseEntity<ApiResponse<AdminDonationBoxDTO>> completeBox(
            @PathVariable Long id,
            @RequestBody(required = false) AdminCompleteDonationPickupRequest body) {
        return ResponseEntity.ok(ApiResponse.success("Box delivery completed", donationService.completeBox(id, body)));
    }

    @PostMapping("/pickups/{id}/accept")
    public ResponseEntity<ApiResponse<AdminDonationPickupDTO>> accept(
            @PathVariable Long id,
            @RequestBody(required = false) AdminAcceptDonationPickupRequest body) {
        return ResponseEntity.ok(ApiResponse.success("Request accepted", donationService.acceptPickup(id, body)));
    }

    @PostMapping("/pickups/{id}/reject")
    public ResponseEntity<ApiResponse<AdminDonationPickupDTO>> rejectPickup(
            @PathVariable Long id,
            @RequestBody(required = false) AdminAcceptDonationPickupRequest body) {
        return ResponseEntity.ok(ApiResponse.success("Request rejected", donationService.rejectPickup(id, body)));
    }

    @PostMapping("/pickups/{id}/schedule")
    public ResponseEntity<ApiResponse<AdminDonationPickupDTO>> schedule(
            @PathVariable Long id,
            @Valid @RequestBody AdminScheduleDonationPickupRequest body) {
        return ResponseEntity.ok(ApiResponse.success("Expected pick date set", donationService.schedulePickup(id, body)));
    }

    @PostMapping("/pickups/{id}/complete")
    public ResponseEntity<ApiResponse<AdminDonationPickupDTO>> complete(
            @PathVariable Long id,
            @RequestBody(required = false) AdminCompleteDonationPickupRequest body) {
        return ResponseEntity.ok(ApiResponse.success("Pickup completed", donationService.completePickup(id, body)));
    }
}
