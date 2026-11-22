package com.amazonka.cart.api.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record CartItemResponse(
        UUID productId,
        BigDecimal quantity,
        String productName,
        String productSlug,
        String imageUrl,
        BigDecimal unitPrice
) {
}
