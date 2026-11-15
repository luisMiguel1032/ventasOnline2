package com.amazonka.order.application;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import com.amazonka.order.api.dto.CheckoutRequest;
import com.amazonka.order.api.dto.OrderItemRequest;
import com.amazonka.order.api.dto.OrderResponse;
import com.amazonka.order.infrastructure.OrderRepository;
import com.amazonka.common.exception.ApiErrorCode;
import com.amazonka.common.exception.ApiException;

@Service
public class OrderService {

    private final OrderRepository repository;
    private final RestTemplate restTemplate;
    private final String catalogUrl;

    public OrderService(
            OrderRepository repository,
            RestTemplate restTemplate,
            @org.springframework.beans.factory.annotation.Value("${app.catalog-service-url}") String catalogUrl) {
        this.repository = repository;
        this.restTemplate = restTemplate;
        this.catalogUrl = catalogUrl;
    }

    @Transactional
    public OrderResponse checkout(UUID tenantId, UUID customerId, CheckoutRequest request) {
        UUID orderId = UUID.randomUUID();
        BigDecimal total = BigDecimal.ZERO;

        // Resolve product details first.
        List<ItemData> resolved = new java.util.ArrayList<>();
        for (OrderItemRequest item : request.items()) {
            Map<?, ?> product;
            try {
                product = restTemplate.getForObject(
                        catalogUrl + "/api/products/" + item.productId(),
                        Map.class);
            } catch (HttpClientErrorException ex) {
                throw new ApiException(HttpStatus.BAD_REQUEST, ApiErrorCode.DATOS_INVALIDOS,
                        "Producto no encontrado: " + item.productId());
            }

            if (product == null || product.get("name") == null || product.get("price") == null) {
                throw new ApiException(HttpStatus.BAD_REQUEST, ApiErrorCode.DATOS_INVALIDOS,
                        "Producto no válido: " + item.productId());
            }

            String name = String.valueOf(product.get("name"));
            BigDecimal price = new BigDecimal(String.valueOf(product.get("price")));
            BigDecimal lineTotal = price.multiply(item.quantity());
            total = total.add(lineTotal);

            resolved.add(new ItemData(item.productId(), name, price, item.quantity(), lineTotal));
        }

        repository.insertOrder(tenantId, orderId, customerId, total);
        for (ItemData data : resolved) {
            repository.insertItem(
                    tenantId, orderId, data.productId, data.productName,
                    data.unitPrice, data.quantity, data.lineTotal);
        }

        return repository.findOrder(tenantId, customerId, orderId);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> listOrders(UUID tenantId, UUID customerId) {
        return repository.findOrders(tenantId, customerId);
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrder(UUID tenantId, UUID customerId, UUID orderId) {
        OrderResponse order = repository.findOrder(tenantId, customerId, orderId);
        if (order == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, ApiErrorCode.NO_ENCONTRADO,
                    "Pedido no encontrado");
        }
        return order;
    }

    private record ItemData(
            UUID productId,
            String productName,
            BigDecimal unitPrice,
            BigDecimal quantity,
            BigDecimal lineTotal
    ) {
    }
}
