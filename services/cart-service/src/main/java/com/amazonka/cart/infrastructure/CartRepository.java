package com.amazonka.cart.infrastructure;

import java.math.BigDecimal;
import java.sql.Types;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import com.amazonka.cart.api.dto.CartItemResponse;

@Repository
public class CartRepository {

    private final NamedParameterJdbcTemplate jdbc;

    public CartRepository(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public UUID getOrCreateCart(UUID tenantId, UUID customerId) {
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("tenantId", tenantId)
                .addValue("customerId", customerId);

        List<UUID> existing = jdbc.query(
                "select id from carts where tenant_id = :tenantId and customer_id = :customerId",
                params,
                (rs, rowNum) -> rs.getObject("id", UUID.class));

        if (!existing.isEmpty()) {
            return existing.get(0);
        }

        UUID id = UUID.randomUUID();
        params.addValue("id", id);
        jdbc.update("""
                insert into carts (id, tenant_id, customer_id)
                values (:id, :tenantId, :customerId)
                """, params);
        return id;
    }

    public List<CartItemResponse> findItems(UUID tenantId, UUID customerId) {
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("tenantId", tenantId)
                .addValue("customerId", customerId);

        return jdbc.query("""
                select ci.product_id, ci.quantity
                from cart_items ci
                join carts c on c.id = ci.cart_id
                where c.tenant_id = :tenantId and c.customer_id = :customerId
                order by ci.created_at asc
                """, params, (rs, rowNum) -> new CartItemResponse(
                rs.getObject("product_id", UUID.class),
                rs.getBigDecimal("quantity")
        ));
    }

    public void upsertItem(UUID tenantId, UUID customerId, UUID productId, BigDecimal quantity) {
        UUID cartId = getOrCreateCart(tenantId, customerId);

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("tenantId", tenantId)
                .addValue("cartId", cartId)
                .addValue("productId", productId)
                .addValue("quantity", quantity);

        // update if exists
        int updated = jdbc.update("""
                update cart_items
                set quantity = :quantity, updated_at = now()
                where cart_id = :cartId and product_id = :productId
                """, params);

        if (updated == 0) {
            params.addValue("id", UUID.randomUUID());
            jdbc.update("""
                    insert into cart_items (id, tenant_id, cart_id, product_id, quantity)
                    values (:id, :tenantId, :cartId, :productId, :quantity)
                    """, params);
        }
    }

    public void removeItem(UUID tenantId, UUID customerId, UUID productId) {
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("tenantId", tenantId)
                .addValue("customerId", customerId)
                .addValue("productId", productId);

        jdbc.update("""
                delete from cart_items ci
                using carts c
                where ci.cart_id = c.id
                  and c.tenant_id = :tenantId
                  and c.customer_id = :customerId
                  and ci.product_id = :productId
                """, params);
    }

    public void clear(UUID tenantId, UUID customerId) {
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("tenantId", tenantId)
                .addValue("customerId", customerId);

        jdbc.update("""
                delete from cart_items ci
                using carts c
                where ci.cart_id = c.id
                  and c.tenant_id = :tenantId
                  and c.customer_id = :customerId
                """, params);
    }
}
