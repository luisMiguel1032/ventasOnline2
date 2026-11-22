package com.amazonka.order.api.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record OrderResponse(
        UUID id,
        String orderNumber,
        String status,
        BigDecimal subtotal,
        BigDecimal discount,
        BigDecimal totalAmount,
        String paymentMethod,
        String paymentStatus,
        String shippingName,
        String shippingPhone,
        String shippingAddress,
        String shippingCity,
        String shippingNotes,
        String notes,
        Instant createdAt,
        Instant updatedAt,
        List<OrderItemResponse> items
) {
}
