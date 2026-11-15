package com.amazonka.cart.api.dto;

import java.util.List;

public record CartResponse(
        List<CartItemResponse> items
) {
}
