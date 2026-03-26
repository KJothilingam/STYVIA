package com.stylediscovery.service;

import com.stylediscovery.dto.OrderDTO;
import com.stylediscovery.dto.PlaceOrderRequest;
import com.stylediscovery.entity.*;
import com.stylediscovery.enums.OrderStatus;
import com.stylediscovery.enums.PaymentStatus;
import com.stylediscovery.exception.BadRequestException;
import com.stylediscovery.exception.InsufficientStockException;
import com.stylediscovery.exception.ResourceNotFoundException;
import com.stylediscovery.mapper.OrderDtoMapper;
import com.stylediscovery.repository.*;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private static final Logger logger = LoggerFactory.getLogger(OrderService.class);

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final AddressRepository addressRepository;
    private final InventoryRepository inventoryRepository;
    private final PaymentRepository paymentRepository;
    private final OrderDtoMapper orderDtoMapper;
    private final CatalogCacheEvictionService catalogCacheEvictionService;
    private final FitTrainingDataService fitTrainingDataService;

    @Transactional(rollbackFor = Exception.class)
    public OrderDTO placeOrder(Long userId, PlaceOrderRequest request) {
        logger.info("Order placement started userId={} addressId={}", userId, request.getAddressId());

        Cart cart = cartRepository.findByUserIdWithItems(userId)
                .orElseThrow(() -> new BadRequestException("Cart is empty"));

        if (cart.getItems().isEmpty()) {
            throw new BadRequestException("Cart is empty");
        }

        Set<Long> touchedProductIds = cart.getItems().stream()
                .map(ci -> ci.getProduct().getId())
                .collect(Collectors.toSet());

        Address address = addressRepository.findById(request.getAddressId())
                .orElseThrow(() -> new ResourceNotFoundException("Address not found"));

        if (!address.getUser().getId().equals(userId)) {
            throw new BadRequestException("Address does not belong to user");
        }

        Map<Long, Integer> demandByInventoryId = new TreeMap<>();
        for (CartItem cartItem : cart.getItems()) {
            Long invId = cartItem.getInventory().getId();
            demandByInventoryId.merge(invId, cartItem.getQuantity(), Integer::sum);
        }

        Map<Long, Inventory> locked = new TreeMap<>();
        for (Long invId : demandByInventoryId.keySet()) {
            Inventory inv = inventoryRepository.findByIdForUpdate(invId)
                    .orElseThrow(() -> new ResourceNotFoundException("Inventory not found: " + invId));
            int need = demandByInventoryId.get(invId);
            if (inv.getStockQuantity() < need) {
                logger.warn("Insufficient stock userId={} inventoryId={} need={} available={}",
                        userId, invId, need, inv.getStockQuantity());
                throw new InsufficientStockException(
                        String.format("Insufficient stock for product: %s (size %s)", inv.getProduct().getName(), inv.getSize()));
            }
            locked.put(invId, inv);
        }

        BigDecimal subtotal = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();

        for (CartItem cartItem : cart.getItems()) {
            Inventory inventory = locked.get(cartItem.getInventory().getId());
            BigDecimal itemTotal = cartItem.getProduct().getPrice()
                    .multiply(BigDecimal.valueOf(cartItem.getQuantity()));
            subtotal = subtotal.add(itemTotal);

            OrderItem orderItem = OrderItem.builder()
                    .product(cartItem.getProduct())
                    .productName(cartItem.getProduct().getName())
                    .productBrand(cartItem.getProduct().getBrand())
                    .size(inventory.getSize())
                    .color(inventory.getColor())
                    .price(cartItem.getProduct().getPrice())
                    .quantity(cartItem.getQuantity())
                    .subtotal(itemTotal)
                    .build();
            orderItems.add(orderItem);
        }

        BigDecimal deliveryFee = subtotal.compareTo(BigDecimal.valueOf(500)) >= 0
                ? BigDecimal.ZERO
                : BigDecimal.valueOf(50);
        BigDecimal discount = BigDecimal.ZERO;
        BigDecimal totalAmount = subtotal.add(deliveryFee).subtract(discount);

        String orderNumber = "ORD" + System.currentTimeMillis();
        Order order = Order.builder()
                .orderNumber(orderNumber)
                .user(cart.getUser())
                .address(address)
                .subtotal(subtotal)
                .discount(discount)
                .deliveryFee(deliveryFee)
                .totalAmount(totalAmount)
                .orderStatus(OrderStatus.PLACED)
                .paymentStatus(PaymentStatus.PENDING)
                .paymentMethod(request.getPaymentMethod())
                .build();

        order = orderRepository.save(order);

        for (OrderItem item : orderItems) {
            item.setOrder(order);
            orderItemRepository.save(item);
        }

        for (Map.Entry<Long, Integer> e : demandByInventoryId.entrySet()) {
            Inventory inv = locked.get(e.getKey());
            inv.setStockQuantity(inv.getStockQuantity() - e.getValue());
            inventoryRepository.save(inv);
        }

        Payment payment = Payment.builder()
                .order(order)
                .transactionId("TXN" + UUID.randomUUID().toString().replace("-", ""))
                .paymentMethod(request.getPaymentMethod())
                .amount(totalAmount)
                .status(PaymentStatus.PENDING)
                .paymentGateway("MOCK_GATEWAY")
                .build();
        paymentRepository.save(payment);

        cartItemRepository.deleteByCartId(cart.getId());

        for (Long pid : touchedProductIds) {
            catalogCacheEvictionService.evictProductDetail(pid);
        }
        catalogCacheEvictionService.evictAllFitConfidence();

        logger.info("Order placed successfully userId={} orderNumber={} total={}", userId, orderNumber, totalAmount);

        Order persisted = orderRepository.findByIdWithItems(order.getId()).orElse(order);
        try {
            fitTrainingDataService.recordFromPlacedOrder(persisted);
        } catch (Exception e) {
            logger.warn("Fit training data capture failed orderId={}: {}", persisted.getId(), e.getMessage());
        }
        return orderDtoMapper.toDto(persisted);
    }

    @Transactional(readOnly = true)
    public Page<OrderDTO> getUserOrders(Long userId, Pageable pageable) {
        logger.debug("Fetching orders for user: {}", userId);
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::loadOrderWithItems)
                .map(orderDtoMapper::toDto);
    }

    @Transactional(readOnly = true)
    public OrderDTO getOrderById(Long userId, Long orderId) {
        logger.debug("Fetching order: {} for user: {}", orderId, userId);
        Order order = orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (!order.getUser().getId().equals(userId)) {
            throw new BadRequestException("Order does not belong to user");
        }

        return orderDtoMapper.toDto(order);
    }

    @Transactional(readOnly = true)
    public OrderDTO getOrderByNumber(String orderNumber) {
        logger.debug("Fetching order by number: {}", orderNumber);
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        return orderDtoMapper.toDto(loadOrderWithItems(order));
    }

    @Transactional(rollbackFor = Exception.class)
    public OrderDTO cancelOrder(Long userId, Long orderId) {
        logger.info("Cancelling order: {} for user: {}", orderId, userId);

        Order order = orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (!order.getUser().getId().equals(userId)) {
            throw new BadRequestException("Order does not belong to user");
        }

        if (order.getOrderStatus() == OrderStatus.DELIVERED
                || order.getOrderStatus() == OrderStatus.CANCELLED) {
            throw new BadRequestException("Order cannot be cancelled");
        }

        Map<Long, Integer> restoreByInvId = order.getItems().stream()
                .collect(Collectors.toMap(
                        item -> resolveInventoryId(item),
                        OrderItem::getQuantity,
                        Integer::sum));

        List<Long> sortedIds = new ArrayList<>(restoreByInvId.keySet());
        sortedIds.sort(Comparator.naturalOrder());

        for (Long invId : sortedIds) {
            Inventory inventory = inventoryRepository.findByIdForUpdate(invId)
                    .orElseThrow(() -> new ResourceNotFoundException("Inventory not found"));
            int qty = restoreByInvId.get(invId);
            inventory.setStockQuantity(inventory.getStockQuantity() + qty);
            inventoryRepository.save(inventory);
        }

        order.setOrderStatus(OrderStatus.CANCELLED);
        order.setCancelledAt(LocalDateTime.now());
        order = orderRepository.save(order);

        Set<Long> restoredProducts = order.getItems().stream()
                .map(item -> item.getProduct().getId())
                .collect(Collectors.toSet());
        for (Long pid : restoredProducts) {
            catalogCacheEvictionService.evictProductDetail(pid);
        }
        catalogCacheEvictionService.evictAllFitConfidence();

        logger.info("Order cancelled successfully orderId={} userId={}", orderId, userId);
        return orderDtoMapper.toDto(order);
    }

    private Order loadOrderWithItems(Order order) {
        return orderRepository.findByIdWithItems(order.getId()).orElse(order);
    }

    private Long resolveInventoryId(OrderItem item) {
        return inventoryRepository
                .findByProductIdAndSizeAndColor(item.getProduct().getId(), item.getSize(), item.getColor())
                .map(Inventory::getId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found for order line"));
    }
}
