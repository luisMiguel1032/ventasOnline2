package com.amazonka.order.application;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

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

    private static final DateTimeFormatter ORDER_NUMBER_FMT = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

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
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal discount = BigDecimal.ZERO;

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

            if (product == null || product.get("name") == null) {
                throw new ApiException(HttpStatus.BAD_REQUEST, ApiErrorCode.DATOS_INVALIDOS,
                        "Producto no válido: " + item.productId());
            }

            String name = String.valueOf(product.get("name"));
            String slug = product.get("slug") == null ? null : String.valueOf(product.get("slug"));
            String image = product.get("image") == null ? null : String.valueOf(product.get("image"));

            // Prefer dealPrice when present (e-commerce storefront behavior), fallback to price.
            Object effective = product.get("dealPrice") != null ? product.get("dealPrice") : product.get("price");
            if (effective == null) {
                throw new ApiException(HttpStatus.BAD_REQUEST, ApiErrorCode.DATOS_INVALIDOS,
                        "Producto sin precio: " + item.productId());
            }

            BigDecimal price = new BigDecimal(String.valueOf(effective));
            BigDecimal lineTotal = price.multiply(item.quantity());
            subtotal = subtotal.add(lineTotal);

            resolved.add(new ItemData(item.productId(), name, slug, image, price, item.quantity(), lineTotal));
        }

        BigDecimal total = subtotal.subtract(discount);
        if (total.compareTo(BigDecimal.ZERO) < 0) {
            total = BigDecimal.ZERO;
        }

        String orderNumber = generateOrderNumber();

        repository.insertOrder(
                tenantId,
                orderId,
                customerId,
                orderNumber,
                "CREATED",
                subtotal,
                discount,
                total,
                request == null ? null : request.paymentMethod(),
                request == null ? null : request.shippingName(),
                request == null ? null : request.shippingPhone(),
                request == null ? null : request.shippingAddress(),
                request == null ? null : request.shippingCity(),
                request == null ? null : request.shippingNotes(),
                request == null ? null : request.notes());

        repository.insertStatusHistory(tenantId, orderId, null, "CREATED", "Pedido creado desde checkout web");

        for (ItemData data : resolved) {
            repository.insertItem(
                    tenantId, orderId, data.productId, data.productName, data.productSlug, data.imageUrl,
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

    private static String generateOrderNumber() {
        String ts = LocalDateTime.now().format(ORDER_NUMBER_FMT);
        int rnd = ThreadLocalRandom.current().nextInt(1000, 9999);
        return "ORD-" + ts + "-" + rnd;
    }

    private record ItemData(
            UUID productId,
            String productName,
            String productSlug,
            String imageUrl,
            BigDecimal unitPrice,
            BigDecimal quantity,
            BigDecimal lineTotal
    ) {
    }
}
