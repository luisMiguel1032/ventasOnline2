package com.amazonka.order.infrastructure;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import com.amazonka.order.api.dto.OrderItemResponse;
import com.amazonka.order.api.dto.OrderResponse;

@Repository
public class OrderRepository {

    private final NamedParameterJdbcTemplate jdbc;

    public OrderRepository(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void insertOrder(
            UUID tenantId,
            UUID id,
            UUID customerId,
            String orderNumber,
            String status,
            BigDecimal subtotal,
            BigDecimal discount,
            BigDecimal totalAmount,
            String paymentMethod,
            String shippingName,
            String shippingPhone,
            String shippingAddress,
            String shippingCity,
            String shippingNotes,
            String notes) {

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("id", id)
                .addValue("tenantId", tenantId)
                .addValue("customerId", customerId)
                .addValue("orderNumber", orderNumber)
                .addValue("status", status)
                .addValue("subtotal", subtotal)
                .addValue("discount", discount)
                .addValue("totalAmount", totalAmount)
                .addValue("paymentMethod", blankToNull(paymentMethod))
                .addValue("shippingName", blankToNull(shippingName))
                .addValue("shippingPhone", blankToNull(shippingPhone))
                .addValue("shippingAddress", blankToNull(shippingAddress))
                .addValue("shippingCity", blankToNull(shippingCity))
                .addValue("shippingNotes", blankToNull(shippingNotes))
                .addValue("notes", blankToNull(notes));

        jdbc.update("""
                insert into orders (
                    id, tenant_id, customer_id, order_number, status,
                    subtotal, discount, total_amount, payment_method,
                    shipping_name, shipping_phone, shipping_address, shipping_city,
                    shipping_notes, notes
                ) values (
                    :id, :tenantId, :customerId, :orderNumber, :status,
                    :subtotal, :discount, :totalAmount, :paymentMethod,
                    :shippingName, :shippingPhone, :shippingAddress, :shippingCity,
                    :shippingNotes, :notes
                )
                """, params);
    }

    public void insertStatusHistory(UUID tenantId, UUID orderId, String fromStatus, String toStatus, String note) {
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("id", UUID.randomUUID())
                .addValue("tenantId", tenantId)
                .addValue("orderId", orderId)
                .addValue("fromStatus", fromStatus)
                .addValue("toStatus", toStatus)
                .addValue("note", blankToNull(note));

        jdbc.update("""
                insert into order_status_history (id, tenant_id, order_id, from_status, to_status, note)
                values (:id, :tenantId, :orderId, :fromStatus, :toStatus, :note)
                """, params);
    }

    public void insertItem(
            UUID tenantId,
            UUID orderId,
            UUID productId,
            String productName,
            String productSlug,
            String imageUrl,
            BigDecimal unitPrice,
            BigDecimal quantity,
            BigDecimal lineTotal) {

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("id", UUID.randomUUID())
                .addValue("tenantId", tenantId)
                .addValue("orderId", orderId)
                .addValue("productId", productId)
                .addValue("productName", productName)
                .addValue("productSlug", blankToNull(productSlug))
                .addValue("imageUrl", blankToNull(imageUrl))
                .addValue("unitPrice", unitPrice)
                .addValue("quantity", quantity)
                .addValue("lineTotal", lineTotal);

        jdbc.update("""
                insert into order_items (
                    id, tenant_id, order_id, product_id, product_name, product_slug, image_url,
                    unit_price, quantity, line_total
                ) values (
                    :id, :tenantId, :orderId, :productId, :productName, :productSlug, :imageUrl,
                    :unitPrice, :quantity, :lineTotal
                )
                """, params);
    }

    public List<OrderResponse> findOrders(UUID tenantId, UUID customerId) {
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("tenantId", tenantId)
                .addValue("customerId", customerId);

        List<Map<String, Object>> orders = jdbc.queryForList("""
                select id, order_number, status, subtotal, discount, total_amount,
                       payment_method, payment_status, shipping_name, shipping_phone,
                       shipping_address, shipping_city, shipping_notes, notes,
                       created_at, updated_at
                from orders
                where tenant_id = :tenantId and customer_id = :customerId
                order by created_at desc
                """, params);

        List<OrderResponse> result = new ArrayList<>();
        for (Map<String, Object> row : orders) {
            UUID orderId = (UUID) row.get("id");
            result.add(mapOrder(row, findItems(tenantId, orderId)));
        }
        return result;
    }

    public OrderResponse findOrder(UUID tenantId, UUID customerId, UUID orderId) {
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("tenantId", tenantId)
                .addValue("customerId", customerId)
                .addValue("orderId", orderId);

        List<Map<String, Object>> orders = jdbc.queryForList("""
                select id, order_number, status, subtotal, discount, total_amount,
                       payment_method, payment_status, shipping_name, shipping_phone,
                       shipping_address, shipping_city, shipping_notes, notes,
                       created_at, updated_at
                from orders
                where tenant_id = :tenantId and customer_id = :customerId and id = :orderId
                """, params);

        if (orders.isEmpty()) {
            return null;
        }

        Map<String, Object> row = orders.get(0);
        UUID id = (UUID) row.get("id");
        return mapOrder(row, findItems(tenantId, id));
    }

    private OrderResponse mapOrder(Map<String, Object> row, List<OrderItemResponse> items) {
        return new OrderResponse(
                (UUID) row.get("id"),
                (String) row.get("order_number"),
                (String) row.get("status"),
                (BigDecimal) row.get("subtotal"),
                (BigDecimal) row.get("discount"),
                (BigDecimal) row.get("total_amount"),
                (String) row.get("payment_method"),
                (String) row.get("payment_status"),
                (String) row.get("shipping_name"),
                (String) row.get("shipping_phone"),
                (String) row.get("shipping_address"),
                (String) row.get("shipping_city"),
                (String) row.get("shipping_notes"),
                (String) row.get("notes"),
                toInstant(row.get("created_at")),
                toInstant(row.get("updated_at")),
                items
        );
    }

    private List<OrderItemResponse> findItems(UUID tenantId, UUID orderId) {
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("tenantId", tenantId)
                .addValue("orderId", orderId);

        return jdbc.query("""
                select product_id, product_name, product_slug, image_url, unit_price, quantity, line_total
                from order_items
                where tenant_id = :tenantId and order_id = :orderId
                order by created_at asc, id asc
                """, params, (rs, rowNum) -> new OrderItemResponse(
                rs.getObject("product_id", UUID.class),
                rs.getString("product_name"),
                rs.getString("product_slug"),
                rs.getString("image_url"),
                rs.getBigDecimal("unit_price"),
                rs.getBigDecimal("quantity"),
                rs.getBigDecimal("line_total")
        ));
    }

    private static Instant toInstant(Object value) {
        if (value instanceof Timestamp ts) {
            return ts.toInstant();
        }
        return null;
    }

    private static String blankToNull(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        return value.trim();
    }
}
