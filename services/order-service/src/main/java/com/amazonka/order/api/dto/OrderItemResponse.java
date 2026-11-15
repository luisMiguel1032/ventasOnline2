package com.amazonka.order.api.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record OrderItemResponse(
        UUID productId,
        String productName,
        BigDecimal unitPrice,
        BigDecimal quantity,
        BigDecimal lineTotal
) {
}
