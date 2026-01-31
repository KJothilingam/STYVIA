package com.stylediscovery.dto;

import com.stylediscovery.enums.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PlaceOrderRequest {
    
    @NotNull(message = "Address ID is required")
    private Long addressId;
    
    @NotNull(message = "Payment method is required")
    private PaymentMethod paymentMethod;
    
    private String couponCode;
}

