package com.stylediscovery.service;

import com.stylediscovery.dto.WardrobeItemDTO;
import com.stylediscovery.entity.*;
import com.stylediscovery.enums.OrderStatus;
import com.stylediscovery.enums.WardrobeLifecycleState;
import com.stylediscovery.exception.BadRequestException;
import com.stylediscovery.exception.ResourceNotFoundException;
import com.stylediscovery.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WardrobeService {

    private final WardrobeItemRepository wardrobeItemRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductImageRepository productImageRepository;

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
            if (order.getOrderStatus() != OrderStatus.DELIVERED) continue;
            for (OrderItem line : order.getItems()) {
                if (wardrobeItemRepository.existsByUser_IdAndProductIdAndSizeAndColor(
                        userId, line.getProduct().getId(), line.getSize(), line.getColor())) {
                    continue;
                }
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
                        .imageUrl(img)
                        .purchasedAt(order.getCreatedAt() != null ? order.getCreatedAt() : LocalDateTime.now())
                        .wearCount(0)
                        .lifecycleState(WardrobeLifecycleState.NEW)
                        .recommendation("Synced from a delivered order.")
                        .build();
                wardrobeItemRepository.save(w);
            }
        }
        return list(userId);
    }

    @Transactional
    public WardrobeItemDTO addFromOrderItem(Long userId, Long orderItemId, Double fitConfidence) {
        OrderItem item = orderItemRepository.findById(orderItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Order item not found"));
        if (!item.getOrder().getUser().getId().equals(userId)) {
            throw new BadRequestException("Order item does not belong to user");
        }
        User user = userRepository.findById(userId).orElseThrow();
        if (wardrobeItemRepository.existsByUser_IdAndProductIdAndSizeAndColor(
                userId, item.getProduct().getId(), item.getSize(), item.getColor())) {
            return wardrobeItemRepository.findByUser_IdOrderByPurchasedAtDesc(userId).stream()
                    .filter(w -> w.getProductId().equals(item.getProduct().getId())
                            && w.getSize().equals(item.getSize())
                            && w.getColor().equals(item.getColor()))
                    .findFirst()
                    .map(this::toDto)
                    .orElseThrow();
        }
        String img = productImageRepository.findByProductIdOrderByDisplayOrderAsc(item.getProduct().getId())
                .stream().findFirst().map(ProductImage::getImageUrl).orElse(null);
        WardrobeItem w = WardrobeItem.builder()
                .user(user)
                .productId(item.getProduct().getId())
                .productName(item.getProductName())
                .size(item.getSize())
                .color(item.getColor())
                .imageUrl(img)
                .purchasedAt(LocalDateTime.now())
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
        return WardrobeItemDTO.builder()
                .id(w.getId())
                .productId(w.getProductId())
                .productName(w.getProductName())
                .size(w.getSize())
                .color(w.getColor())
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
