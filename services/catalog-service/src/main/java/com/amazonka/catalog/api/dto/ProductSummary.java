package com.amazonka.catalog.api.dto;

import java.math.BigDecimal;
import java.util.UUID;

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
        String brandName
) {
}
