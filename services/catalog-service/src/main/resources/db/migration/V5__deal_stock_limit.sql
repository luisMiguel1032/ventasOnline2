-- =====================================================================
-- catalog-service: exponer el stock configurado de la oferta en la vista
-- de productos. CREATE OR REPLACE VIEW solo permite agregar columnas al
-- final, por eso deal_stock_limit queda después de deal_stock_percent.
-- =====================================================================

CREATE OR REPLACE VIEW v_shop_products AS
SELECT
    p.id,
    p.tenant_id,
    p.code,
    p.item_code,
    p.name,
    p.description,
    p.slug,
    p.image,
    p.features,
    p.type,
    p.price,
    p.stock,
    p.rating_avg,
    p.rating_count,
    p.category_id AS categorie_id,
    c.name AS category_name,
    p.brand_id,
    b.name AS brand_name,
    p.unit_name,
    p.created_at,
    p.updated_at,
    d.id AS deal_id,
    round(p.price * (1 - d.discount_percent / 100), 2) AS deal_price,
    d.discount_percent AS deal_discount_percent,
    d.deal_type,
    d.title AS deal_title,
    d.ends_at AS deal_ends_at,
    least(greatest(d.stock_limit - d.stock_sold, 0), p.stock) AS deal_stock_remaining,
    CASE
        WHEN d.stock_limit > 0
            THEN round(((d.stock_limit - d.stock_sold) / d.stock_limit) * 100)
        ELSE 0
    END AS deal_stock_percent,
    d.stock_limit AS deal_stock_limit
FROM products p
LEFT JOIN categories c
    ON c.id = p.category_id AND c.tenant_id = p.tenant_id
LEFT JOIN brands b
    ON b.id = p.brand_id AND b.tenant_id = p.tenant_id
LEFT JOIN product_deals d
    ON d.tenant_id = p.tenant_id
    AND d.product_id = p.id
    AND d.status = 1
    AND now() >= d.starts_at
    AND now() < d.ends_at
    AND d.stock_sold < d.stock_limit
WHERE p.status = 1;
