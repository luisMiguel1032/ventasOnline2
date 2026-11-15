package com.amazonka.catalog.api.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Resumen de producto para listados. Los campos deal* llegan con valor
 * solo cuando el producto tiene una oferta vigente.
 */
public record ProductSummary(
        UUID id,
        String name,
        String slug,
        String image,
        BigDecimal price,
        BigDecimal stock,
        BigDecimal ratingAvg,
        Integer ratingCount,
        String categoryName,
        String brandName,
        UUID dealId,
        BigDecimal dealPrice,
        BigDecimal dealDiscountPercent,
        String dealType,
        String dealTitle,
        Instant dealEndsAt,
        BigDecimal dealStockRemaining,
        Integer dealStockPercent,
        BigDecimal dealStockLimit,
        String videoUrl
) {
}
