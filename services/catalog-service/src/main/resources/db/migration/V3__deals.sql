-- =====================================================================
-- catalog-service: ofertas (deals)
--
-- Modelo inspirado en las "Deals" de Amazon:
--   * DAILY      -> oferta del día
--   * LIGHTNING  -> oferta relámpago (poco stock y termina pronto)
--   * FEATURED   -> oferta destacada
--
-- Un producto puede tener como máximo una configuración de oferta
-- activa. El historial se conserva cambiando status a 0.
-- =====================================================================

CREATE TABLE product_deals (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id         uuid NOT NULL,
    product_id        uuid NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    title             varchar(160),
    deal_type         varchar(20) NOT NULL DEFAULT 'DAILY',
    discount_percent  numeric(5, 2) NOT NULL
        CHECK (discount_percent > 0 AND discount_percent <= 90),
    stock_limit       numeric(14, 4) NOT NULL DEFAULT 0 CHECK (stock_limit >= 0),
    stock_sold        numeric(14, 4) NOT NULL DEFAULT 0 CHECK (stock_sold >= 0),
    starts_at         timestamptz NOT NULL DEFAULT now(),
    ends_at           timestamptz NOT NULL,
    status            smallint NOT NULL DEFAULT 1,
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ck_product_deals_type
        CHECK (deal_type IN ('DAILY', 'LIGHTNING', 'FEATURED')),
    CONSTRAINT ck_product_deals_window
        CHECK (ends_at > starts_at)
);

CREATE INDEX idx_product_deals_tenant_active
    ON product_deals (tenant_id, status, starts_at, ends_at);

CREATE INDEX idx_product_deals_product
    ON product_deals (tenant_id, product_id);

-- Solo una oferta "viva" por producto. Las cerradas (status = 0) quedan
-- como historial y no bloquean una nueva configuración.
CREATE UNIQUE INDEX uq_product_deals_active_product
    ON product_deals (tenant_id, product_id)
    WHERE status = 1;

-- ---------------------------------------------------------------------
-- Vista de lectura para el listado/detalle de ofertas.
-- El precio de oferta se calcula siempre desde el precio actual del
-- producto para no quedar desactualizado si el admin cambia el precio.
-- ---------------------------------------------------------------------
CREATE VIEW v_shop_deals AS
SELECT
    d.id,
    d.tenant_id,
    d.product_id,
    p.name            AS product_name,
    p.slug            AS product_slug,
    p.image,
    p.category_id     AS categorie_id,
    c.name            AS category_name,
    p.brand_id,
    b.name            AS brand_name,
    p.price           AS original_price,
    round(p.price * (1 - d.discount_percent / 100), 2) AS deal_price,
    d.discount_percent,
    d.deal_type,
    d.title,
    d.starts_at,
    d.ends_at,
    d.stock_limit,
    d.stock_sold,
    least(greatest(d.stock_limit - d.stock_sold, 0), p.stock) AS stock_remaining,
    CASE
        WHEN d.stock_limit > 0
            THEN round(((d.stock_limit - d.stock_sold) / d.stock_limit) * 100)
        ELSE 0
    END AS stock_percent,
    p.stock           AS product_stock,
    p.rating_avg,
    p.rating_count,
    d.status,
    (d.status = 1
        AND now() >= d.starts_at
        AND now() < d.ends_at
        AND d.stock_sold < d.stock_limit) AS is_active,
    d.created_at      AS deal_created_at,
    d.updated_at      AS deal_updated_at
FROM product_deals d
JOIN products p
    ON p.id = d.product_id AND p.tenant_id = d.tenant_id
LEFT JOIN categories c
    ON c.id = p.category_id AND c.tenant_id = p.tenant_id
LEFT JOIN brands b
    ON b.id = p.brand_id AND b.tenant_id = p.tenant_id
WHERE p.status = 1;

-- ---------------------------------------------------------------------
-- Ampliamos v_shop_products con la oferta vigente (si existe).
-- CREATE OR REPLACE VIEW permite agregar columnas al final.
-- ---------------------------------------------------------------------
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
    END AS deal_stock_percent
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
