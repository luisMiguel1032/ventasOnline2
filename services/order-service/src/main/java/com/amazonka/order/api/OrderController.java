package com.amazonka.order.api;

import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.amazonka.order.api.dto.CheckoutRequest;
import com.amazonka.order.api.dto.OrderResponse;
import com.amazonka.order.application.OrderService;
import com.amazonka.common.exception.ApiErrorCode;
import com.amazonka.common.exception.ApiException;
import com.amazonka.common.security.JwtPrincipal;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;
    private final UUID defaultTenantId;

    public OrderController(
            OrderService orderService,
            @Value("${app.default-tenant-id}") UUID defaultTenantId) {
        this.orderService = orderService;
        this.defaultTenantId = defaultTenantId;
    }

    @GetMapping
    public ResponseEntity<List<OrderResponse>> list(@AuthenticationPrincipal Jwt jwt) {
        JwtPrincipal p = requireCustomer(jwt);
        return ResponseEntity.ok(orderService.listOrders(tenant(p), p.subjectId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> get(
            @PathVariable UUID id,
            @AuthenticationPrincipal Jwt jwt) {
        JwtPrincipal p = requireCustomer(jwt);
        return ResponseEntity.ok(orderService.getOrder(tenant(p), p.subjectId(), id));
    }

    @PostMapping
    public ResponseEntity<OrderResponse> checkout(
            @Valid @RequestBody CheckoutRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        JwtPrincipal p = requireCustomer(jwt);
        OrderResponse order = orderService.checkout(tenant(p), p.subjectId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(order);
    }

    private JwtPrincipal requireCustomer(Jwt jwt) {
        if (jwt == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, ApiErrorCode.NO_AUTORIZADO,
                    "Autenticación requerida");
        }
        JwtPrincipal p = JwtPrincipal.from(jwt);
        if (!p.isCustomer() && !p.isAdmin()) {
            throw new ApiException(HttpStatus.FORBIDDEN, ApiErrorCode.PROHIBIDO,
                    "Solo clientes pueden comprar");
        }
        return p;
    }

    private UUID tenant(JwtPrincipal p) {
        return p.tenantId() == null ? defaultTenantId : p.tenantId();
    }
}
