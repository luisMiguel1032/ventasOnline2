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
                select ci.product_id, ci.quantity, ci.product_name, ci.product_slug, ci.image_url, ci.unit_price
                from cart_items ci
                join carts c on c.id = ci.cart_id
                where c.tenant_id = :tenantId and c.customer_id = :customerId
                order by ci.created_at asc
                """, params, (rs, rowNum) -> new CartItemResponse(
                rs.getObject("product_id", UUID.class),
                rs.getBigDecimal("quantity"),
                rs.getString("product_name"),
                rs.getString("product_slug"),
                rs.getString("image_url"),
                rs.getBigDecimal("unit_price")
        ));
    }

    public void upsertItem(UUID tenantId, UUID customerId, UUID productId, BigDecimal quantity,
                           String productName, String productSlug, String imageUrl, BigDecimal unitPrice) {
        UUID cartId = getOrCreateCart(tenantId, customerId);

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("tenantId", tenantId)
                .addValue("cartId", cartId)
                .addValue("productId", productId)
                .addValue("quantity", quantity)
                .addValue("productName", blankToNull(productName))
                .addValue("productSlug", blankToNull(productSlug))
                .addValue("imageUrl", blankToNull(imageUrl))
                .addValue("unitPrice", unitPrice);

        // update if exists (preserve snapshot if not provided)
        int updated = jdbc.update("""
                update cart_items
                set quantity = :quantity,
                    product_name = coalesce(:productName, product_name),
                    product_slug = coalesce(:productSlug, product_slug),
                    image_url = coalesce(:imageUrl, image_url),
                    unit_price = coalesce(:unitPrice, unit_price),
                    updated_at = now()
                where cart_id = :cartId and product_id = :productId
                """, params);

        if (updated == 0) {
            params.addValue("id", UUID.randomUUID());
            jdbc.update("""
                    insert into cart_items (id, tenant_id, cart_id, product_id, quantity, product_name, product_slug, image_url, unit_price)
                    values (:id, :tenantId, :cartId, :productId, :quantity, :productName, :productSlug, :imageUrl, :unitPrice)
                    """, params);
        }
    }

    private static String blankToNull(String value) {
        if (value == null || value.trim().isEmpty()) return null;
        return value.trim();
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
