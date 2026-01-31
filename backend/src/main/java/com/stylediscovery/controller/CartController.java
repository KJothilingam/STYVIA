package com.stylediscovery.controller;

import com.stylediscovery.dto.AddToCartRequest;
import com.stylediscovery.dto.ApiResponse;
import com.stylediscovery.dto.CartItemDTO;
import com.stylediscovery.security.UserPrincipal;
import com.stylediscovery.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CartItemDTO>>> getCart(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<CartItemDTO> cartItems = cartService.getCartItems(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(cartItems));
    }

    @PostMapping("/add")
    public ResponseEntity<ApiResponse<CartItemDTO>> addToCart(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody AddToCartRequest request) {
        CartItemDTO cartItem = cartService.addToCart(currentUser.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Item added to cart", cartItem));
    }

    @PutMapping("/item/{itemId}/quantity")
    public ResponseEntity<ApiResponse<CartItemDTO>> updateCartItemQuantity(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long itemId,
            @RequestParam Integer quantity) {
        CartItemDTO cartItem = cartService.updateCartItemQuantity(currentUser.getId(), itemId, quantity);
        return ResponseEntity.ok(ApiResponse.success("Cart item updated", cartItem));
    }

    @DeleteMapping("/item/{itemId}")
    public ResponseEntity<ApiResponse<Void>> removeFromCart(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long itemId) {
        cartService.removeFromCart(currentUser.getId(), itemId);
        return ResponseEntity.ok(ApiResponse.success("Item removed from cart", null));
    }

    @DeleteMapping("/clear")
    public ResponseEntity<ApiResponse<Void>> clearCart(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        cartService.clearCart(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Cart cleared", null));
    }

    @GetMapping("/total")
    public ResponseEntity<ApiResponse<BigDecimal>> getCartTotal(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        BigDecimal total = cartService.getCartTotal(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(total));
    }
}

