package com.amazonka.catalog.api.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ProductDetail(
        UUID id,
        String code,
        String itemCode,
        String name,
        String description,
        String slug,
        String image,
        String features,
        String type,
        BigDecimal price,
        BigDecimal stock,
        BigDecimal ratingAvg,
        Integer ratingCount,
        UUID categoryId,
        String categoryName,
        UUID brandId,
        String brandName,
        String unitName,
        List<String> images,
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
