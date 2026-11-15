package com.amazonka.cart.api;

import java.math.BigDecimal;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.amazonka.cart.api.dto.CartItemRequest;
import com.amazonka.cart.api.dto.CartResponse;
import com.amazonka.cart.application.CartService;
import com.amazonka.common.exception.ApiErrorCode;
import com.amazonka.common.exception.ApiException;
import com.amazonka.common.security.JwtPrincipal;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final CartService cartService;
    private final UUID defaultTenantId;

    public CartController(
            CartService cartService,
            @Value("${app.default-tenant-id}") UUID defaultTenantId) {
        this.cartService = cartService;
        this.defaultTenantId = defaultTenantId;
    }

    @GetMapping
    public ResponseEntity<CartResponse> get(@AuthenticationPrincipal Jwt jwt) {
        JwtPrincipal p = requireCustomer(jwt);
        return ResponseEntity.ok(cartService.getCart(tenant(p), p.subjectId()));
    }

    @PostMapping("/items")
    public ResponseEntity<CartResponse> add(
            @Valid @RequestBody CartItemRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        JwtPrincipal p = requireCustomer(jwt);
        return ResponseEntity.ok(cartService.addItem(tenant(p), p.subjectId(), request));
    }

    @PutMapping("/items/{productId}")
    public ResponseEntity<CartResponse> update(
            @PathVariable UUID productId,
            @RequestBody CartItemRequest body,
            @AuthenticationPrincipal Jwt jwt) {
        JwtPrincipal p = requireCustomer(jwt);
        BigDecimal qty = body == null ? null : body.quantity();
        return ResponseEntity.ok(cartService.updateItem(tenant(p), p.subjectId(), productId, qty));
    }

    @DeleteMapping("/items/{productId}")
    public ResponseEntity<CartResponse> remove(
            @PathVariable UUID productId,
            @AuthenticationPrincipal Jwt jwt) {
        JwtPrincipal p = requireCustomer(jwt);
        return ResponseEntity.ok(cartService.removeItem(tenant(p), p.subjectId(), productId));
    }

    @DeleteMapping
    public ResponseEntity<Void> clear(@AuthenticationPrincipal Jwt jwt) {
        JwtPrincipal p = requireCustomer(jwt);
        cartService.clear(tenant(p), p.subjectId());
        return ResponseEntity.noContent().build();
    }

    private JwtPrincipal requireCustomer(Jwt jwt) {
        if (jwt == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, ApiErrorCode.NO_AUTORIZADO,
                    "Autenticación requerida");
        }
        JwtPrincipal p = JwtPrincipal.from(jwt);
        if (!p.isCustomer() && !p.isAdmin()) {
            throw new ApiException(HttpStatus.FORBIDDEN, ApiErrorCode.PROHIBIDO,
                    "Solo clientes pueden usar el carrito");
        }
        return p;
    }

    private UUID tenant(JwtPrincipal p) {
        return p.tenantId() == null ? defaultTenantId : p.tenantId();
    }
}
