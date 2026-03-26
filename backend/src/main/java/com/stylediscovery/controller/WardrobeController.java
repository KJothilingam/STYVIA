package com.stylediscovery.controller;

import com.stylediscovery.dto.AddWardrobeFromProductRequest;
import com.stylediscovery.dto.ApiResponse;
import com.stylediscovery.dto.WardrobeItemDTO;
import com.stylediscovery.dto.WardrobeLogRequest;
import com.stylediscovery.security.UserPrincipal;
import com.stylediscovery.service.WardrobeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/wardrobe")
@RequiredArgsConstructor
public class WardrobeController {

    private final WardrobeService wardrobeService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<WardrobeItemDTO>>> list(@AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(ApiResponse.success(wardrobeService.list(user.getId())));
    }

    @PostMapping("/sync")
    public ResponseEntity<ApiResponse<List<WardrobeItemDTO>>> sync(@AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(ApiResponse.success(wardrobeService.syncFromOrders(user.getId())));
    }

    @PostMapping("/from-product/{productId}")
    public ResponseEntity<ApiResponse<WardrobeItemDTO>> addFromProduct(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long productId,
            @Valid @RequestBody AddWardrobeFromProductRequest body) {
        WardrobeItemDTO dto = wardrobeService.addFromProduct(
                user.getId(),
                productId,
                body.getSize(),
                body.getColor(),
                body.getFitConfidence(),
                body.getQuantity());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(dto));
    }

    @PostMapping("/from-order-item/{orderItemId}")
    public ResponseEntity<ApiResponse<WardrobeItemDTO>> fromOrderItem(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long orderItemId,
            @RequestBody(required = false) Map<String, Object> body) {
        Double fit = null;
        if (body != null && body.get("fitConfidence") instanceof Number n) {
            fit = n.doubleValue();
        }
        WardrobeItemDTO dto = wardrobeService.addFromOrderItem(user.getId(), orderItemId, fit);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(dto));
    }

    @PostMapping("/{wardrobeItemId}/worn")
    public ResponseEntity<ApiResponse<Void>> worn(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long wardrobeItemId) {
        wardrobeService.logWorn(user.getId(), wardrobeItemId);
        return ResponseEntity.ok(ApiResponse.success("OK", null));
    }

    @PostMapping("/{wardrobeItemId}/repair")
    public ResponseEntity<ApiResponse<Void>> repair(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long wardrobeItemId,
            @RequestBody(required = false) Map<String, String> body) {
        String notes = body != null ? body.get("notes") : null;
        wardrobeService.logRepair(user.getId(), wardrobeItemId, notes);
        return ResponseEntity.ok(ApiResponse.success("OK", null));
    }

    @PostMapping("/{wardrobeItemId}/donate")
    public ResponseEntity<ApiResponse<Void>> donate(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long wardrobeItemId,
            @RequestBody(required = false) Map<String, String> body) {
        String notes = body != null ? body.get("notes") : null;
        wardrobeService.logDonate(user.getId(), wardrobeItemId, notes);
        return ResponseEntity.ok(ApiResponse.success("OK", null));
    }

    @PostMapping("/log")
    public ResponseEntity<ApiResponse<Void>> log(
            @AuthenticationPrincipal UserPrincipal user,
            @Valid @RequestBody WardrobeLogRequest req) {
        wardrobeService.logUnified(user.getId(), req);
        return ResponseEntity.ok(ApiResponse.success("OK", null));
    }
}
