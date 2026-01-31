package com.stylediscovery.controller;

import com.stylediscovery.dto.AddressDTO;
import com.stylediscovery.dto.ApiResponse;
import com.stylediscovery.security.UserPrincipal;
import com.stylediscovery.service.AddressService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/addresses")
@RequiredArgsConstructor
public class AddressController {

    private final AddressService addressService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AddressDTO>>> getUserAddresses(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<AddressDTO> addresses = addressService.getUserAddresses(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(addresses));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AddressDTO>> addAddress(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody AddressDTO addressDTO) {
        AddressDTO address = addressService.addAddress(currentUser.getId(), addressDTO);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Address added successfully", address));
    }

    @PutMapping("/{addressId}")
    public ResponseEntity<ApiResponse<AddressDTO>> updateAddress(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long addressId,
            @Valid @RequestBody AddressDTO addressDTO) {
        AddressDTO address = addressService.updateAddress(currentUser.getId(), addressId, addressDTO);
        return ResponseEntity.ok(ApiResponse.success("Address updated successfully", address));
    }

    @DeleteMapping("/{addressId}")
    public ResponseEntity<ApiResponse<Void>> deleteAddress(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long addressId) {
        addressService.deleteAddress(currentUser.getId(), addressId);
        return ResponseEntity.ok(ApiResponse.success("Address deleted successfully", null));
    }

    @PutMapping("/{addressId}/default")
    public ResponseEntity<ApiResponse<AddressDTO>> setDefaultAddress(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long addressId) {
        AddressDTO address = addressService.setDefaultAddress(currentUser.getId(), addressId);
        return ResponseEntity.ok(ApiResponse.success("Default address updated", address));
    }
}

