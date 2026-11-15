package com.amazonka.order.api.dto;

import java.math.BigDecimal;
import java.util.UUID;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

public record OrderItemRequest(
        @NotNull(message = "El producto es obligatorio")
        UUID productId,

        @NotNull(message = "La cantidad es obligatoria")
        @DecimalMin(value = "0.0001", message = "La cantidad debe ser mayor a cero")
        BigDecimal quantity
) {
}
