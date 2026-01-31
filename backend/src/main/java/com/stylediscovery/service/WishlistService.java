package com.stylediscovery.service;

import com.stylediscovery.dto.ProductDTO;
import com.stylediscovery.entity.Product;
import com.stylediscovery.entity.User;
import com.stylediscovery.entity.Wishlist;
import com.stylediscovery.entity.WishlistItem;
import com.stylediscovery.exception.BadRequestException;
import com.stylediscovery.exception.ResourceNotFoundException;
import com.stylediscovery.repository.ProductRepository;
import com.stylediscovery.repository.UserRepository;
import com.stylediscovery.repository.WishlistItemRepository;
import com.stylediscovery.repository.WishlistRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WishlistService {

    private static final Logger logger = LoggerFactory.getLogger(WishlistService.class);

    private final WishlistRepository wishlistRepository;
    private final WishlistItemRepository wishlistItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final ProductService productService;

    @Transactional(readOnly = true)
    public List<ProductDTO> getWishlistItems(Long userId) {
        logger.info("Fetching wishlist items for user: {}", userId);

        Wishlist wishlist = wishlistRepository.findByUserId(userId)
                .orElse(null);

        if (wishlist == null || wishlist.getItems().isEmpty()) {
            return List.of();
        }

        return wishlist.getItems().stream()
                .map(item -> productService.getProductById(item.getProduct().getId()))
                .collect(Collectors.toList());
    }

    @Transactional
    public ProductDTO addToWishlist(Long userId, Long productId) {
        logger.info("Adding product to wishlist for user: {}, product: {}", userId, productId);

        // Get or create wishlist
        Wishlist wishlist = wishlistRepository.findByUserId(userId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
                    Wishlist newWishlist = Wishlist.builder()
                            .user(user)
                            .build();
                    return wishlistRepository.save(newWishlist);
                });

        // Get product
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        // Check if already in wishlist
        if (wishlistItemRepository.existsByWishlistIdAndProductId(wishlist.getId(), productId)) {
            throw new BadRequestException("Product already in wishlist");
        }

        // Add to wishlist
        WishlistItem wishlistItem = WishlistItem.builder()
                .wishlist(wishlist)
                .product(product)
                .build();
        wishlistItemRepository.save(wishlistItem);

        logger.info("Product added to wishlist successfully");
        return productService.getProductById(productId);
    }

    @Transactional
    public void removeFromWishlist(Long userId, Long productId) {
        logger.info("Removing product from wishlist for user: {}, product: {}", userId, productId);

        Wishlist wishlist = wishlistRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wishlist not found"));

        WishlistItem wishlistItem = wishlistItemRepository
                .findByWishlistIdAndProductId(wishlist.getId(), productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not in wishlist"));

        wishlistItemRepository.delete(wishlistItem);
        logger.info("Product removed from wishlist successfully");
    }

    @Transactional(readOnly = true)
    public boolean isInWishlist(Long userId, Long productId) {
        Wishlist wishlist = wishlistRepository.findByUserId(userId)
                .orElse(null);

        if (wishlist == null) {
            return false;
        }

        return wishlistItemRepository.existsByWishlistIdAndProductId(wishlist.getId(), productId);
    }

    @Transactional
    public void clearWishlist(Long userId) {
        logger.info("Clearing wishlist for user: {}", userId);

        Wishlist wishlist = wishlistRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wishlist not found"));

        wishlistItemRepository.deleteByWishlistId(wishlist.getId());
        logger.info("Wishlist cleared successfully");
    }
}

