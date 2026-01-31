package com.stylediscovery.service;

import com.stylediscovery.dto.AddToCartRequest;
import com.stylediscovery.dto.CartItemDTO;
import com.stylediscovery.dto.ProductDTO;
import com.stylediscovery.entity.*;
import com.stylediscovery.exception.BadRequestException;
import com.stylediscovery.exception.InsufficientStockException;
import com.stylediscovery.exception.ResourceNotFoundException;
import com.stylediscovery.repository.*;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CartService {

    private static final Logger logger = LoggerFactory.getLogger(CartService.class);

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;
    private final UserRepository userRepository;
    private final ProductService productService;

    @Transactional(readOnly = true)
    public List<CartItemDTO> getCartItems(Long userId) {
        logger.info("Fetching cart items for user: {}", userId);
        
        Cart cart = cartRepository.findByUserId(userId)
                .orElse(null);
        
        if (cart == null || cart.getItems().isEmpty()) {
            return List.of();
        }

        return cart.getItems().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public CartItemDTO addToCart(Long userId, AddToCartRequest request) {
        logger.info("Adding item to cart for user: {}, product: {}", userId, request.getProductId());

        // Get or create cart
        Cart cart = cartRepository.findByUserId(userId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
                    Cart newCart = Cart.builder()
                            .user(user)
                            .build();
                    return cartRepository.save(newCart);
                });

        // Get product
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        // Get inventory for size and color
        Inventory inventory = inventoryRepository
                .findByProductIdAndSizeAndColor(product.getId(), request.getSize(), request.getColor())
                .orElseThrow(() -> new BadRequestException("Product not available in selected size and color"));

        // Check stock
        if (inventory.getStockQuantity() < request.getQuantity()) {
            throw new InsufficientStockException(
                    String.format("Insufficient stock. Available: %d, Requested: %d", 
                            inventory.getStockQuantity(), request.getQuantity())
            );
        }

        // Check if item already exists in cart
        CartItem existingItem = cartItemRepository
                .findByCartIdAndProductIdAndInventoryId(cart.getId(), product.getId(), inventory.getId())
                .orElse(null);

        CartItem cartItem;
        if (existingItem != null) {
            // Update quantity
            int newQuantity = existingItem.getQuantity() + request.getQuantity();
            if (inventory.getStockQuantity() < newQuantity) {
                throw new InsufficientStockException("Cannot add more items. Stock limit reached");
            }
            existingItem.setQuantity(newQuantity);
            cartItem = cartItemRepository.save(existingItem);
        } else {
            // Create new cart item
            cartItem = CartItem.builder()
                    .cart(cart)
                    .product(product)
                    .inventory(inventory)
                    .quantity(request.getQuantity())
                    .build();
            cartItem = cartItemRepository.save(cartItem);
        }

        logger.info("Item added to cart successfully");
        return convertToDTO(cartItem);
    }

    @Transactional
    public CartItemDTO updateCartItemQuantity(Long userId, Long cartItemId, Integer quantity) {
        logger.info("Updating cart item quantity for user: {}, item: {}, new quantity: {}", 
                   userId, cartItemId, quantity);

        if (quantity < 1) {
            throw new BadRequestException("Quantity must be at least 1");
        }

        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart not found"));

        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));

        if (!cartItem.getCart().getId().equals(cart.getId())) {
            throw new BadRequestException("Cart item does not belong to user");
        }

        // Check stock
        if (cartItem.getInventory().getStockQuantity() < quantity) {
            throw new InsufficientStockException("Insufficient stock");
        }

        cartItem.setQuantity(quantity);
        CartItem updated = cartItemRepository.save(cartItem);

        logger.info("Cart item quantity updated successfully");
        return convertToDTO(updated);
    }

    @Transactional
    public void removeFromCart(Long userId, Long cartItemId) {
        logger.info("Removing item from cart for user: {}, item: {}", userId, cartItemId);

        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart not found"));

        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));

        if (!cartItem.getCart().getId().equals(cart.getId())) {
            throw new BadRequestException("Cart item does not belong to user");
        }

        cartItemRepository.delete(cartItem);
        logger.info("Item removed from cart successfully");
    }

    @Transactional
    public void clearCart(Long userId) {
        logger.info("Clearing cart for user: {}", userId);

        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart not found"));

        cartItemRepository.deleteByCartId(cart.getId());
        logger.info("Cart cleared successfully");
    }

    @Transactional(readOnly = true)
    public BigDecimal getCartTotal(Long userId) {
        List<CartItemDTO> items = getCartItems(userId);
        return items.stream()
                .map(CartItemDTO::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private CartItemDTO convertToDTO(CartItem cartItem) {
        ProductDTO productDTO = productService.getProductById(cartItem.getProduct().getId());
        BigDecimal subtotal = cartItem.getProduct().getPrice()
                .multiply(BigDecimal.valueOf(cartItem.getQuantity()));

        return CartItemDTO.builder()
                .id(cartItem.getId())
                .product(productDTO)
                .size(cartItem.getInventory().getSize())
                .color(cartItem.getInventory().getColor())
                .quantity(cartItem.getQuantity())
                .subtotal(subtotal)
                .build();
    }
}

