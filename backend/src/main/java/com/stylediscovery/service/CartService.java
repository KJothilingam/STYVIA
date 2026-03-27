package com.stylediscovery.service;

import com.stylediscovery.dto.AddToCartRequest;
import com.stylediscovery.dto.CartItemDTO;
import com.stylediscovery.dto.ProductDTO;
import com.stylediscovery.entity.*;
import com.stylediscovery.exception.BadRequestException;
import com.stylediscovery.exception.ResourceNotFoundException;
import com.stylediscovery.repository.*;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CartService {

    private static final Logger logger = LoggerFactory.getLogger(CartService.class);

    /** Demo / dev: never block checkout for stock — top up or create rows as needed. */
    private static final int UNLIMITED_STOCK_BUFFER = 50_000;

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

        Inventory inventory = ensureInventoryLine(
                product, request.getSize(), request.getColor(), request.getQuantity());

        CartItem existingItem = cartItemRepository
                .findByCartIdAndProductIdAndInventoryId(cart.getId(), product.getId(), inventory.getId())
                .orElse(null);

        CartItem cartItem;
        if (existingItem != null) {
            int newQuantity = existingItem.getQuantity() + request.getQuantity();
            inventory = topUpInventoryIfNeeded(inventory.getId(), newQuantity);
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

        topUpInventoryIfNeeded(cartItem.getInventory().getId(), quantity);

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

    /**
     * Ensures an inventory row exists and has enough stock (auto top-up / create). Does not fail on empty stock.
     */
    private Inventory ensureInventoryLine(Product product, String sizeRaw, String colorRaw, int minQuantity) {
        String size = normalizeSize(sizeRaw);
        String color = normalizeColor(colorRaw);
        int need = Math.max(minQuantity, 1);

        Optional<Inventory> exact = inventoryRepository.findByProductIdAndSizeAndColor(product.getId(), size, color);
        if (exact.isPresent()) {
            return topUpInventoryIfNeeded(exact.get().getId(), need);
        }

        List<Inventory> all = inventoryRepository.findByProductId(product.getId());
        List<Inventory> avail = all.stream()
                .filter(i -> i.getStockQuantity() != null && i.getStockQuantity() > 0)
                .toList();
        if (!avail.isEmpty()) {
            return topUpInventoryIfNeeded(pickClosestInventoryRow(avail, size, color).getId(), need);
        }
        if (!all.isEmpty()) {
            logger.debug("Product {} has only zero-stock rows; topping up a matching line", product.getId());
            return topUpInventoryIfNeeded(pickClosestInventoryRow(all, size, color).getId(), need);
        }

        Inventory created = Inventory.builder()
                .product(product)
                .size(truncate(size, 10))
                .color(truncate(color, 100))
                .stockQuantity(Math.max(need + UNLIMITED_STOCK_BUFFER, UNLIMITED_STOCK_BUFFER))
                .build();
        logger.info("Auto-created inventory for productId={} size={} color={}", product.getId(), size, color);
        return inventoryRepository.save(created);
    }

    private Inventory topUpInventoryIfNeeded(Long inventoryId, int minQuantity) {
        Inventory inv = inventoryRepository.findById(inventoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found: " + inventoryId));
        int need = Math.max(minQuantity, 1);
        if (inv.getStockQuantity() == null || inv.getStockQuantity() < need) {
            inv.setStockQuantity(Math.max(need + UNLIMITED_STOCK_BUFFER, UNLIMITED_STOCK_BUFFER));
            inv = inventoryRepository.save(inv);
            logger.debug("Topped up inventory id={} to {}", inv.getId(), inv.getStockQuantity());
        }
        return inv;
    }

    private static String normalizeSize(String raw) {
        if (raw == null || raw.isBlank()) {
            return "M";
        }
        return truncate(raw.trim(), 10);
    }

    private static String normalizeColor(String raw) {
        if (raw == null || raw.isBlank()) {
            return "Default";
        }
        return truncate(raw.trim(), 100);
    }

    private static String truncate(String s, int maxLen) {
        if (s.length() <= maxLen) {
            return s;
        }
        return s.substring(0, maxLen);
    }

    private static Inventory pickClosestInventoryRow(List<Inventory> avail, String sizeTrim, String colorTrim) {
        if (avail.size() == 1) {
            return avail.get(0);
        }
        if (sizeTrim.isEmpty() && colorTrim.isEmpty()) {
            return avail.get(0);
        }

        List<Inventory> bySize = avail.stream()
                .filter(i -> i.getSize() != null && i.getSize().trim().equalsIgnoreCase(sizeTrim))
                .toList();
        if (!bySize.isEmpty()) {
            if (colorTrim.isEmpty()) {
                return bySize.get(0);
            }
            Optional<Inventory> byColor = bySize.stream()
                    .filter(i -> i.getColor() != null && i.getColor().trim().equalsIgnoreCase(colorTrim))
                    .findFirst();
            if (byColor.isPresent()) {
                return byColor.get();
            }
            return bySize.get(0);
        }

        if (!colorTrim.isEmpty()) {
            Optional<Inventory> byColorOnly = avail.stream()
                    .filter(i -> i.getColor() != null && i.getColor().trim().equalsIgnoreCase(colorTrim))
                    .findFirst();
            if (byColorOnly.isPresent()) {
                return byColorOnly.get();
            }
        }

        return avail.get(0);
    }
}

