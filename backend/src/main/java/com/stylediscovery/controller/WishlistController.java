package com.stylediscovery.controller;

import com.stylediscovery.dto.ApiResponse;
import com.stylediscovery.dto.ProductDTO;
import com.stylediscovery.security.UserPrincipal;
import com.stylediscovery.service.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/wishlist")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProductDTO>>> getWishlist(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<ProductDTO> products = wishlistService.getWishlistItems(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(products));
    }

    @PostMapping("/add/{productId}")
    public ResponseEntity<ApiResponse<ProductDTO>> addToWishlist(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long productId) {
        ProductDTO product = wishlistService.addToWishlist(currentUser.getId(), productId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Product added to wishlist", product));
    }

    @DeleteMapping("/remove/{productId}")
    public ResponseEntity<ApiResponse<Void>> removeFromWishlist(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long productId) {
        wishlistService.removeFromWishlist(currentUser.getId(), productId);
        return ResponseEntity.ok(ApiResponse.success("Product removed from wishlist", null));
    }

    @GetMapping("/check/{productId}")
    public ResponseEntity<ApiResponse<Boolean>> isInWishlist(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long productId) {
        boolean inWishlist = wishlistService.isInWishlist(currentUser.getId(), productId);
        return ResponseEntity.ok(ApiResponse.success(inWishlist));
    }

    @DeleteMapping("/clear")
    public ResponseEntity<ApiResponse<Void>> clearWishlist(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        wishlistService.clearWishlist(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Wishlist cleared", null));
    }
}

