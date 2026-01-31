package com.stylediscovery.service;

import com.stylediscovery.dto.*;
import com.stylediscovery.entity.*;
import com.stylediscovery.enums.OrderStatus;
import com.stylediscovery.enums.PaymentStatus;
import com.stylediscovery.exception.BadRequestException;
import com.stylediscovery.exception.InsufficientStockException;
import com.stylediscovery.exception.ResourceNotFoundException;
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
import java.util.List;
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

    @Transactional
    public OrderDTO placeOrder(Long userId, PlaceOrderRequest request) {
        logger.info("Placing order for user: {}", userId);

        // Get cart
        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new BadRequestException("Cart is empty"));

        if (cart.getItems().isEmpty()) {
            throw new BadRequestException("Cart is empty");
        }

        // Get address
        Address address = addressRepository.findById(request.getAddressId())
                .orElseThrow(() -> new ResourceNotFoundException("Address not found"));

        if (!address.getUser().getId().equals(userId)) {
            throw new BadRequestException("Address does not belong to user");
        }

        // Calculate totals
        BigDecimal subtotal = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();

        for (CartItem cartItem : cart.getItems()) {
            // Check stock availability
            Inventory inventory = cartItem.getInventory();
            if (inventory.getStockQuantity() < cartItem.getQuantity()) {
                throw new InsufficientStockException(
                        String.format("Insufficient stock for product: %s", cartItem.getProduct().getName())
                );
            }

            // Calculate item total
            BigDecimal itemTotal = cartItem.getProduct().getPrice()
                    .multiply(BigDecimal.valueOf(cartItem.getQuantity()));
            subtotal = subtotal.add(itemTotal);

            // Create order item
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

        // Calculate delivery fee (free for orders above 500)
        BigDecimal deliveryFee = subtotal.compareTo(BigDecimal.valueOf(500)) >= 0 
                ? BigDecimal.ZERO 
                : BigDecimal.valueOf(50);

        BigDecimal discount = BigDecimal.ZERO; // TODO: Apply coupon if provided
        BigDecimal totalAmount = subtotal.add(deliveryFee).subtract(discount);

        // Create order
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

        // Save order items
        for (OrderItem item : orderItems) {
            item.setOrder(order);
            orderItemRepository.save(item);

            // Reduce inventory
            Inventory inventory = inventoryRepository
                    .findByProductIdAndSizeAndColor(
                            item.getProduct().getId(),
                            item.getSize(),
                            item.getColor()
                    )
                    .orElseThrow(() -> new ResourceNotFoundException("Inventory not found"));

            inventory.setStockQuantity(inventory.getStockQuantity() - item.getQuantity());
            inventoryRepository.save(inventory);
        }

        // Create payment record
        Payment payment = Payment.builder()
                .order(order)
                .transactionId("TXN" + UUID.randomUUID().toString())
                .paymentMethod(request.getPaymentMethod())
                .amount(totalAmount)
                .status(PaymentStatus.PENDING)
                .paymentGateway("MOCK_GATEWAY")
                .build();
        paymentRepository.save(payment);

        // Clear cart
        cartItemRepository.deleteByCartId(cart.getId());

        logger.info("Order placed successfully: {}", orderNumber);

        return convertToDTO(order);
    }

    @Transactional(readOnly = true)
    public Page<OrderDTO> getUserOrders(Long userId, Pageable pageable) {
        logger.info("Fetching orders for user: {}", userId);
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::convertToDTO);
    }

    @Transactional(readOnly = true)
    public OrderDTO getOrderById(Long userId, Long orderId) {
        logger.info("Fetching order: {} for user: {}", orderId, userId);
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (!order.getUser().getId().equals(userId)) {
            throw new BadRequestException("Order does not belong to user");
        }

        return convertToDTO(order);
    }

    @Transactional(readOnly = true)
    public OrderDTO getOrderByNumber(String orderNumber) {
        logger.info("Fetching order by number: {}", orderNumber);
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        return convertToDTO(order);
    }

    @Transactional
    public OrderDTO cancelOrder(Long userId, Long orderId) {
        logger.info("Cancelling order: {} for user: {}", orderId, userId);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (!order.getUser().getId().equals(userId)) {
            throw new BadRequestException("Order does not belong to user");
        }

        if (order.getOrderStatus() == OrderStatus.DELIVERED 
                || order.getOrderStatus() == OrderStatus.CANCELLED) {
            throw new BadRequestException("Order cannot be cancelled");
        }

        // Restore inventory
        for (OrderItem item : order.getItems()) {
            Inventory inventory = inventoryRepository
                    .findByProductIdAndSizeAndColor(
                            item.getProduct().getId(),
                            item.getSize(),
                            item.getColor()
                    )
                    .orElseThrow(() -> new ResourceNotFoundException("Inventory not found"));

            inventory.setStockQuantity(inventory.getStockQuantity() + item.getQuantity());
            inventoryRepository.save(inventory);
        }

        order.setOrderStatus(OrderStatus.CANCELLED);
        order.setCancelledAt(LocalDateTime.now());
        order = orderRepository.save(order);

        logger.info("Order cancelled successfully: {}", orderId);
        return convertToDTO(order);
    }

    private OrderDTO convertToDTO(Order order) {
        List<OrderItemDTO> itemDTOs = order.getItems().stream()
                .map(item -> OrderItemDTO.builder()
                        .id(item.getId())
                        .productId(item.getProduct().getId())
                        .productName(item.getProductName())
                        .productBrand(item.getProductBrand())
                        .size(item.getSize())
                        .color(item.getColor())
                        .price(item.getPrice())
                        .quantity(item.getQuantity())
                        .subtotal(item.getSubtotal())
                        .build())
                .collect(Collectors.toList());

        AddressDTO addressDTO = AddressDTO.builder()
                .id(order.getAddress().getId())
                .name(order.getAddress().getName())
                .phone(order.getAddress().getPhone())
                .addressLine1(order.getAddress().getAddressLine1())
                .addressLine2(order.getAddress().getAddressLine2())
                .locality(order.getAddress().getLocality())
                .city(order.getAddress().getCity())
                .state(order.getAddress().getState())
                .pincode(order.getAddress().getPincode())
                .country(order.getAddress().getCountry())
                .addressType(order.getAddress().getAddressType())
                .build();

        return OrderDTO.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .items(itemDTOs)
                .address(addressDTO)
                .subtotal(order.getSubtotal())
                .discount(order.getDiscount())
                .deliveryFee(order.getDeliveryFee())
                .totalAmount(order.getTotalAmount())
                .orderStatus(order.getOrderStatus())
                .paymentStatus(order.getPaymentStatus())
                .paymentMethod(order.getPaymentMethod())
                .createdAt(order.getCreatedAt())
                .deliveredAt(order.getDeliveredAt())
                .build();
    }
}

