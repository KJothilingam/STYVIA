package com.stylediscovery.mapper;

import com.stylediscovery.dto.AddressDTO;
import com.stylediscovery.dto.OrderDTO;
import com.stylediscovery.dto.OrderItemDTO;
import com.stylediscovery.entity.Order;
import com.stylediscovery.entity.OrderItem;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class OrderDtoMapper {

    public OrderDTO toDto(Order order) {
        List<OrderItem> lines = order.getItems();
        if (lines == null) {
            lines = Collections.emptyList();
        }
        List<OrderItemDTO> itemDTOs = lines.stream()
                .map(this::toItemDto)
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
                .customerEmail(order.getUser() != null ? order.getUser().getEmail() : null)
                .customerName(order.getUser() != null ? order.getUser().getName() : null)
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

    public OrderItemDTO toItemDto(OrderItem item) {
        return OrderItemDTO.builder()
                .id(item.getId())
                .productId(item.getProduct().getId())
                .productName(item.getProductName())
                .productBrand(item.getProductBrand())
                .size(item.getSize())
                .color(item.getColor())
                .price(item.getPrice())
                .quantity(item.getQuantity())
                .subtotal(item.getSubtotal())
                .build();
    }
}
