package com.stylediscovery.service;

import com.stylediscovery.dto.WardrobeItemDTO;
import com.stylediscovery.entity.*;
import com.stylediscovery.enums.OrderStatus;
import com.stylediscovery.enums.WardrobeLifecycleState;
import com.stylediscovery.exception.BadRequestException;
import com.stylediscovery.exception.ResourceNotFoundException;
import com.stylediscovery.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WardrobeService {

    private final WardrobeItemRepository wardrobeItemRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductImageRepository productImageRepository;
    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public List<WardrobeItemDTO> list(Long userId) {
        return wardrobeItemRepository.findByUser_IdOrderByPurchasedAtDesc(userId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public List<WardrobeItemDTO> syncFromOrders(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        List<Order> orders = orderRepository.findByUserIdOrderByCreatedAtDesc(userId);
        for (Order order : orders) {
            if (order.getOrderStatus() == OrderStatus.CANCELLED) {
                continue;
            }
            LocalDateTime purchasedAt = order.getCreatedAt() != null ? order.getCreatedAt() : LocalDateTime.now();
            for (OrderItem line : order.getItems()) {
                importOrderLineIfMissing(user, line, purchasedAt, "Imported from your order history.");
            }
        }
        return list(userId);
    }

    /**
     * Called after checkout: one wardrobe row per order line, keyed by {@code sourceOrderItemId} so sync/placement never double-count.
     */
    @Transactional
    public void importOrderLinesAfterPlacement(Long userId, List<OrderItem> savedLines, LocalDateTime purchasedAt) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        LocalDateTime at = purchasedAt != null ? purchasedAt : LocalDateTime.now();
        for (OrderItem line : savedLines) {
            if (line.getId() == null) {
                continue;
            }
            importOrderLineIfMissing(user, line, at, "Added when you placed your order.");
        }
    }

    private void importOrderLineIfMissing(User user, OrderItem line, LocalDateTime purchasedAt, String recommendation) {
        if (line.getId() == null) {
            return;
        }
        if (wardrobeItemRepository.findBySourceOrderItemId(line.getId()).isPresent()) {
            return;
        }
        int qty = line.getQuantity() != null && line.getQuantity() > 0 ? line.getQuantity() : 1;
        String img = productImageRepository.findByProductIdOrderByDisplayOrderAsc(line.getProduct().getId())
                .stream()
                .findFirst()
                .map(ProductImage::getImageUrl)
                .orElse(null);
        WardrobeItem w = WardrobeItem.builder()
                .user(user)
                .productId(line.getProduct().getId())
                .productName(line.getProductName())
                .size(line.getSize())
                .color(line.getColor())
                .quantity(qty)
                .sourceOrderItemId(line.getId())
                .imageUrl(img)
                .purchasedAt(purchasedAt)
                .wearCount(0)
                .lifecycleState(WardrobeLifecycleState.NEW)
                .recommendation(recommendation)
                .build();
        wardrobeItemRepository.save(w);
    }

    /**
     * Add a catalog piece to the wardrobe without a delivered order (e.g. owned elsewhere or tracking only).
     */
    @Transactional
    public WardrobeItemDTO addFromProduct(Long userId, Long productId, String size, String color, Double fitConfidence,
                                          Integer quantityToAdd) {
        if (!StringUtils.hasText(size) || !StringUtils.hasText(color)) {
            throw new BadRequestException("Size and color are required.");
        }
        String sz = size.trim();
        String col = color.trim();
        int addQty = quantityToAdd != null && quantityToAdd > 0 ? quantityToAdd : 1;
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        User user = userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Optional<WardrobeItem> manual = wardrobeItemRepository
                .findFirstByUser_IdAndProductIdAndSizeAndColorAndSourceOrderItemIdIsNull(userId, productId, sz, col);
        if (manual.isPresent()) {
            WardrobeItem w = manual.get();
            int q = w.getQuantity() != null ? w.getQuantity() : 1;
            w.setQuantity(q + addQty);
            if (fitConfidence != null) {
                w.setFitConfidenceAtPurchase(fitConfidence);
            }
            return toDto(wardrobeItemRepository.save(w));
        }
        String img = productImageRepository.findByProductIdOrderByDisplayOrderAsc(productId).stream()
                .findFirst()
                .map(ProductImage::getImageUrl)
                .orElse(null);
        WardrobeItem w = WardrobeItem.builder()
                .user(user)
                .productId(product.getId())
                .productName(product.getName())
                .size(sz)
                .color(col)
                .quantity(addQty)
                .sourceOrderItemId(null)
                .imageUrl(img)
                .purchasedAt(LocalDateTime.now())
                .wearCount(0)
                .fitConfidenceAtPurchase(fitConfidence)
                .lifecycleState(WardrobeLifecycleState.NEW)
                .recommendation("Added from catalog.")
                .build();
        return toDto(wardrobeItemRepository.save(w));
    }

    @Transactional
    public WardrobeItemDTO addFromOrderItem(Long userId, Long orderItemId, Double fitConfidence) {
        OrderItem item = orderItemRepository.findById(orderItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Order item not found"));
        if (!item.getOrder().getUser().getId().equals(userId)) {
            throw new BadRequestException("Order item does not belong to user");
        }
        Optional<WardrobeItem> existing = wardrobeItemRepository.findBySourceOrderItemId(orderItemId);
        if (existing.isPresent()) {
            WardrobeItem w = existing.get();
            if (!w.getUser().getId().equals(userId)) {
                throw new BadRequestException("Order item does not belong to user");
            }
            if (fitConfidence != null) {
                w.setFitConfidenceAtPurchase(fitConfidence);
                wardrobeItemRepository.save(w);
            }
            return toDto(w);
        }
        User user = userRepository.findById(userId).orElseThrow();
        int qty = item.getQuantity() != null && item.getQuantity() > 0 ? item.getQuantity() : 1;
        LocalDateTime purchasedAt = item.getOrder().getCreatedAt() != null
                ? item.getOrder().getCreatedAt()
                : LocalDateTime.now();
        String img = productImageRepository.findByProductIdOrderByDisplayOrderAsc(item.getProduct().getId())
                .stream().findFirst().map(ProductImage::getImageUrl).orElse(null);
        WardrobeItem w = WardrobeItem.builder()
                .user(user)
                .productId(item.getProduct().getId())
                .productName(item.getProductName())
                .size(item.getSize())
                .color(item.getColor())
                .quantity(qty)
                .sourceOrderItemId(item.getId())
                .imageUrl(img)
                .purchasedAt(purchasedAt)
                .wearCount(0)
                .fitConfidenceAtPurchase(fitConfidence)
                .lifecycleState(WardrobeLifecycleState.NEW)
                .recommendation("Added from order line.")
                .build();
        return toDto(wardrobeItemRepository.save(w));
    }

    @Transactional
    public void logWorn(Long userId, Long wardrobeItemId) {
        WardrobeItem w = getOwned(userId, wardrobeItemId);
        w.setWearCount(w.getWearCount() + 1);
        w.setLastWornAt(LocalDateTime.now());
        if (w.getWearCount() >= 6) {
            w.setLifecycleState(WardrobeLifecycleState.FREQUENTLY_USED);
        }
        wardrobeItemRepository.save(w);
    }

    @Transactional
    public void logRepair(Long userId, Long wardrobeItemId, String notes) {
        WardrobeItem w = getOwned(userId, wardrobeItemId);
        w.setLifecycleState(WardrobeLifecycleState.REPAIR_NEEDED);
        w.setNotes(notes);
        wardrobeItemRepository.save(w);
    }

    @Transactional
    public void logDonate(Long userId, Long wardrobeItemId, String notes) {
        WardrobeItem w = getOwned(userId, wardrobeItemId);
        w.setLifecycleState(WardrobeLifecycleState.DONATE_RECOMMENDED);
        w.setNotes(notes);
        wardrobeItemRepository.save(w);
    }

    @Transactional
    public void logEvent(Long userId, Long wardrobeItemId, String event, String notes) {
        if ("DONATED".equalsIgnoreCase(event)) {
            WardrobeItem w = getOwned(userId, wardrobeItemId);
            w.setLifecycleState(WardrobeLifecycleState.DONATED);
            w.setNotes(notes);
            wardrobeItemRepository.save(w);
        } else {
            throw new BadRequestException("Unsupported event: " + event);
        }
    }

    @Transactional
    public void logUnified(Long userId, com.stylediscovery.dto.WardrobeLogRequest req) {
        String ev = req.getEvent();
        if ("WORN".equalsIgnoreCase(ev)) {
            logWorn(userId, req.getWardrobeItemId());
        } else if ("REPAIRED".equalsIgnoreCase(ev)) {
            logRepair(userId, req.getWardrobeItemId(), req.getNotes());
        } else if ("DONATED".equalsIgnoreCase(ev)) {
            logEvent(userId, req.getWardrobeItemId(), "DONATED", req.getNotes());
        } else {
            throw new BadRequestException("Unknown event");
        }
    }

    private WardrobeItem getOwned(Long userId, Long id) {
        WardrobeItem w = wardrobeItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Wardrobe item not found"));
        if (!w.getUser().getId().equals(userId)) {
            throw new BadRequestException("Not your wardrobe item");
        }
        return w;
    }

    private WardrobeItemDTO toDto(WardrobeItem w) {
        int q = w.getQuantity() != null ? w.getQuantity() : 1;
        return WardrobeItemDTO.builder()
                .id(w.getId())
                .productId(w.getProductId())
                .productName(w.getProductName())
                .size(w.getSize())
                .color(w.getColor())
                .quantity(q)
                .fromOrder(w.getSourceOrderItemId() != null)
                .imageUrl(w.getImageUrl())
                .purchasedAt(w.getPurchasedAt())
                .wearCount(w.getWearCount())
                .lastWornAt(w.getLastWornAt())
                .lifecycleState(w.getLifecycleState().name())
                .fitConfidenceAtPurchase(w.getFitConfidenceAtPurchase())
                .notes(w.getNotes())
                .recommendation(w.getRecommendation())
                .build();
    }
}
