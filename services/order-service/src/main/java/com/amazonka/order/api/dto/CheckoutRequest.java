package com.amazonka.order.api.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

public record CheckoutRequest(
        @NotEmpty(message = "El pedido debe tener al menos un producto")
        List<@Valid OrderItemRequest> items
) {
}
