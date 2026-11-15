package com.amazonka.order.infrastructure;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.sql.Types;
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

    public void insertOrder(UUID tenantId, UUID id, UUID customerId, BigDecimal totalAmount) {
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("id", id)
                .addValue("tenantId", tenantId)
                .addValue("customerId", customerId)
                .addValue("totalAmount", totalAmount);

        jdbc.update("""
                insert into orders (id, tenant_id, customer_id, total_amount)
                values (:id, :tenantId, :customerId, :totalAmount)
                """, params);
    }

    public void insertItem(
            UUID tenantId,
            UUID orderId,
            UUID productId,
            String productName,
            BigDecimal unitPrice,
            BigDecimal quantity,
            BigDecimal lineTotal) {

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("id", UUID.randomUUID())
                .addValue("tenantId", tenantId)
                .addValue("orderId", orderId)
                .addValue("productId", productId)
                .addValue("productName", productName)
                .addValue("unitPrice", unitPrice)
                .addValue("quantity", quantity)
                .addValue("lineTotal", lineTotal);

        jdbc.update("""
                insert into order_items (
                    id, tenant_id, order_id, product_id, product_name,
                    unit_price, quantity, line_total
                ) values (
                    :id, :tenantId, :orderId, :productId, :productName,
                    :unitPrice, :quantity, :lineTotal
                )
                """, params);
    }

    public List<OrderResponse> findOrders(UUID tenantId, UUID customerId) {
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("tenantId", tenantId)
                .addValue("customerId", customerId);

        List<Map<String, Object>> orders = jdbc.queryForList("""
                select id, status, total_amount, created_at
                from orders
                where tenant_id = :tenantId and customer_id = :customerId
                order by created_at desc
                """, params);

        List<OrderResponse> result = new ArrayList<>();
        for (Map<String, Object> row : orders) {
            UUID orderId = (UUID) row.get("id");
            result.add(new OrderResponse(
                    orderId,
                    (String) row.get("status"),
                    (BigDecimal) row.get("total_amount"),
                    ((Timestamp) row.get("created_at")).toInstant(),
                    findItems(tenantId, orderId)
            ));
        }
        return result;
    }

    public OrderResponse findOrder(UUID tenantId, UUID customerId, UUID orderId) {
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("tenantId", tenantId)
                .addValue("customerId", customerId)
                .addValue("orderId", orderId);

        List<Map<String, Object>> orders = jdbc.queryForList("""
                select id, status, total_amount, created_at
                from orders
                where tenant_id = :tenantId and customer_id = :customerId and id = :orderId
                """, params);

        if (orders.isEmpty()) {
            return null;
        }

        Map<String, Object> row = orders.get(0);
        UUID id = (UUID) row.get("id");
        return new OrderResponse(
                id,
                (String) row.get("status"),
                (BigDecimal) row.get("total_amount"),
                ((Timestamp) row.get("created_at")).toInstant(),
                findItems(tenantId, id)
        );
    }

    private List<OrderItemResponse> findItems(UUID tenantId, UUID orderId) {
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("tenantId", tenantId)
                .addValue("orderId", orderId);

        return jdbc.query("""
                select product_id, product_name, unit_price, quantity, line_total
                from order_items
                where tenant_id = :tenantId and order_id = :orderId
                order by id asc
                """, params, (rs, rowNum) -> new OrderItemResponse(
                rs.getObject("product_id", UUID.class),
                rs.getString("product_name"),
                rs.getBigDecimal("unit_price"),
                rs.getBigDecimal("quantity"),
                rs.getBigDecimal("line_total")
        ));
    }
}
