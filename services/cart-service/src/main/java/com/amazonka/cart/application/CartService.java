package com.amazonka.cart.application;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.amazonka.cart.api.dto.CartItemRequest;
import com.amazonka.cart.api.dto.CartItemResponse;
import com.amazonka.cart.api.dto.CartResponse;
import com.amazonka.cart.infrastructure.CartRepository;
import com.amazonka.common.exception.ApiErrorCode;
import com.amazonka.common.exception.ApiException;

@Service
public class CartService {

    private final CartRepository repository;

    public CartService(CartRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public CartResponse getCart(UUID tenantId, UUID customerId) {
        return new CartResponse(repository.findItems(tenantId, customerId));
    }

    @Transactional
    public CartResponse addItem(UUID tenantId, UUID customerId, CartItemRequest request) {
        if (request.quantity() == null || request.quantity().signum() <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, ApiErrorCode.DATOS_INVALIDOS,
                    "La cantidad debe ser mayor a cero");
        }
        repository.upsertItem(tenantId, customerId, request.productId(), request.quantity());
        return getCart(tenantId, customerId);
    }

    @Transactional
    public CartResponse updateItem(UUID tenantId, UUID customerId, UUID productId, BigDecimal quantity) {
        if (quantity == null || quantity.signum() <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, ApiErrorCode.DATOS_INVALIDOS,
                    "La cantidad debe ser mayor a cero");
        }
        repository.upsertItem(tenantId, customerId, productId, quantity);
        return getCart(tenantId, customerId);
    }

    @Transactional
    public CartResponse removeItem(UUID tenantId, UUID customerId, UUID productId) {
        repository.removeItem(tenantId, customerId, productId);
        return getCart(tenantId, customerId);
    }

    @Transactional
    public void clear(UUID tenantId, UUID customerId) {
        repository.clear(tenantId, customerId);
    }
}
