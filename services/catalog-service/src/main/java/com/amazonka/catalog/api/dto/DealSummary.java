package com.amazonka.catalog.api.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Oferta lista para pintar en la tienda o en el panel de administración.
 * El precio de oferta se calcula desde el precio actual del producto.
 */
public record DealSummary(
        UUID id,
        UUID productId,
        String productName,
        String productSlug,
        String image,
        String categoryName,
        String brandName,
        BigDecimal originalPrice,
        BigDecimal dealPrice,
        BigDecimal discountPercent,
        String dealType,
        String title,
        Instant startsAt,
        Instant endsAt,
        BigDecimal stockLimit,
        BigDecimal stockSold,
        BigDecimal stockRemaining,
        Integer stockPercent,
        BigDecimal productStock,
        BigDecimal ratingAvg,
        Integer ratingCount,
        Integer status,
        boolean active
) {
}
