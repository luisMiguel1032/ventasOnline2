package com.amazonka.catalog.api.dto;

import java.util.UUID;

public record CategoryDto(
        UUID id,
        String name,
        String image,
        Integer sortOrder
) {
}
