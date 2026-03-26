package com.stylediscovery.controller;

import com.stylediscovery.dto.ApiResponse;
import com.stylediscovery.dto.OrderDTO;
import com.stylediscovery.enums.OrderStatus;
import com.stylediscovery.repository.OrderRepository;
import com.stylediscovery.repository.ProductRepository;
import com.stylediscovery.repository.UserRepository;
import com.stylediscovery.exception.BadRequestException;
import com.stylediscovery.service.DonationService;
import com.stylediscovery.service.MlTrainingOrchestratorService;
import com.stylediscovery.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final OrderService orderService;
    private final MlTrainingOrchestratorService mlTrainingOrchestratorService;
    private final DonationService donationService;

    /**
     * Exports labeled {@link com.stylediscovery.entity.FitTrainingData} and triggers remote ML training.
     */
    @PostMapping("/train-model")
    public ResponseEntity<ApiResponse<Map<String, Object>>> trainFitModel() {
        try {
            Map<String, Object> result = mlTrainingOrchestratorService.exportAndTrainRemote();
            return ResponseEntity.ok(ApiResponse.success("Model training completed", result));
        } catch (BadRequestException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Get dashboard statistics
     */
    @GetMapping("/dashboard/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();

        // Order statistics
        stats.put("totalOrders", orderRepository.count());
        stats.put("pendingOrders", orderRepository.countByOrderStatus(OrderStatus.PLACED));
        stats.put("confirmedOrders", orderRepository.countByOrderStatus(OrderStatus.CONFIRMED));
        stats.put("shippedOrders", orderRepository.countByOrderStatus(OrderStatus.SHIPPED));
        stats.put("deliveredOrders", orderRepository.countByOrderStatus(OrderStatus.DELIVERED));
        stats.put("cancelledOrders", orderRepository.countByOrderStatus(OrderStatus.CANCELLED));

        // Revenue
        Double totalRevenue = orderRepository.getTotalRevenue();
        stats.put("totalRevenue", totalRevenue != null ? totalRevenue : 0.0);

        // Product statistics
        stats.put("totalProducts", productRepository.count());
        
        // User statistics
        stats.put("totalUsers", userRepository.count());

        stats.put("pendingDonationPickups", donationService.countPendingPickups());
        stats.put("pendingDonationBoxes", donationService.countPendingBoxes());

        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    /**
     * Get all orders (admin view)
     */
    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<Page<OrderDTO>>> getAllOrders(
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        
        Page<OrderDTO> orders;
        if (status != null) {
            orders = orderRepository.findByOrderStatus(status, pageable)
                    .map(order -> orderService.getOrderById(order.getUser().getId(), order.getId()));
        } else {
            orders = orderRepository.findAllByOrderByCreatedAtDesc(pageable)
                    .map(order -> orderService.getOrderById(order.getUser().getId(), order.getId()));
        }

        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    /**
     * Update order status
     */
    @PutMapping("/orders/{orderId}/status")
    public ResponseEntity<ApiResponse<OrderDTO>> updateOrderStatus(
            @PathVariable Long orderId,
            @RequestParam OrderStatus status) {
        
        var order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        
        order.setOrderStatus(status);
        
        if (status == OrderStatus.DELIVERED) {
            order.setDeliveredAt(java.time.LocalDateTime.now());
        } else if (status == OrderStatus.CANCELLED) {
            order.setCancelledAt(java.time.LocalDateTime.now());
        }
        
        orderRepository.save(order);
        
        OrderDTO orderDTO = orderService.getOrderById(order.getUser().getId(), orderId);
        return ResponseEntity.ok(ApiResponse.success("Order status updated", orderDTO));
    }

    /**
     * Get all users
     */
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<?>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        var users = userRepository.findAll(pageable);
        
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    /**
     * Disable/Enable user
     */
    @PutMapping("/users/{userId}/status")
    public ResponseEntity<ApiResponse<String>> updateUserStatus(
            @PathVariable Long userId,
            @RequestParam Boolean isActive) {
        
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setIsActive(isActive);
        userRepository.save(user);
        
        String message = isActive ? "User activated" : "User deactivated";
        return ResponseEntity.ok(ApiResponse.success(message, null));
    }
}

